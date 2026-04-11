// domain/shared/exceptions/forbidden.exception.ts

import { DomainException } from "./domain.exception";

export class ForbiddenException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenException";
  }
}
