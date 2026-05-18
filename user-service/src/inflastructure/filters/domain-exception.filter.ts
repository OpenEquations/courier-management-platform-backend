import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { DomainException } from "src/domain/shared/exceptions/domain.exception";
import { NotFoundException } from "src/domain/shared/exceptions/not-found.exception";
import { ConflictException } from "src/domain/shared/exceptions/conflict.exception";
import { UnauthorizedException } from "src/domain/shared/exceptions/unauthorized.exception";
import { ForbiddenException } from "src/domain/shared/exceptions/forbidden.exception";

const IS_DEV = process.env.NODE_ENV !== "production";

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // ── Domain exceptions (business logic) ──────────────────────────────────
    if (exception instanceof DomainException) {
      const status = this.resolveDomainStatus(exception);
      this.logger.warn(`[${exception.constructor.name}] ${exception.message}`);
      return response.status(status).json({
        statusCode: status,
        error:      HttpStatus[status] ?? "Bad Request",
        message:    exception.message,
      });
    }

    // ── NestJS HTTP exceptions (ValidationPipe, JwtGuard, etc.) ─────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body   = exception.getResponse();
      return response.status(status).json(
        typeof body === "object" ? body : { statusCode: status, message: body },
      );
    }

    // ── Unexpected errors — full detail in dev, generic in prod ─────────────
    const err = exception as Error;
    this.logger.error(err.message, err.stack);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error:      "Internal Server Error",
      message:    IS_DEV ? err.message     : "An unexpected error occurred",
      ...(IS_DEV && { stack: err.stack }),
    });
  }

  private resolveDomainStatus(exception: DomainException): number {
    if (exception instanceof NotFoundException)   return HttpStatus.NOT_FOUND;
    if (exception instanceof ConflictException)   return HttpStatus.CONFLICT;
    if (exception instanceof UnauthorizedException) return HttpStatus.UNAUTHORIZED;
    if (exception instanceof ForbiddenException)  return HttpStatus.FORBIDDEN;
    return HttpStatus.BAD_REQUEST;
  }
}
