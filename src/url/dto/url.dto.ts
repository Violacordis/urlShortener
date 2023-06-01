import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

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
