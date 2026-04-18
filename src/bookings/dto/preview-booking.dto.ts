import { IsUUID, IsDateString, IsObject } from 'class-validator'

export class PreviewBookingDto {
  @IsUUID()
  locationId: string

  @IsDateString()
  startDate: string

  @IsDateString()
  endDate: string

  @IsObject()
  items: {
    small: number
    medium: number
    large: number
  }
}