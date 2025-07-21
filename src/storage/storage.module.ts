import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileValidationService } from './file-validation.service';

@Global()
@Module({
  providers: [CloudinaryService, FileValidationService],
  exports: [CloudinaryService, FileValidationService],
})
export class StorageModule {}
