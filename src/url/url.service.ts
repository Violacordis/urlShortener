import { Injectable, NotFoundException } from '@nestjs/common';
import { Url, User } from '@prisma/client';
import {
  editUrlDto,
  shortenLongUrlDto,
  updateShortUrlAnalyticsDto,
} from './dto';
import { Request } from 'express';
import { appUtils } from '../app.utils';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../utils/cache/cache.service';

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
          message: `${longUrl} is already shortened. Here is the shortened url...`,
          shortUrl: url.shortUrl,
        };
      }
      const customDomainUrl = `${customDomain}/${shortUrlCode}`;

      const result = await this.prisma.url.create({
        data: {
          ...rest,
          longUrl,
          shortUrl: customDomain ? customDomainUrl : shortUrlCode,
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

      if (cachedUrl) return cachedUrl;

      const url = await this.prisma.url.findFirst({
        where: { shortUrl, isActive: true },
      });

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
        include: { analytics: true, qrcode: true },
        orderBy: { createdAt: 'desc' },
      });

      const urlsWithModifiedQrCode = urls.map((url) => {
        const qrCode = url.qrcode;

        if (!qrCode || !qrCode.image) return url;

        const imageBuffer = Buffer.from(qrCode.image);
        const base64ImageUrl = `data:image/png;base64,${imageBuffer.toString(
          'base64',
        )}`;

        return { ...url, qrcode: { ...qrCode, image: base64ImageUrl } };
      });

      return urlsWithModifiedQrCode;
    } catch (err) {
      return { message: err.message };
    }
  }

  async getUrl(id: string) {
    try {
      const url = await this.prisma.url.findUnique({
        where: { id },
        include: { analytics: true, qrcode: true },
      });

      if (!url) {
        throw new NotFoundException(`URL not found !`);
      }

      return url;
    } catch (err) {
      throw new Error(err.message);
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

  async activateUrl(id: string) {
    try {
      await this.prisma.url.update({
        where: { id },
        data: { isActive: true, updatedAt: new Date() },
      });
    } catch (err) {
      return { message: err.message };
    }
  }
  async deactivateUrl(id: string) {
    try {
      await this.prisma.url.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
    } catch (err) {
      return { message: err.message };
    }
  }

  async deleteUrl(id: string) {
    try {
      const url = await this.prisma.url.findUnique({ where: { id } });

      if (!url) {
        throw new NotFoundException('URL Not Found');
      }

      await this.prisma.shortUrlAnalytics.deleteMany({
        where: { urlId: id },
      });

      await this.prisma.qrCode.delete({ where: { urlId: id } });
      await this.prisma.url.delete({ where: { id } });

      await this.cache.reset();
    } catch (err) {
      return { message: err.message };
    }
  }
}
