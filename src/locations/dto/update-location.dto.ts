import { IsOptional, IsString, IsObject, IsUrl } from 'class-validator';

export class UpdateLocationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsObject()
    pricePerDay?: {
        small: number;
        medium: number;
        large: number;
    };

    @IsOptional()
    @IsObject()
    // Cambiamos maxCapacity por capacity para que coincida con tu entidad/DB
    capacity?: {
        small: number;
        medium: number;
        large: number;
    };

    @IsOptional()
    @IsString() // O @IsUrl() si validas que sea una URL completa
    imageUrl?: string;
}