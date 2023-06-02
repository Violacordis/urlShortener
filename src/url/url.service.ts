import { Injectable, NotFoundException } from '@nestjs/common';
import { Url, User } from '@prisma/client';
import {
  editUrlDto,
  shortenLongUrlDto,
  updateShortUrlAnalyticsDto,
} from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { appUtils } from 'src/app.utils';
import { CacheService } from 'src/utils/cache/cache.service';
import { Request } from 'express';

@Injectable()
export class UrlService {
  constructor(private prisma: PrismaService, private cache: CacheService) {}

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

  async redirectToLongUrl(shortUrl: string, req: Request) {
    try {
      const cacheKey = `redirectUrl`;

      const cachedUrl = await this.cache.get(cacheKey);

      if (cachedUrl) this.cache.remove(cacheKey);

      const url = await this.prisma.url.findUnique({ where: { shortUrl } });

      if (!url) {
        throw new NotFoundException('Url not found');
      }

      await this.updateShortUrlAnalytics(url, req);
      await this.cache.set(cacheKey, url.longUrl);

      return url.longUrl;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async updateShortUrlAnalytics(
    { shortUrl, id }: Url,
    req: Request,
  ): Promise<void> {
    try {
      const { ip, headers } = req;
      const args: updateShortUrlAnalyticsDto = {
        timestamp: new Date(),
        ipAddress: ip,
        userAgent: headers['user-agent'],
      };

      await this.prisma.shortUrlAnalytics.create({
        data: {
          ...args,
          urlId: id,
        },
      });

      await this.prisma.url.update({
        where: { shortUrl },
        data: {
          clicks: {
            increment: 1,
          },
        },
      });
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async fetchUserUrls(user: User) {
    try {
      const urls = await this.prisma.url.findMany({
        where: { userId: user.id },
        include: { analytics: true },
      });
      return urls;
    } catch (err) {
      return { message: err.message };
    }
  }

  async editUrl(id: string, { longUrl, title }: editUrlDto) {
    try {
      const url = await this.prisma.url.findUnique({ where: { id } });

      if (!url) {
        throw new NotFoundException('Url not found');
      }

      await this.prisma.url.update({
        where: { id: url.id },
        data: { longUrl, title },
      });

      await this.cache.reset();
    } catch (err) {
      return { message: err.message };
    }
  }
}
