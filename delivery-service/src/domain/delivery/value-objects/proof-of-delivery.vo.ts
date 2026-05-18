import { ProofType } from '../enums/proof-type.enum';

export class ProofOfDelivery {
  private constructor(
    private readonly type: ProofType,
    private readonly fileUrl: string | null,
    private readonly capturedAt: Date,
    private readonly capturedByRiderId: string,
    private readonly deliveredTo: string,
  ) {}

  static create(props: {
    type: ProofType;
    fileUrl?: string;
    capturedByRiderId: string;
    deliveredTo: string;
  }): ProofOfDelivery {
    if (!props.deliveredTo?.trim()) throw new Error('deliveredTo is required');
    return new ProofOfDelivery(
      props.type, props.fileUrl ?? null, new Date(),
      props.capturedByRiderId, props.deliveredTo,
    );
  }

  static reconstitute(props: {
    type: ProofType;
    fileUrl: string | null;
    capturedAt: Date;
    capturedByRiderId: string;
    deliveredTo: string;
  }): ProofOfDelivery {
    return new ProofOfDelivery(
      props.type, props.fileUrl, props.capturedAt,
      props.capturedByRiderId, props.deliveredTo,
    );
  }

  getType(): ProofType { return this.type; }
  getFileUrl(): string | null { return this.fileUrl; }
  getCapturedAt(): Date { return this.capturedAt; }
  getCapturedByRiderId(): string { return this.capturedByRiderId; }
  getDeliveredTo(): string { return this.deliveredTo; }
}
