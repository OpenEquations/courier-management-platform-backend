// domain/shared/exceptions/not-found.exception.ts

import { DomainException } from "./domain.exception";

export class NotFoundException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundException";
  }
}
