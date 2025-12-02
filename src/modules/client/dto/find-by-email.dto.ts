import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class FindByEmailDto {
  @ApiProperty({
    example: 'john.doe@acme.com',
    description: 'Email address of the client to retrieve',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
