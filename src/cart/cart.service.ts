import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  Logger 
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { CartResponseDto, CartItemDto, CartVolumeDto, CartSummaryDto } from './dto/cart-response.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    try {
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          cartItems: {
            include: {
              volume: {
                
                include: {
                  manga: {
                    select: {
                      id: true,
                      title: true,
                      author: true,
                      coverImage: true,
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // Create cart if it doesn't exist
      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId },
          include: {
            cartItems: {
              include: {
                volume: {
                  include: {
                    manga: {
                      select: {
                        id: true,
                        title: true,
                        author: true,
                        coverImage: true,
                      }
                    }
                  }
                }
              }
            }
          }
        });
      }

      return this.transformCartResponse(cart);
    } catch (error) {
      this.logger.error('Failed to get cart:', error);
      throw new BadRequestException('Failed to retrieve cart');
    }
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartResponseDto> {
    try {
      // Check if volume exists and is available
      const volume = await this.prisma.volume.findUnique({
        where: { id: addToCartDto.volumeId },
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              isAvailable: true,
            }
          }
        }
      });

      if (!volume) {
        throw new NotFoundException('Volume not found');
      }

      if (!volume.isAvailable || !volume.manga.isAvailable) {
        throw new BadRequestException('Volume is not available for purchase');
      }

      if (volume.stock < addToCartDto.quantity) {
        throw new BadRequestException(`Only ${volume.stock} items available in stock`);
      }

      // Get or create cart
      let cart = await this.prisma.cart.findUnique({
        where: { userId }
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId }
        });
      }

      // Check if item already exists in cart
      const existingCartItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          volumeId: addToCartDto.volumeId
        }
      });

      if (existingCartItem) {
        const newQuantity = existingCartItem.quantity + addToCartDto.quantity;
        
        if (newQuantity > volume.stock) {
          throw new BadRequestException(`Cannot add ${addToCartDto.quantity} more items. Only ${volume.stock - existingCartItem.quantity} more available in stock`);
        }

        await this.prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { 
            quantity: newQuantity,
            updatedAt: new Date()
          }
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            volumeId: addToCartDto.volumeId,
            quantity: addToCartDto.quantity
          }
        });
      }

      // Update cart timestamp
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      });

      this.logger.log(`Item added to cart for user ${userId}: Volume ${addToCartDto.volumeId} x${addToCartDto.quantity}`);

      return this.getCart(userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to add item to cart:', error);
      throw new BadRequestException('Failed to add item to cart');
    }
  }

  async updateCartItem(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartResponseDto> {
    try {
      // Find the cart item and verify ownership
      const cartItem = await this.prisma.cartItem.findFirst({
        where: {
          id: updateCartItemDto.cartItemId,
          cart: { userId }
        },
        include: {
          volume: true
        }
      });

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      // Check stock availability
      if (updateCartItemDto.quantity > cartItem.volume.stock) {
        throw new BadRequestException(`Only ${cartItem.volume.stock} items available in stock`);
      }

      // Update cart item
      await this.prisma.cartItem.update({
        where: { id: updateCartItemDto.cartItemId },
        data: { 
          quantity: updateCartItemDto.quantity,
          updatedAt: new Date()
        }
      });

      // Update cart timestamp
      await this.prisma.cart.update({
        where: { id: cartItem.cartId },
        data: { updatedAt: new Date() }
      });

      this.logger.log(`Cart item updated for user ${userId}: Item ${updateCartItemDto.cartItemId} quantity changed to ${updateCartItemDto.quantity}`);

      return this.getCart(userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to update cart item:', error);
      throw new BadRequestException('Failed to update cart item');
    }
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<CartResponseDto> {
    try {
      // Find the cart item and verify ownership
      const cartItem = await this.prisma.cartItem.findFirst({
        where: {
          id: cartItemId,
          cart: { userId }
        }
      });

      if (!cartItem) {
        throw new NotFoundException('Cart item not found');
      }

      // Remove cart item
      await this.prisma.cartItem.delete({
        where: { id: cartItemId }
      });

      // Update cart timestamp
      await this.prisma.cart.update({
        where: { id: cartItem.cartId },
        data: { updatedAt: new Date() }
      });

      this.logger.log(`Item removed from cart for user ${userId}: Item ${cartItemId}`);

      return this.getCart(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to remove item from cart:', error);
      throw new BadRequestException('Failed to remove item from cart');
    }
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId }
      });

      if (!cart) {
        throw new NotFoundException('Cart not found');
      }

      // Remove all cart items
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      // Update cart timestamp
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() }
      });

      this.logger.log(`Cart cleared for user ${userId}`);

      return { message: 'Cart cleared successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to clear cart:', error);
      throw new BadRequestException('Failed to clear cart');
    }
  }

  async getCartItemCount(userId: string): Promise<{ count: number }> {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          cartItems: true
        }
      });

      if (!cart) {
        return { count: 0 };
      }

      const count = cart.cartItems.reduce((total, item) => total + item.quantity, 0);
      return { count };
    } catch (error) {
      this.logger.error('Failed to get cart item count:', error);
      return { count: 0 };
    }
  }

  private transformCartResponse(cart: any): CartResponseDto {
    const items: CartItemDto[] = cart.cartItems.map(item => {
      const finalPrice = item.volume.price * (1 - item.volume.discount);
      const subtotal = finalPrice * item.quantity;

      return {
        id: item.id,
        quantity: item.quantity,
        subtotal,
        volume: {
          id: item.volume.id,
          volumeNumber: item.volume.volumeNumber,
          price: item.volume.price,
          discount: item.volume.discount,
          stock: item.volume.stock,
          coverImage: item.volume.coverImage,
          isAvailable: item.volume.isAvailable,
          finalPrice,
          manga: item.volume.manga
        },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
    });

    const summary: CartSummaryDto = this.calculateCartSummary(items);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      summary,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    };
  }

  private calculateCartSummary(items: CartItemDto[]): CartSummaryDto {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = items.length;
    const subtotal = items.reduce((sum, item) => sum + (item.volume.price * item.quantity), 0);
    const totalDiscount = items.reduce((sum, item) => {
      const discountAmount = item.volume.price * item.volume.discount * item.quantity;
      return sum + discountAmount;
    }, 0);
    const total = subtotal - totalDiscount;

    return {
      totalItems,
      uniqueItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
}
