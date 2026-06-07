// presentation/controllers/transaction.controller.ts

import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { PaymentService } from "src/application/payment/payment.service";
import { HoldFundsDto } from "src/application/payment/dto/hold-funds.dto";

@Controller("transactions")
export class TransactionController {
  constructor(private readonly paymentService: PaymentService) {}

  // Earmarks funds on the payer's (mock) bank account.
  // This is the endpoint a real IPaymentGatewayPort.hold() adapter calls.
  @Post("hold")
  async hold(@Body() dto: HoldFundsDto) {
    return this.paymentService.hold(dto);
  }

  @Get(":id")
  async getTransaction(@Param("id") id: string) {
    return this.paymentService.getTransaction(id);
  }

  @Post(":id/release")
  async release(@Param("id") id: string) {
    return this.paymentService.release(id);
  }

  @Post(":id/refund")
  async refund(@Param("id") id: string) {
    return this.paymentService.refund(id);
  }
}
