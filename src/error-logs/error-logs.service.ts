import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ErrorLog, ErrorLogSource } from './entities/error-log.entity';

@Injectable()
export class ErrorLogsService {
  constructor(
    @InjectRepository(ErrorLog)
    private repo: Repository<ErrorLog>,
  ) {}

  async create(data: Partial<ErrorLog>) {
    return this.repo.save(this.repo.create(data));
  }

  async findAll(page: number = 1, limit: number = 30, filters?: { level?: string; source?: string; days?: number }) {
    const where: any = {};
    if (filters?.level) where.level = filters.level;
    if (filters?.source) where.source = filters.source;
    if (filters?.days) {
      const since = new Date();
      since.setDate(since.getDate() - filters.days);
      where.createdAt = Between(since, new Date());
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats() {
    const total = await this.repo.count();
    const last24h = await this.repo.count({
      where: { createdAt: Between(new Date(Date.now() - 86400000), new Date()) },
    });
    const errors = await this.repo.count({ where: { level: 'error' } });
    const fatal = await this.repo.count({ where: { level: 'fatal' } });
    return { total, last24h, errors, fatal };
  }
}
