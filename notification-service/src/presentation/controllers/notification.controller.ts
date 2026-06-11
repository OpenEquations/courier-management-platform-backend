import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendEmailDto } from '../../application/notification/dto/send-email.dto';
import { SendSmsDto } from '../../application/notification/dto/send-sms.dto';
import { NotificationService } from '../../application/notification/notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Send an email notification',
    description:
      'Called by other services (trip-service, delivery-service, etc.) to dispatch an email directly. ' +
      'Most notifications are triggered automatically via Kafka events.',
  })
  @ApiResponse({ status: 204, description: 'Email dispatched.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async sendEmail(@Body() dto: SendEmailDto): Promise<void> {
    await this.notificationService.sendEmail(dto.to, dto.subject, dto.text, dto.html);
  }

  @Post('sms')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Send an SMS notification',
    description:
      'Called by other services to dispatch an SMS directly. ' +
      'Most notifications are triggered automatically via Kafka events.',
  })
  @ApiResponse({ status: 204, description: 'SMS dispatched.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async sendSms(@Body() dto: SendSmsDto): Promise<void> {
    await this.notificationService.sendSms(dto.to, dto.body);
  }
}

@ApiTags('health')
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Used by Docker/Kubernetes to verify the process is alive.',
  })
  @ApiResponse({ status: 200, schema: { type: 'string', example: 'notification-service OK' } })
  health(): string {
    return 'notification-service OK';
  }
}
