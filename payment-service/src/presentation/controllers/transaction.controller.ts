// presentation/controllers/transaction.controller.ts

import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaymentService } from "src/application/payment/payment.service";
import { HoldFundsDto } from "src/application/payment/dto/hold-funds.dto";
import { TransactionResponseDto } from "src/application/payment/dto/transaction-response.dto";

@ApiTags('transactions')
@Controller("transactions")
export class TransactionController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("hold")
  @ApiOperation({
    summary: 'Hold (earmark) funds for a trip',
    description:
      'Deducts \`amount\` from the payer\'s \`availableBalance\` and parks it in \`heldBalance\`. ' +
      'This is called by trip-service when a rider accepts a trip to guarantee the fare is available at completion. ' +
      'Returns 422 if the payer has insufficient available balance.',
  })
  @ApiResponse({ status: 201, description: 'Funds held — transaction is now HELD.', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'No account found for the given userId.' })
  @ApiResponse({ status: 422, description: 'Insufficient available balance.' })
  async hold(@Body() dto: HoldFundsDto) {
    return this.paymentService.hold(dto);
  }

  @Get(":id")
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 200, description: 'The transaction.', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'No transaction with this ID.' })
  async getTransaction(@Param("id") id: string) {
    return this.paymentService.getTransaction(id);
  }

  @Post(":id/release")
  @ApiOperation({
    summary: 'Release a hold (settle payment)',
    description: 'Moves the held amount to the platform/recipient — called by trip-service on trip completion. Transaction moves from HELD → RELEASED.',
  })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 201, description: 'Funds released.', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'No transaction with this ID.' })
  @ApiResponse({ status: 409, description: 'Transaction is not in HELD status.' })
  async release(@Param("id") id: string) {
    return this.paymentService.release(id);
  }

  @Post(":id/refund")
  @ApiOperation({
    summary: 'Refund a hold (return funds)',
    description: 'Returns the held amount to the payer\'s \`availableBalance\` — called by trip-service on trip cancellation. Transaction moves from HELD → REFUNDED.',
  })
  @ApiParam({ name: 'id', description: 'Transaction UUID' })
  @ApiResponse({ status: 201, description: 'Funds refunded.', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'No transaction with this ID.' })
  @ApiResponse({ status: 409, description: 'Transaction is not in HELD status.' })
  async refund(@Param("id") id: string) {
    return this.paymentService.refund(id);
  }
}
