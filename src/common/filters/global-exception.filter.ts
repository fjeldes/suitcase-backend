import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception?.status || exception?.response?.statusCode || 500;
    const message = exception?.message || exception?.response?.message || 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} — ${status} ${message}`,
      exception?.stack || '',
    );

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : message[0] || message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
