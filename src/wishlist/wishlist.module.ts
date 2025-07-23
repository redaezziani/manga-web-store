import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule, // Import AuthModule for JWT strategy and guard
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService], // Export service for potential use in other modules
})
export class WishlistModule {}
