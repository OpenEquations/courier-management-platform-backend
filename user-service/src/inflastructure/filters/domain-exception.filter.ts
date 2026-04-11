// infrastructure/filters/domain-exception.filter.ts

import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { DomainException } from "src/domain/shared/exceptions/domain.exception";
import { NotFoundException } from "src/domain/shared/exceptions/not-found.exception";
import { ConflictException } from "src/domain/shared/exceptions/conflict.exception";
import { UnauthorizedException } from "src/domain/shared/exceptions/unauthorized.exception";
import { ForbiddenException } from "src/domain/shared/exceptions/forbidden.exception";

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.resolveStatus(exception);
    this.logger.warn(`[${exception.name}] ${exception.message}`);

    response.status(status).json({
      statusCode: status,
      error: this.resolveError(status),
      message: exception.message,
    });
  }

  private resolveStatus(exception: DomainException): number {
    if (exception instanceof NotFoundException) return HttpStatus.NOT_FOUND;
    if (exception instanceof ConflictException) return HttpStatus.CONFLICT;
    if (exception instanceof UnauthorizedException) return HttpStatus.UNAUTHORIZED;
    if (exception instanceof ForbiddenException) return HttpStatus.FORBIDDEN;
    return HttpStatus.BAD_REQUEST;
  }

  private resolveError(status: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: "Bad Request",
      [HttpStatus.NOT_FOUND]: "Not Found",
      [HttpStatus.CONFLICT]: "Conflict",
      [HttpStatus.UNAUTHORIZED]: "Unauthorized",
      [HttpStatus.FORBIDDEN]: "Forbidden",
    };
    return map[status] ?? "Bad Request";
  }
}
