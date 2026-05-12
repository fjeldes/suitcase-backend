import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async create(dto: CreateReviewDto, userId: string) {
    // 1. Verificar que la reserva existe y pertenece al usuario
    const booking = await this.bookingRepository.findOne({
      where: { id: dto.bookingId },
      relations: ['user', 'location'],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user.id !== userId) throw new BadRequestException('Not your booking');
    
    // 2. Verificar que la reserva esté completada
    if (booking.status !== 'completed') {
      throw new BadRequestException('You can only review completed bookings');
    }

    // 3. Verificar si ya existe una reseña para esta reserva
    const existingReview = await this.reviewRepository.findOne({
      where: { booking: { id: dto.bookingId } },
    });

    if (existingReview) throw new BadRequestException('Already reviewed');

    // 4. Crear la reseña
    const review = this.reviewRepository.create({
      rating: dto.rating,
      comment: dto.comment,
      user: { id: userId },
      location: { id: booking.location.id },
      booking: { id: dto.bookingId },
    });

    return this.reviewRepository.save(review);
  }

  async findByLocation(locationId: string) {
    return this.reviewRepository.find({
      where: { location: { id: locationId } },
      relations: ['user', 'user.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findEligibleBookings(userId: string) {
    // Busca las ultimas 3 reservas completadas del usuario que NO tengan review
    const bookings = await this.bookingRepository.find({
      where: { user: { id: userId }, status: 'completed' },
      relations: ['location', 'review'],
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    return bookings.filter((b) => !b.review || b.review.length === 0).slice(0, 3);
  }

  async getAverageRating(locationId: string) {
    const reviews = await this.reviewRepository.find({
      where: { location: { id: locationId } },
    });

    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  }
}
