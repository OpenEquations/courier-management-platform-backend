// presentation/controllers/account.controller.ts

import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { PaymentService } from "src/application/payment/payment.service";
import { OpenAccountDto } from "src/application/payment/dto/open-account.dto";
import { TopUpDto } from "src/application/payment/dto/top-up.dto";

@Controller("accounts")
export class AccountController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async openAccount(@Body() dto: OpenAccountDto) {
    return this.paymentService.openAccount(dto);
  }

  @Get(":id")
  async getAccount(@Param("id") id: string) {
    return this.paymentService.getAccount(id);
  }

  @Get("by-owner/:ownerId")
  async getAccountByOwner(@Param("ownerId") ownerId: string) {
    return this.paymentService.getAccountByOwner(ownerId);
  }

  @Post(":id/topup")
  async topUp(@Param("id") id: string, @Body() dto: TopUpDto) {
    return this.paymentService.topUp(id, dto.amount);
  }

  @Get(":id/transactions")
  async getTransactions(
    @Param("id") id: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.paymentService.listTransactions(id, page, limit);
  }
}
