import {
  IsDateString,
  IsUUID,
  IsObject,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

class BookingItemsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  small?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  medium?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  large?: number
}

export class CreateBookingDto {
  @IsUUID()
  locationId: string

  @IsDateString()
  startDate: string

  @IsDateString()
  endDate: string

  @IsObject()
  items: BookingItemsDto
}