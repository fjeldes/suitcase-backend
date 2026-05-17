import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promo } from './entities/promo.entity';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { CreatePromoDto } from './dto/create-promo.dto';

@Injectable()
export class PromosService {
  constructor(
    @InjectRepository(Promo)
    private readonly promoRepository: Repository<Promo>,
  ) {}

  async create(dto: CreatePromoDto): Promise<Promo> {
    const existing = await this.promoRepository.findOne({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new BadRequestException('El código promocional ya existe');

    const promo = this.promoRepository.create({
      code: dto.code.toUpperCase(),
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxUses: dto.maxUses ?? 1,
      isActive: dto.isActive ?? true,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      minBookingAmount: dto.minBookingAmount ?? null,
    });

    return this.promoRepository.save(promo);
  }

  async validate(dto: ValidatePromoDto): Promise<{ valid: boolean; discountAmount: number; promo: Partial<Promo> }> {
    const promo = await this.promoRepository.findOne({ where: { code: dto.code.toUpperCase() } });

    if (!promo) throw new NotFoundException('Código promocional inválido');
    if (!promo.isActive) throw new BadRequestException('Este código promocional ya no está activo');
    if (promo.expiresAt && new Date() > promo.expiresAt) throw new BadRequestException('Este código promocional ha expirado');
    if (promo.currentUses >= promo.maxUses) throw new BadRequestException('Este código promocional ya no tiene usos disponibles');
    if (promo.minBookingAmount && dto.bookingAmount < promo.minBookingAmount) {
      throw new BadRequestException(`El monto mínimo para usar este código es $${promo.minBookingAmount.toLocaleString()}`);
    }

    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
      discountAmount = Math.round(dto.bookingAmount * (promo.discountValue / 100));
    } else {
      discountAmount = Math.min(promo.discountValue, dto.bookingAmount);
    }

    return {
      valid: true,
      discountAmount,
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
      },
    };
  }

  async incrementUses(code: string): Promise<void> {
    await this.promoRepository.increment({ code: code.toUpperCase() }, 'currentUses', 1);
  }

  async findAll(): Promise<Promo[]> {
    return this.promoRepository.find({ order: { createdAt: 'DESC' } });
  }

  async deactivate(id: string): Promise<void> {
    await this.promoRepository.update(id, { isActive: false });
  }
}
