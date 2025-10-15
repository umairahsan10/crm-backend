import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Registered email address of the admin or user.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Password associated with the provided email.',
  })
  @IsString()
  password: string;
}
