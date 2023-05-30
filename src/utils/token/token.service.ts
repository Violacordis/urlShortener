import { BadRequestException, Injectable } from '@nestjs/common';
import { appUtils } from '../../app.utils';
import { TokenEnumType } from './enum';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class TokenService {
  constructor(private cache: CacheService) {}

  async generateToken(type: TokenEnumType, email: string, ttl?: number) {
    const token = await appUtils.generateRandomShortCode(6);

    const userData = {
      id: email,
      type,
      token,
    };
    await this.cache.set(type, JSON.stringify(userData), ttl);
    return token;
  }

  async validateToken(
    key: string,
    email: string,
    userToken: string,
  ): Promise<boolean> {
    const existingToken = await this.cache.get(key);

    if (!existingToken) throw new BadRequestException('Invalid token');

    const { id, type, token } = JSON.parse(existingToken);

    if (id !== email || type !== key || token !== userToken) {
      throw new BadRequestException('Invalid token1');
    }

    await this.cache.remove(key);
    return true;
  }
}
