import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { QrCodeService } from '../qr-code/qr-code.service';

@Injectable()
export class UrlService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private qrcodeService: QrCodeService,
  ) {}

  async shortenLongUrl(
    user: User,
    { longUrl, customName, ...rest }: shortenLongUrlDto,
  ) {
    const shortUrlCode = await appUtils.generateRandomShortCode(7);
    try {
      const url = await this.prisma.url.findFirst({
        where: { longUrl },
      });

      if (url) {
        return {
          message: `This url already have a short url. Please use the existing short URL below`,
          shortUrl: url.shortUrl,
        };
      }

      let result;
      if (customName) {
        const domain = await this.prisma.url.findUnique({
          where: { customName },
        });
        if (domain) {
          throw new BadRequestException(
            `This domain name is already in use. Please choose another name`,
          );
        }
        result = await this.prisma.url.create({
          data: {
            ...rest,
            longUrl,
            shortUrl: customName,
            customName,
            userId: user.id,
            updatedBy: user.id,
          },
          include: {
            user: { select: { id: true } },
            analytics: true,
            qrcode: true,
          },
        });
      } else {
        result = await this.prisma.url.create({
          data: {
            ...rest,
            longUrl,
            shortUrl: shortUrlCode,
            userId: user.id,
            updatedBy: user.id,
          },
          include: {
            user: { select: { id: true } },
            analytics: true,
            qrcode: true,
          },
        });
      }

      return result;
    } catch (err) {
      throw new NotFoundException(err.message);
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
        throw new BadRequestException(
          'URL not found. This URL may have been deactivated',
        );
      }

      await this.updateShortUrlAnalytics(url, req);
      await this.cache.set(cacheKey, url.longUrl);

      return url.longUrl;
    } catch (err) {
      throw new NotFoundException(err.message);
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
      throw new NotFoundException(err.message);
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
      throw new NotFoundException(err.message);
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

      if (!url.qrcode) return url;

      const qrCode = url.qrcode;
      const imageBuffer = Buffer.from(qrCode.image);
      const base64ImageUrl = `data:image/png;base64,${imageBuffer.toString(
        'base64',
      )}`;

      return { ...url, qrcode: { ...qrCode, image: base64ImageUrl } };
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }

  async editUrl(id: string, { longUrl, title }: editUrlDto) {
    try {
      const url = await this.prisma.url.findFirst({
        where: { id, isActive: true },
      });

      if (!url) {
        throw new NotFoundException('Url not found');
      }

      await this.prisma.url.update({
        where: { id: url.id },
        data: {
          longUrl,
          title,
          updatedAt: new Date(),
          updatedBy: url.userId,
        },
      });

      await this.cache.reset();
    } catch (err) {
      throw new NotFoundException(`customName already exists !`);
    }
  }

  async activateUrl(id: string) {
    try {
      const url = await this.prisma.url.findFirst({
        where: { id, isActive: false },
      });
      if (!url) throw new NotFoundException(`URL is already active !`);

      await this.prisma.url.update({
        where: { id },
        data: { isActive: true, updatedAt: new Date() },
      });
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }
  async deactivateUrl(id: string) {
    try {
      const url = await this.prisma.url.findFirst({
        where: { id, isActive: true },
      });
      if (!url) throw new NotFoundException(`URL is already deactivated !`);

      await this.prisma.url.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }

  async deleteUrl(id: string) {
    try {
      const url = await this.prisma.url.findUnique({
        where: { id },
        include: { qrcode: true, analytics: true },
      });

      if (!url) {
        throw new NotFoundException('URL Not Found');
      }

      if (url.qrcode || url.analytics.length) {
        await this.prisma.shortUrlAnalytics.deleteMany({
          where: { urlId: id },
        });
        await this.qrcodeService.deleteQrCode(id);
      }

      await this.prisma.url.delete({ where: { id } });

      await this.cache.reset();
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }
}
