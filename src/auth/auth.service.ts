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
        where: { email: loginDto.email },
        include: { refreshTokens: true }
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

      // Generate tokens
      const tokens = await this.generateTokens(user.id);

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastActiveAt: new Date(),
        }
      });

      // Clean up old refresh tokens
      await this.cleanupRefreshTokens(user.id);

      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

      // Log successful login
      await this.logLoginAttempt(user.id, ipAddress, userAgent, true);

      this.logger.log(`User logged in: ${user.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: parseInt(this.configService.get('JWT_EXPIRES_IN', '3600')),
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
        }),
        // Revoke all refresh tokens for security
        this.prisma.refreshToken.updateMany({
          where: { userId: passwordReset.userId },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
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

  private async generateTokens(userId: string) {
    const payload = { sub: userId };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '1h'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async storeRefreshToken(userId: string, token: string, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      }
    });
  }

  private async cleanupRefreshTokens(userId: string) {
    // Remove expired tokens
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ]
      }
    });
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

  async refreshToken(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<LoginResponseDto> {
    try {
      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Find the refresh token in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Check if user is still active
      const user = storedToken.user;
      if (user.status !== 'ACTIVE' && user.status !== 'PENDING_VERIFICATION') {
        throw new UnauthorizedException('Account is suspended or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id);

      // Revoke the old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        }
      });

      // Store new refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken, ipAddress, userAgent);

      // Clean up old refresh tokens
      await this.cleanupRefreshTokens(user.id);

      // Update last active timestamp
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      });

      this.logger.log(`Token refreshed for user: ${user.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: parseInt(this.configService.get('JWT_EXPIRES_IN', '3600')),
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
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
