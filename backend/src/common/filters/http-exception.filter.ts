import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: (exception as Error).message };

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message: typeof errorResponse === 'object' && errorResponse !== null && 'message' in errorResponse ? (errorResponse as any).message : errorResponse,
        details: request.url,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
