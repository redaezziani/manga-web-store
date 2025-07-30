import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth';

@ApiTags('Order')
@Controller({
  path: 'order',
  version: '1',
})
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
    @UseGuards(JwtAuthGuard)
  @Post('create')
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    try {
      const userId = req.user.id;
      const order = await this.orderService.createOrder(userId, createOrderDto);
      return {
        success: true,
        message: 'Order created successfully',
        data: order,
      };
    } catch (error) {
        console.error('Error creating order:', error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}
