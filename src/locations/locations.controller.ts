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
    Request,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsService } from './locations.service'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { RolesGuard } from 'src/auth/guards/roles.guards'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { UpdateLocationDto } from './dto/update-location.dto';
import { StaffAssignment } from 'src/staff/entities/staff-assignment.entity';

@Controller('locations')
export class LocationsController {
    constructor(
        private readonly locationsService: LocationsService,
        @InjectRepository(StaffAssignment)
        private readonly staffRepo: Repository<StaffAssignment>,
    ) { }

    // 🔓 Público (explorar)
    @Get()
    findAll() {
        console.log('GET /locations - findAll called');
        return this.locationsService.findAll()
    }

    // 🔐 Estadísticas del Dashboard (Owner)
    // Usamos el ID de prueba que tienes en los otros métodos mientras terminas de ajustar el Auth
    @UseGuards(JwtAuthGuard)
    @Get('owner/stats')
    async getDashboard(@Request() req, @Query('locationId') locationId?: string) {
        if (req.user.roles?.includes('staff')) {
            if (!locationId) return {};
            const assignment = await this.staffRepo.findOne({
                where: { staff: { id: req.user.userId }, location: { id: locationId } },
            });
            if (!assignment) return {};
            return this.locationsService.getDashboardStatsByStoreId(locationId);
        }
        return this.locationsService.getDashboardStatsByOwnerByStore(req.user.userId, locationId);
    }

    @Get('nearby')
    findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
        @Query('minLat') minLat?: string,
        @Query('maxLat') maxLat?: string,
        @Query('minLng') minLng?: string,
        @Query('maxLng') maxLng?: string,
    ) {
        // Si no hay fechas, usamos "hoy" y "mañana" por defecto para no romper el servicio
        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date(new Date().getTime() + 24 * 60 * 60 * 1000);

        return this.locationsService.findNearby(
            Number(lat),
            Number(lng),
            Number(radius || 5), // Radio por defecto: 5km
            start,
            end,
            search,
            {
                minLat: minLat ? Number(minLat) : undefined,
                maxLat: maxLat ? Number(maxLat) : undefined,
                minLng: minLng ? Number(minLng) : undefined,
                maxLng: maxLng ? Number(maxLng) : undefined,
            }
        );
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
    // En el Controller
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateLocationDto: UpdateLocationDto, // 👈 Usar DTO
        @Req() req: any,
    ) {
        return this.locationsService.update(id, updateLocationDto, req.user.userId);
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

    // 🔐 Admin: listar todas las locaciones
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('admin/all')
    findAllForAdmin() {
        return this.locationsService.findAllForAdmin();
    }

    // 🔐 Admin: detalle de locación con info del owner
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('admin/:id')
    findOneForAdmin(@Param('id') id: string) {
        return this.locationsService.findOneForAdmin(id);
    }

    // 🔐 Admin: aprobar/rechazar locación
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: 'pending' | 'active' | 'rejected' },
    ) {
        return this.locationsService.updateStatus(id, body.status);
    }
}