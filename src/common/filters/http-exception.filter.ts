import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const path = request.url;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle NestJS Built-in HttpExceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse();
      if (typeof resContent === 'object' && resContent !== null) {
        const msg = (resContent as any).message;
        message = Array.isArray(msg) ? msg[0] : (msg || exception.message);
      } else {
        message = exception.message;
      }
    }
    // Handle Prisma Database Client Errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `Unique constraint failed on ${target}. A record already exists.`;
          break;
        }
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          message = (exception.meta?.cause as string) || 'Record not found';
          break;
        }
        default: {
          status = HttpStatus.BAD_REQUEST;
          message = `Database query error: ${exception.message}`;
          break;
        }
      }
    }
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database validation failure';
    }
    // Handle JWT Errors
    else if (exception.name === 'JsonWebTokenError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Invalid authentication token';
    } else if (exception.name === 'TokenExpiredError') {
      status = HttpStatus.UNAUTHORIZED;
      message = 'Authentication token expired';
    }
    // General Errors
    else {
      console.error('Unhandled System Exception:', exception);
      message = exception.message || 'Internal server error';
    }

    response.status(status).json({
      success: false,
      message,
      data: {},
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
