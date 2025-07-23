import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { MangaModule } from './manga/manga.module';
import { VolumeModule } from './volume/volume.module';
import { CommonModule } from './common/common.module';
import { SmtpModule } from './smtp/smtp.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    DatabaseModule,
    StorageModule,
    SmtpModule,
    AuthModule,
    CartModule,
    WishlistModule,
    MangaModule,
    VolumeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
