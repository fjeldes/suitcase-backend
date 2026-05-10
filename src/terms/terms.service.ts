import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Terms, TermsType } from './entities/terms.entity';
import { UserTermsAcceptance } from './entities/user-terms-acceptance.entity';

@Injectable()
export class TermsService {
  constructor(
    @InjectRepository(Terms)
    private readonly termsRepository: Repository<Terms>,
    @InjectRepository(UserTermsAcceptance)
    private readonly acceptanceRepository: Repository<UserTermsAcceptance>,
  ) {}

  async findLatestByType(type: TermsType): Promise<Terms | null> {
    return this.termsRepository.findOne({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserAccepted(userId: string, termsId: string): Promise<boolean> {
    const count = await this.acceptanceRepository.count({
      where: { user: { id: userId as any }, terms: { id: termsId } },
    });
    return count > 0;
  }

  async acceptTerms(userId: string, termsId: string): Promise<void> {
    const exists = await this.acceptanceRepository.findOne({
      where: { user: { id: userId as any }, terms: { id: termsId } },
    });
    if (!exists) {
      await this.acceptanceRepository.save({
        user: { id: userId } as any,
        terms: { id: termsId } as any,
      });
    }
  }
}
