import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsIn } from 'class-validator';

export class CreatePromoDto {
  @IsString()
  code: string;

  @IsString()
  @IsIn(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minBookingAmount?: number;
}
