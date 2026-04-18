import { IsOptional, IsDateString, IsObject } from 'class-validator'

export class UpdateBookingDto {
    @IsOptional()
    @IsDateString()
    startDate?: string

    @IsOptional()
    @IsDateString()
    endDate?: string

    @IsOptional()
    @IsObject()
    items?: {
        small?: number
        medium?: number
        large?: number
    }
}