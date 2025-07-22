import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import {
  AuthResponseDto,
  LoginResponseDto,
  RegisterResponseDto,
} from './dto/auth-response.dto';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account and send email verification'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with this email already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'User with this email already exists' },
        data: { type: 'null' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        data: { type: 'null' }
      }
    }
  })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request
  ): Promise<AuthResponseDto<RegisterResponseDto>> {
    try {
      const result = await this.authService.register(registerDto);
      
      return {
        success: true,
        message: 'Registration successful',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return access token'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid credentials' },
        data: { type: 'null' }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request
  ): Promise<AuthResponseDto<LoginResponseDto>> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      const result = await this.authService.login(loginDto, ipAddress, userAgent);
      
      return {
        success: true,
        message: 'Login successful',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('verify-email')
  @ApiOperation({
    summary: 'Verify user email',
    description: 'Verify user email address using token from email'
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email verified successfully' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Email verified successfully. Welcome to Manga Store!' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired verification token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid or expired verification token' },
        data: { type: 'null' }
      }
    }
  })
  async verifyEmail(@Query('token') token: string): Promise<AuthResponseDto<{ message: string }>> {
    try {
      const result = await this.authService.verifyEmail(token);
      
      return {
        success: true,
        message: 'Email verified successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to user'
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password reset email sent' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'If an account with this email exists, a password reset link has been sent.' }
          }
        }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() req: Request
  ): Promise<AuthResponseDto<{ message: string }>> {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      const result = await this.authService.forgotPassword(forgotPasswordDto, ipAddress, userAgent);
      
      return {
        success: true,
        message: 'Password reset email sent',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset user password',
    description: 'Reset user password using token from email'
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password reset successful' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Password reset successful. Please log in with your new password.' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired reset token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid or expired reset token' },
        data: { type: 'null' }
      }
    }
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto
  ): Promise<AuthResponseDto<{ message: string }>> {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      
      return {
        success: true,
        message: 'Password reset successful',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}
