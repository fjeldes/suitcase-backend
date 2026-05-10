// src/auth/dto/google-login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @IsNotEmpty()
  @IsString()
  token: string;
}