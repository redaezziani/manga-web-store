import { 
  Injectable, 
  ConflictException, 
  UnauthorizedException, 
  NotFoundException,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SmtpService } from '../smtp/smtp.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { AuthUserDto, LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smtpService: SmtpService
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 12);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          displayName: registerDto.displayName || `${registerDto.firstName || ''} ${registerDto.lastName || ''}`.trim(),
          status: 'PENDING_VERIFICATION',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          role: true,
          status: true,
          isEmailVerified: true,
          createdAt: true,
        }
      });

      // Create email verification token
      const verificationToken = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      await this.prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: verificationToken,
          email: user.email,
          expiresAt,
        }
      });

      // Send verification email
      await this.smtpService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.displayName || user.firstName
      );

      this.logger.log(`New user registered: ${user.email}`);

      return {
        user: user as AuthUserDto,
        message: 'Registration successful. Please check your email to verify your account.'
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Registration failed:', error);
      throw new BadRequestException('Registration failed. Please try again.');
    }
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponseDto> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: loginDto.email }
      });

      if (!user) {
        // Log failed login attempt
        await this.logLoginAttempt(null, ipAddress, userAgent, false, 'User not found');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        // Log failed login attempt
        await this.logLoginAttempt(user.id, ipAddress, userAgent, false, 'Invalid password');
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
        await this.logLoginAttempt(user.id, ipAddress, userAgent, false, 'Account suspended or inactive');
        throw new UnauthorizedException('Account is suspended or inactive');
      }

      // Generate token
      const token = await this.generateToken(user.id);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastActiveAt: new Date(),
        }
      });

      // Log successful login
      await this.logLoginAttempt(user.id, ipAddress, userAgent, true);

      this.logger.log(`User logged in: ${user.email}`);

      return {
        token: token,
        expiresIn: this.getTokenExpirationTime(),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        } as AuthUserDto
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Login failed:', error);
      throw new BadRequestException('Login failed. Please try again.');
    }
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const verification = await this.prisma.emailVerification.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!verification || verification.isUsed || verification.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      // Mark token as used and verify user
      await this.prisma.$transaction([
        this.prisma.emailVerification.update({
          where: { id: verification.id },
          data: {
            isUsed: true,
            usedAt: new Date(),
          }
        }),
        this.prisma.user.update({
          where: { id: verification.userId },
          data: {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            status: 'ACTIVE',
          }
        })
      ]);

      // Send welcome email
      await this.smtpService.sendWelcomeEmail(
        verification.user.email,
        verification.user.displayName || verification.user.firstName || 'there'
      );

      this.logger.log(`Email verified for user: ${verification.user.email}`);

      return {
        message: 'Email verified successfully. Welcome to Manga Store!'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Email verification failed:', error);
      throw new BadRequestException('Email verification failed. Please try again.');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: forgotPasswordDto.email }
      });

      if (!user) {
        // Don't reveal that user doesn't exist
        return {
          message: 'If an account with this email exists, a password reset link has been sent.'
        };
      }

      // Generate reset token
      const resetToken = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          email: user.email,
          expiresAt,
          ipAddress,
          userAgent,
        }
      });

      // Send reset email
      await this.smtpService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.displayName || user.firstName
      );

      this.logger.log(`Password reset requested for user: ${user.email}`);

      return {
        message: 'If an account with this email exists, a password reset link has been sent.'
      };
    } catch (error) {
      this.logger.error('Password reset request failed:', error);
      throw new BadRequestException('Password reset request failed. Please try again.');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      const passwordReset = await this.prisma.passwordReset.findUnique({
        where: { token: resetPasswordDto.token },
        include: { user: true }
      });

      if (!passwordReset || passwordReset.isUsed || passwordReset.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 12);

      // Update password and mark token as used
      await this.prisma.$transaction([
        this.prisma.passwordReset.update({
          where: { id: passwordReset.id },
          data: {
            isUsed: true,
            usedAt: new Date(),
          }
        }),
        this.prisma.user.update({
          where: { id: passwordReset.userId },
          data: {
            password: hashedPassword,
          }
        })
      ]);

      this.logger.log(`Password reset completed for user: ${passwordReset.user.email}`);

      return {
        message: 'Password reset successful. Please log in with your new password.'
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Password reset failed:', error);
      throw new BadRequestException('Password reset failed. Please try again.');
    }
  }

  async validateUserById(userId: string): Promise<AuthUserDto | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          role: true,
          status: true,
          isEmailVerified: true,
          createdAt: true,
        }
      });

      if (!user) {
        return null;
      }

      // Update last active timestamp
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() }
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      };
    } catch (error) {
      this.logger.error('User validation by ID failed:', error);
      return null;
    }
  }

  private async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '24h'),
    });
  }

  private getTokenExpirationTime(): number {
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '24h');
    // Convert to seconds
    if (expiresIn.includes('h')) {
      return parseInt(expiresIn) * 3600;
    } else if (expiresIn.includes('d')) {
      return parseInt(expiresIn) * 24 * 3600;
    } else {
      return parseInt(expiresIn);
    }
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async logLoginAttempt(userId: string | null, ipAddress?: string, userAgent?: string, isSuccessful = true, failureReason?: string) {
    try {
      await this.prisma.loginHistory.create({
        data: {
          userId,
          ipAddress,
          userAgent,
          isSuccessful,
          failureReason,
        }
      });
    } catch (error) {
      // Log error but don't fail the main operation
      this.logger.error('Failed to log login attempt:', error);
    }
  }
}
