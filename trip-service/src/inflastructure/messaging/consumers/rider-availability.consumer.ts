import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RiderAvailabilityConsumer {
  private readonly logger = new Logger(RiderAvailabilityConsumer.name);

  // TODO: decorate with @EventPattern / @MessagePattern when transport is wired up
  async handleRiderAvailabilityChanged(payload: unknown): Promise<void> {
    this.logger.log(`Received rider-availability event: ${JSON.stringify(payload)}`);
  }
}
