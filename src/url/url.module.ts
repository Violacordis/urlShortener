import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { CacheService } from 'src/utils/cache/cache.service';

@Module({
  providers: [UrlService, CacheService],
  controllers: [UrlController],
  exports: [UrlService],
})
export class UrlModule {}
