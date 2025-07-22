import { Module } from '@nestjs/common';
import { VolumeService } from './volume.service';
import { VolumeController } from './volume.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, AuthModule, StorageModule],
  controllers: [VolumeController],
  providers: [VolumeService],
  exports: [VolumeService],
})
export class VolumeModule {}
