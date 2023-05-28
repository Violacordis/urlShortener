import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  providers: [CacheService],
  exports: [CacheService],
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: configService.get<string>('REDIS_URI'),
          ttl: 15 * 60 * 1000,
        }),
      }),
      isGlobal: true,
      inject: [ConfigService],
    }),
  ],
})
export class CacheModule {}
