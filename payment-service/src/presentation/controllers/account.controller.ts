// presentation/controllers/account.controller.ts

import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { PaymentService } from "src/application/payment/payment.service";
import { OpenAccountDto } from "src/application/payment/dto/open-account.dto";
import { TopUpDto } from "src/application/payment/dto/top-up.dto";
import { WithdrawDto } from "src/application/payment/dto/withdraw.dto";
import { PayoutFundsDto } from "src/application/payment/dto/payout-funds.dto";
import { AccountResponseDto } from "src/application/payment/dto/account-response.dto";
import { TransactionResponseDto } from "src/application/payment/dto/transaction-response.dto";

@ApiTags('accounts')
@Controller("accounts")
export class AccountController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({
    summary: 'Open a wallet account',
    description: 'Creates a new in-platform wallet for a user. Call this once per user — duplicate `ownerId` values are rejected.',
  })
  @ApiResponse({ status: 201, description: 'Account created.', type: AccountResponseDto })
  @ApiResponse({ status: 409, description: 'Account for this owner already exists.' })
  async openAccount(@Body() dto: OpenAccountDto) {
    return this.paymentService.openAccount(dto);
  }

  @Get(":id")
  @ApiOperation({ summary: 'Get account by its internal ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 200, description: 'The account.', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'No account with this ID.' })
  async getAccount(@Param("id") id: string) {
    return this.paymentService.getAccount(id);
  }

  @Get("by-owner/:ownerId")
  @ApiOperation({ summary: "Get a user's account by their owner/user ID" })
  @ApiParam({ name: 'ownerId', description: 'User UUID (from user-service)' })
  @ApiResponse({ status: 200, description: "The owner's account.", type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'No account found for this owner.' })
  async getAccountByOwner(@Param("ownerId") ownerId: string) {
    return this.paymentService.getAccountByOwner(ownerId);
  }

  @Post(":id/topup")
  @ApiOperation({
    summary: 'Top up an account',
    description: 'Credits the account balance (simulates mobile-money / bank transfer). Funds become available immediately.',
  })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 201, description: 'Account topped up.', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'No account with this ID.' })
  async topUp(@Param("id") id: string, @Body() dto: TopUpDto) {
    return this.paymentService.topUp(id, dto.amount);
  }

  @Post(":id/withdraw")
  @ApiOperation({
    summary: 'Withdraw funds from an account',
    description: 'Debits the available balance (simulates cashing out to mobile-money / bank). Fails if the available balance is insufficient.',
  })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiResponse({ status: 201, description: 'Funds withdrawn.', type: AccountResponseDto })
  @ApiResponse({ status: 404, description: 'No account with this ID.' })
  @ApiResponse({ status: 409, description: 'Insufficient available balance.' })
  async withdraw(@Param("id") id: string, @Body() dto: WithdrawDto) {
    return this.paymentService.withdraw(id, dto.amount);
  }

  @Post("payout")
  @ApiOperation({
    summary: 'Pay out funds to a recipient',
    description:
      'Credits the recipient\'s wallet balance directly — called by trip-service to pay the rider when a trip is completed. ' +
      'A sandbox account is provisioned automatically if the recipient has none yet.',
  })
  @ApiResponse({ status: 201, description: 'Recipient account credited.', type: AccountResponseDto })
  async payout(@Body() dto: PayoutFundsDto) {
    return this.paymentService.payout(dto);
  }

  @Get(":id/transactions")
  @ApiOperation({ summary: "List an account's transaction history", description: 'Returns all holds (HELD/RELEASED/REFUNDED) for the account, newest first.' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Records per page' })
  @ApiResponse({ status: 200, description: "The account's transactions.", type: [TransactionResponseDto] })
  async getTransactions(
    @Param("id") id: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.paymentService.listTransactions(id, page, limit);
  }
}
