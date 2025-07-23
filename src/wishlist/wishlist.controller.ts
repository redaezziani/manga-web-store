import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger';
import { Request } from 'express';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddToWishlistDto, RemoveFromWishlistDto } from './dto/wishlist.dto';
import { 
  WishlistResponseDto, 
  WishlistItemDto, 
  WishlistApiResponseDto 
} from './dto/wishlist-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
    isEmailVerified: boolean;
  };
}

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Add manga to wishlist',
    description: 'Add a manga to the user\'s wishlist. Requires authentication.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Item added to wishlist successfully',
    type: WishlistApiResponseDto<WishlistItemDto>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid manga ID or validation errors'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing JWT token'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Manga not found'
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Manga is already in wishlist'
  })
  async addToWishlist(
    @Req() req: AuthenticatedRequest,
    @Body() addToWishlistDto: AddToWishlistDto
  ): Promise<WishlistApiResponseDto<WishlistItemDto>> {
    return this.wishlistService.addToWishlist(req.user.id, addToWishlistDto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Remove manga from wishlist',
    description: 'Remove a manga from the user\'s wishlist. Requires authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Item removed from wishlist successfully',
    type: WishlistApiResponseDto<null>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid manga ID or validation errors'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing JWT token'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Item not found in wishlist'
  })
  async removeFromWishlist(
    @Req() req: AuthenticatedRequest,
    @Body() removeFromWishlistDto: RemoveFromWishlistDto
  ): Promise<WishlistApiResponseDto<null>> {
    return this.wishlistService.removeFromWishlist(req.user.id, removeFromWishlistDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get user wishlist',
    description: 'Retrieve all items in the user\'s wishlist. Requires authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist retrieved successfully',
    type: WishlistApiResponseDto<WishlistResponseDto>
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing JWT token'
  })
  async getWishlist(
    @Req() req: AuthenticatedRequest
  ): Promise<WishlistApiResponseDto<WishlistResponseDto>> {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Get('count')
  @ApiOperation({ 
    summary: 'Get wishlist item count',
    description: 'Get the total number of items in the user\'s wishlist. Requires authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Wishlist count retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing JWT token'
  })
  async getWishlistCount(
    @Req() req: AuthenticatedRequest
  ): Promise<WishlistApiResponseDto<{ count: number }>> {
    return this.wishlistService.getWishlistCount(req.user.id);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Clear wishlist',
    description: 'Remove all items from the user\'s wishlist. Requires authentication.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist cleared successfully',
    type: WishlistApiResponseDto<null>
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing JWT token'
  })
  async clearWishlist(
    @Req() req: AuthenticatedRequest
  ): Promise<WishlistApiResponseDto<null>> {
    return this.wishlistService.clearWishlist(req.user.id);
  }

  @Get('check/:mangaId')
  @ApiOperation({ 
    summary: 'Check if manga is in wishlist',
    description: 'Check if a specific manga is in the user\'s wishlist. Requires authentication.'
  })
  @ApiParam({ 
    name: 'mangaId', 
    description: 'Manga ID to check',
    example: 'cm0x1y2z3...'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Wishlist status checked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Wishlist status checked successfully' },
        data: {
          type: 'object',
          properties: {
            inWishlist: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - invalid or missing JWT token'
  })
  async checkIfInWishlist(
    @Req() req: AuthenticatedRequest,
    @Param('mangaId') mangaId: string
  ): Promise<WishlistApiResponseDto<{ inWishlist: boolean }>> {
    return this.wishlistService.checkIfInWishlist(req.user.id, mangaId);
  }
}
