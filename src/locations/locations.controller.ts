import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Req,
    Query,
} from '@nestjs/common'
import { LocationsService } from './locations.service'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'

@Controller('locations')
export class LocationsController {
    constructor(private readonly locationsService: LocationsService) { }

    // 🔓 Público (explorar)
    @Get()
    findAll() {
        return this.locationsService.findAll()
    }

    // 🔐 Estadísticas del Dashboard (Owner)
    // Usamos el ID de prueba que tienes en los otros métodos mientras terminas de ajustar el Auth
    @UseGuards(JwtAuthGuard)
    @Get('owner/stats')
    getOwnerStats(@Req() req: any) {
        return this.locationsService.getStatsByOwner(req.user.userId);
    }

    @Get('near')
    findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.locationsService.findNearby(
            Number(lat),
            Number(lng),
            Number(radius || 5),
            new Date(startDate),
            new Date(endDate),
        )
    }


    // 🔐 Crear location (con owner)
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() body: any, @Req() req: any) {
        return this.locationsService.create(body, req.user.userId)
    }

    // 🔐 Mis locations
    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMy(@Req() req: any) {
        return this.locationsService.findMyLocations(req.user.userId)
    }

    // 🔐 Actualizar (solo owner)
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        return this.locationsService.update(id, body, req.user.userId)
    }

    // 🔐 Eliminar (solo owner)
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return this.locationsService.remove(id, req.user.userId)
    }

    // 🔓 Público (detalle)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id)
    }
}