import { ProofType } from '../enums/proof-type.enum';

export class ProofOfPickup {
  private constructor(
    private readonly type: ProofType,
    private readonly fileUrl: string | null,
    private readonly capturedAt: Date,
    private readonly capturedByRiderId: string,
  ) {}

  static create(props: {
    type: ProofType;
    fileUrl?: string;
    capturedByRiderId: string;
  }): ProofOfPickup {
    return new ProofOfPickup(props.type, props.fileUrl ?? null, new Date(), props.capturedByRiderId);
  }

  static reconstitute(props: {
    type: ProofType;
    fileUrl: string | null;
    capturedAt: Date;
    capturedByRiderId: string;
  }): ProofOfPickup {
    return new ProofOfPickup(props.type, props.fileUrl, props.capturedAt, props.capturedByRiderId);
  }

  getType(): ProofType { return this.type; }
  getFileUrl(): string | null { return this.fileUrl; }
  getCapturedAt(): Date { return this.capturedAt; }
  getCapturedByRiderId(): string { return this.capturedByRiderId; }
}
