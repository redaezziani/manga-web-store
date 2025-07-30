import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database';
import { CreateOrderDto } from './dto';
import { OrderStatus } from '@prisma/client';
import { LocalExcelService } from 'src/integration/local-excel.service';
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly localExcelService: LocalExcelService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          include: {
            volume: {
              include: {
                manga: true, // Include the manga details
              },
            },
          },
        },
      },
    });

    if (!cart) {
      this.logger.error(`Cart not found for user ${userId}`);
      throw new NotFoundException('Cart not found');
    }

    if (cart.cartItems.length === 0) {
      this.logger.error(`Cart is empty for user ${userId}`);
      throw new NotFoundException('Cart is empty');
    }

    // Check if all items are in stock
    for (const item of cart.cartItems) {
      if (item.quantity > item.volume.stock) {
        throw new BadRequestException(
          `Volume "${item.volume.id}" does not have enough stock. Available: ${item.volume.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    const totalAmount = parseFloat(
      cart.cartItems
        .reduce((total, item) => {
          const price = item.volume.price;
          const discount = item.volume.discount || 0;
          const final = price * (1 - discount);
          return total + final * item.quantity;
        }, 0)
        .toFixed(2),
    );

    // Create the order and items
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        isPaid: false,
        status: OrderStatus.PENDING,
        shippingAddress: createOrderDto.shippingAddress,
        city: createOrderDto.city,
        phoneNumber: createOrderDto.phoneNumber,
        orderItems: {
          create: cart.cartItems.map((item) => ({
            volumeId: item.volume.id,
            quantity: item.quantity,
            unitPrice: parseFloat(
              (item.volume.price * (1 - (item.volume.discount || 0))).toFixed(
                2,
              ),
            ),
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            volume: {
              include: {
                manga: true,
              },
            },
          },
        },
      },
    });

    // Decrease volume stock
    for (const item of cart.cartItems) {
      await this.prisma.volume.update({
        where: { id: item.volume.id },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    // Clear the cart
    await this.prisma.cart.update({
      where: { userId },
      data: {
        cartItems: {
          deleteMany: {},
        },
      },
    });

    // Fetch user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!user) {
      this.logger.error(`User not found for ID ${userId}`);
      throw new NotFoundException('User not found');
    }

    await this.localExcelService.appendOrder({
      userName:
        user.displayName ||
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
        'Unknown',
      totalAmount: order.totalAmount,
      status: order.status,
      city: order.city,
      phoneNumber: order.phoneNumber,
      placedAt: order.placedAt,
      items: order.orderItems.map((item) => ({
        title: item.volume.manga.title,
        volumeNumber: item.volume.volumeNumber,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: parseFloat((item.unitPrice * item.quantity).toFixed(2)),
      })),
    });
    this.logger.log(
      `Order ${order.id} created successfully for user ${userId}`,
    );

    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }
}
