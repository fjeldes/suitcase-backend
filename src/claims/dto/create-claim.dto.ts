import { IsEnum, IsOptional, IsString, IsUUID, IsArray } from 'class-validator';
import { ClaimType } from '../entities/claim.entity';

export class CreateClaimDto {
  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsUUID()
  bookingId: string;

  @IsEnum(ClaimType)
  type: ClaimType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}
