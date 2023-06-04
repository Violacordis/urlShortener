import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { CacheService } from 'src/utils/cache/cache.service';
import { QrCodeModule } from 'src/qr-code/qr-code.module';

@Module({
  providers: [UrlService, CacheService],
  controllers: [UrlController],
  exports: [UrlService],
  imports: [QrCodeModule],
})
export class UrlModule {}
