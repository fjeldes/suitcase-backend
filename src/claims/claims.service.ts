import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Claim, ClaimStatus, ClaimPriority } from './entities/claim.entity';
import { CreateClaimDto } from './dto/create-claim.dto';
import { Booking } from 'src/bookings/entities/booking.entity';

@Injectable()
export class ClaimsService {
  constructor(
    @InjectRepository(Claim)
    private claimRepo: Repository<Claim>,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
  ) {}

  async create(dto: CreateClaimDto, userId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId, user: { id: userId } },
      relations: ['location'],
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const claim = this.claimRepo.create({
      subject: dto.subject,
      description: dto.description,
      type: dto.type,
      photos: dto.photos || [],
      userId,
      bookingId: dto.bookingId,
      locationId: booking.location?.id,
      status: ClaimStatus.OPEN,
      priority: ClaimPriority.MEDIUM,
    });
    return this.claimRepo.save(claim);
  }

  async findByUser(userId: string) {
    return this.claimRepo.find({
      where: { userId },
      relations: ['booking', 'location'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const [data, total] = await this.claimRepo.findAndCount({
      relations: ['user', 'user.profile', 'location'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = data.map((c) => ({
      id: c.id,
      subject: c.subject,
      description: c.description,
      type: c.type,
      status: c.status,
      priority: c.priority,
      user: c.user ? { name: c.user.profile?.firstName || c.user.email, email: c.user.email } : null,
      location: c.location?.name || null,
      resolution: c.resolution,
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
      photos: c.photos,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    return this.claimRepo.findOne({
      where: { id },
      relations: ['user', 'user.profile', 'location', 'booking'],
    });
  }

  async updateStatus(id: string, status: ClaimStatus, resolution?: string) {
    const update: any = { status };
    if (status === ClaimStatus.RESOLVED || status === ClaimStatus.CLOSED) {
      update.resolvedAt = new Date();
    }
    if (resolution) update.resolution = resolution;
    await this.claimRepo.update(id, update);
    return this.findOne(id);
  }

  async getStats() {
    const [open, inProgress, resolved, closed] = await Promise.all([
      this.claimRepo.count({ where: { status: ClaimStatus.OPEN } }),
      this.claimRepo.count({ where: { status: ClaimStatus.IN_PROGRESS } }),
      this.claimRepo.count({ where: { status: ClaimStatus.RESOLVED } }),
      this.claimRepo.count({ where: { status: ClaimStatus.CLOSED } }),
    ]);
    return { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed };
  }
}
