import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Injectable()
export class appUtils {
  public static generateRandomShortCode(charlen = 6): string {
    const nanoid = customAlphabet(chars, charlen);
    return nanoid();
  }
}
