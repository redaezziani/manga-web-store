import { Global, Module } from '@nestjs/common';
import { LocalExcelService } from './local-excel.service';
@Global()
@Module({
    providers: [LocalExcelService],
    exports: [LocalExcelService],
    imports: [],
    controllers: [],
})
export class IntegrationModule {}
