import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    Patch,
    Param,
    Get,
} from '@nestjs/common'
import { BookingsService } from './bookings.service'
import { CreateBookingDto } from './dto/create-booking.dto'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { UpdateBookingDto } from './dto/update-booking.dto'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { RolesGuard } from 'src/auth/guards/roles.guards'
import { PreviewBookingDto } from './dto/preview-booking.dto'

@Controller('bookings')
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    // 🔥 MIS BOOKINGS (mejor práctica: "me")
    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMy(@Req() req: any) {
        return this.bookingsService.findMyBookings(req.user.userId)
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
}