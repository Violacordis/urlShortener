import { OmitType } from '@nestjs/swagger';
import { signUpDto } from 'src/auth/dto';

export class UpdateUserDto extends OmitType(signUpDto, ['password', 'email']) {}
