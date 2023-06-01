import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { shortenLongUrlDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { appUtils } from 'src/app.utils';
import { CacheService } from 'src/utils/cache/cache.service';

@Injectable()
export class UrlService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private cache: CacheService,
  ) {}

  async shortenLongUrl(
    user: User,
    { longUrl, customDomain, ...rest }: shortenLongUrlDto,
  ) {
    const shortUrlCode = await appUtils.generateRandomShortCode(7);
    try {
      // check if longUrl exists in db
      const url = await this.prisma.url.findFirst({
        where: { longUrl },
      });

      if (url) {
        return {
          message: `This Url has already been shortened. Here is the shortened url...`,
          shortUrl: url.shortUrl,
        };
      }

      const result = await this.prisma.url.create({
        data: {
          ...rest,
          longUrl,
          shortUrl: shortUrlCode,
          customDomain,
          userId: user.id,
        },
        include: {
          user: { select: { id: true } },
          analytics: true,
        },
      });
      return result;
    } catch (err) {
      throw new NotFoundException('URL not found');
    }
  }

  async redirectToLongUrl(shortUrl: string) {
    try {
      const cacheKey = `redirectUrl`;

      const cachedUrl = await this.cache.get(cacheKey);

      if (cachedUrl) return cachedUrl;

      const url = await this.prisma.url.findUnique({ where: { shortUrl } });

      if (!url) {
        throw new NotFoundException('Url not found');
      }
      await this.cache.set(cacheKey, url.longUrl);

      return url.longUrl;
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
