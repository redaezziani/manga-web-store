import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, RemoveFromCartDto } from './dto/cart.dto';
import { CartApiResponseDto, CartResponseDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@ApiTags('Shopping Cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user cart',
    description: 'Retrieve the current user\'s shopping cart with all items and summary'
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async getCart(@Request() req): Promise<CartApiResponseDto<CartResponseDto>> {
    try {
      const userId = req.user.id;
      
      const cart = await this.cartService.getCart(userId);
      
      return {
        success: true,
        message: 'Cart retrieved successfully',
        data: cart,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post('add')
  @ApiOperation({
    summary: 'Add item to cart',
    description: 'Add a manga volume to the shopping cart'
  })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Volume not available or insufficient stock',
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async addToCart(
    @Body() addToCartDto: AddToCartDto,
    @Request() req
  ): Promise<CartApiResponseDto<CartResponseDto>> {
    try {
      const userId = req.user.id;
      
      const cart = await this.cartService.addToCart(userId, addToCartDto);
      
      return {
        success: true,
        message: 'Item added to cart successfully',
        data: cart,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Put('update')
  @ApiOperation({
    summary: 'Update cart item quantity',
    description: 'Update the quantity of an existing cart item'
  })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Insufficient stock',
  })
  @ApiResponse({
    status: 404,
    description: 'Cart item not found',
  })
  async updateCartItem(
    @Body() updateCartItemDto: UpdateCartItemDto,
    @Request() req
  ): Promise<CartApiResponseDto<CartResponseDto>> {
    try {
      const userId = req.user.id;
      
      const cart = await this.cartService.updateCartItem(userId, updateCartItemDto);
      
      return {
        success: true,
        message: 'Cart item updated successfully',
        data: cart,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Delete('remove/:cartItemId')
  @ApiOperation({
    summary: 'Remove item from cart',
    description: 'Remove a specific item from the shopping cart'
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cart item not found',
  })
  async removeFromCart(
    @Param('cartItemId') cartItemId: string,
    @Request() req
  ): Promise<CartApiResponseDto<CartResponseDto>> {
    try {
      const userId = req.user.id;
      
      const cart = await this.cartService.removeFromCart(userId, cartItemId);
      
      return {
        success: true,
        message: 'Item removed from cart successfully',
        data: cart,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Delete('clear')
  @ApiOperation({
    summary: 'Clear cart',
    description: 'Remove all items from the shopping cart'
  })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cart cleared successfully' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Cart cleared successfully' }
          }
        }
      }
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Cart not found',
  })
  async clearCart(@Request() req): Promise<CartApiResponseDto<{ message: string }>> {
    try {
      const userId = req.user.id;
      
      const result = await this.cartService.clearCart(userId);
      
      return {
        success: true,
        message: 'Cart cleared successfully',
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

  @Get('count')
  @ApiOperation({
    summary: 'Get cart item count',
    description: 'Get the total number of items in the user\'s cart'
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Cart count retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 5 }
          }
        }
      }
    },
  })
  async getCartItemCount(@Request() req): Promise<CartApiResponseDto<{ count: number }>> {
    try {
      const userId = req.user.id;
      
      const result = await this.cartService.getCartItemCount(userId);
      
      return {
        success: true,
        message: 'Cart count retrieved successfully',
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
