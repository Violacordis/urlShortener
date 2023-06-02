import { OmitType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsDate,
} from 'class-validator';

export class shortenLongUrlDto {
  @IsUrl({}, { message: 'Invalid URL' })
  @IsNotEmpty()
  longUrl: string;

  @IsString()
  @IsOptional()
  customDomain?: string;

  @IsString()
  @IsOptional()
  title?: string;
}

export class updateShortUrlAnalyticsDto {
  @IsDate()
  timestamp: Date;

  @IsString()
  userAgent: string;

  @IsString()
  ipAddress: string;
}

export class editUrlDto extends OmitType(shortenLongUrlDto, ['customDomain']) {}
