import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsDate,
  MaxLength,
} from 'class-validator';

export class shortenLongUrlDto {
  @IsUrl({}, { message: 'Invalid URL' })
  @IsNotEmpty()
  longUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(10, {
    message: 'Custom name must not be longer than 10 characters',
  })
  customName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30, {
    message: 'Title must not be longer than 30 characters',
  })
  title: string;
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
  title?: string;
}
