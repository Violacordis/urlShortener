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
  customName?: string;

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

export class editUrlDto {
  @IsUrl({}, { message: 'Invalid URL' })
  @IsOptional()
  longUrl?: string;

  @IsString()
  @IsOptional()
  customName?: string;

  @IsString()
  @IsOptional()
  title?: string;
}
