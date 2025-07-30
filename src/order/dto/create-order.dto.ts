import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class CreateOrderDto {
  @ApiProperty({
    description: 'Shipping address for the order',
    example: '123 Main St, Springfield, USA',
    required: true,
  })
  @IsString()
  shippingAddress: string;

  @ApiProperty({
    description: 'City for the shipping address',
    example: 'Springfield',
    required: true,
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Phone number for contact regarding the order',
    example: '+1234567890',
    required: true,
  })
  @IsString()
  phoneNumber: string;
}
