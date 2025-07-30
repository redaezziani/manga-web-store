import { Body, Controller, Post, Request } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Order')
@Controller({
  path: 'order',
  version: '1',
})
export class OrderController {
    constructor() {}

    @Post("add")
    async createOrder(@Body() createOrderDto: CreateOrderDto,@Request() req) {
        try {
           const userId = req.user.id; 
        } catch (error) {
             return {
        success: false,
        message: error.message,
        data: null,
      };
        }
    }

}


