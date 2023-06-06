import { OmitType } from '@nestjs/swagger';
import { signUpDto } from '../../auth/dto/auth.dto';

export class UpdateUserDto extends OmitType(signUpDto, ['password', 'email']) {}
