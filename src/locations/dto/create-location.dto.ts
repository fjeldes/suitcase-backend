import {
    IsString,
    IsNumber,
    IsObject,
} from 'class-validator'

export class CreateLocationDto {
    @IsString()
    name: string

    @IsString()
    address: string

    @IsNumber()
    lat: number

    @IsNumber()
    lng: number

    @IsObject()
    capacity: {
        small: number
        medium: number
        large: number
    }

    @IsObject()
    pricePerDay: {
        small: number
        medium: number
        large: number
    }
}