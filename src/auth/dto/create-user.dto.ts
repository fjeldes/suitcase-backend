import { IsEmail, IsString, MinLength, Matches } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password must contain uppercase, lowercase, and a number' })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}