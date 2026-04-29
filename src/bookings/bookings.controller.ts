import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    Patch,
    Param,
    Get,
    Query,
} from '@nestjs/common'
import { BookingsService } from './bookings.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { UpdateBookingDto } from './dto/update-booking.dto'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { RolesGuard } from 'src/auth/guards/roles.guards'
import { PreviewBookingDto } from './dto/preview-booking.dto'
import { UserRole } from 'src/common/enums/user-role.enum'

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMy(
        @Req() req: any,
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('locationId') locationId?: string
    ) {
        // 1. Extraemos userId y role del token (req.user)
        const { userId, roles } = req.user;
        const rolesArray = [roles].flat();
        // 2. Pasamos todo al servicio
        // En BookingsController.ts
        return this.bookingsService.findMyBookings(
            userId,
            rolesArray as UserRole[],
            {
                status,
                locationId,
                limit: limit ? parseInt(limit, 10) : undefined
            }
        );
    }

    // 🔥 BOOKINGS DE UNA LOCATION
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('owner')
    @Get('location/:locationId')
    findByLocation(
        @Param('locationId') locationId: string,
        @Req() req: any,
    ) {
        return this.bookingsService.findByLocation(
            locationId,
            req.user.userId,
        )
    }

    // 🔥 TODOS (temporal / debug)
    @Get()
    findAll() {
        return this.bookingsService.findAll()
    }

    // 🔥 CREAR BOOKING
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateBookingDto, @Req() req: any) {
        return this.bookingsService.create(dto, req.user.userId)
    }

    // 🔥 UPDATE BOOKING
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateBookingDto,
        @Req() req: any,
    ) {
        return this.bookingsService.update(id, dto, req.user.userId)
    }

    // 🔥 CANCEL BOOKING
    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    cancel(@Param('id') id: string, @Req() req: any) {
        return this.bookingsService.cancel(id, req.user.userId)
    }

    @UseGuards(JwtAuthGuard)
    @Post('preview')
    preview(@Body() dto: PreviewBookingDto, @Req() req: any) {
        return this.bookingsService.preview(dto, req.user.userId)
    }

    // Para que el scanner muestre la info en la pantalla de confirmación
    @Get('validate-qr/:qrCode')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('owner')
    async validate(@Param('qrCode') qrCode: string, @Req() req: any) {
        return this.bookingsService.getBookingForOwner(qrCode, req.user.userId);
    }

    // Para cuando el owner presiona el botón "Confirmar"
    @Patch('process-qr/:qrCode')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('owner')
    async process(@Param('qrCode') qrCode: string, @Req() req: any) {
        return this.bookingsService.processQr(qrCode, req.user.userId);
    }
}