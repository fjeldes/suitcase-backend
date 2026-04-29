import { IsString, IsEnum, IsOptional } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  token: string;

  @IsEnum(['expo', 'fcm'])
  provider: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;
}