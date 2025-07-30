import { Injectable, Logger } from '@nestjs/common';
import * as Excel from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalExcelService {
  private readonly logger = new Logger(LocalExcelService.name);
  private readonly filePath = path.join(process.cwd(), 'orders.xlsx');

  async appendOrder(order: {
    userName: string;
    totalAmount: number;
    status: string;
    city: string;
    phoneNumber: string;
    placedAt: Date;
    items: {
      title: string;
      volumeNumber: number;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  }) {
    const workbook = new Excel.Workbook();
    const fileExists = fs.existsSync(this.filePath);

    if (fileExists) {
      await workbook.xlsx.readFile(this.filePath);
    } else {
      const sheet = workbook.addWorksheet('Orders');
      sheet.addRow([
        'User Name',
        'City',
        'Phone',
        'Order Status',
        'Placed At',
        'Manga Title',
        'Volume Number',
        'Quantity',
        'Unit Price',
        'Item Total',
        'Order Total',
      ]);
    }

    const worksheet = workbook.getWorksheet('Orders');

    order.items.forEach(item => {
      worksheet.addRow([
        order.userName,
        order.city,
        order.phoneNumber,
        order.status,
        order.placedAt.toISOString(),
        item.title,
        item.volumeNumber,
        item.quantity,
        item.unitPrice,
        item.total,
        order.totalAmount,
      ]);
    });

    await workbook.xlsx.writeFile(this.filePath);
    this.logger.log(`Order written to ${this.filePath}`);
  }
}
