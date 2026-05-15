import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { ErrorLog, ErrorLogSource } from 'src/error-logs/entities/error-log.entity';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  constructor(private dataSource: DataSource) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception?.status || exception?.response?.statusCode || 500;
    const message = exception?.message || exception?.response?.message || 'Internal server error';
    const msg = typeof message === 'string' ? message : message[0] || message;

    this.logger.error(`${request.method} ${request.url} — ${status} ${msg}`, exception?.stack || '');

    this.persistError({ message: msg, stack: exception?.stack, method: request.method, path: request.url, statusCode: status }).catch(() => {});

    response.status(status).json({
      statusCode: status,
      message: msg,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private async persistError(data: { message: string; stack?: string; method: string; path: string; statusCode: number }) {
    if (data.statusCode < 500) return;
    const repo = this.dataSource.getRepository(ErrorLog);
    await repo.save(repo.create({
      source: ErrorLogSource.BACKEND,
      level: data.statusCode >= 500 ? 'error' : 'warn',
      message: data.message,
      stack: data.stack,
      method: data.method,
      path: data.path,
      statusCode: data.statusCode,
    }));
  }
}
