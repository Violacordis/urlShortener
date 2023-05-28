import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { CacheService } from '../cache/cache.service';

@Module({
  exports: [TokenService],
  providers: [TokenService, CacheService],
  controllers: [],
})
export class TokenModule {}
