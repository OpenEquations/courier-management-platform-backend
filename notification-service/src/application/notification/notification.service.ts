import { Inject, Injectable, Logger } from '@nestjs/common';
import { EMAIL_SENDER_PORT } from '../../domain/notification/interfaces/email-sender.port';
import type { IEmailSenderPort } from '../../domain/notification/interfaces/email-sender.port';
import { SMS_SENDER_PORT } from '../../domain/notification/interfaces/sms-sender.port';
import type { ISmsSenderPort } from '../../domain/notification/interfaces/sms-sender.port';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(EMAIL_SENDER_PORT) private readonly emailSender: IEmailSenderPort,
    @Inject(SMS_SENDER_PORT) private readonly smsSender: ISmsSenderPort,
  ) {}

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
    this.logger.log(`Sending email → ${to} | ${subject}`);
    await this.emailSender.send({ to, subject, text, html });
  }

  async sendSms(to: string, body: string): Promise<void> {
    this.logger.log(`Sending SMS → ${to}`);
    await this.smsSender.send({ to, body });
  }

  // ── Convenience methods for domain events ──────────────────────────────────

  async notifyTripCreated(passengerEmail: string, tripId: string): Promise<void> {
    await this.sendEmail(
      passengerEmail,
      'Your trip has been created',
      `Your trip (${tripId}) has been created and we are searching for an available rider. You'll be notified once a rider is on the way.`,
      `<p>Your trip <strong>#${tripId}</strong> has been created.</p><p>We are searching for an available rider. You'll be notified once a match is found.</p>`,
    );
  }

  async notifyTripCompleted(passengerEmail: string, riderPhone: string, tripId: string, amount: number): Promise<void> {
    await Promise.all([
      this.sendEmail(
        passengerEmail,
        'Your trip has been completed',
        `Your trip (${tripId}) has been completed successfully. Payment of $${amount.toFixed(2)} has been processed. Thank you for using our service!`,
        `<p>Your trip <strong>#${tripId}</strong> has been completed.</p><p>Payment of <strong>$${amount.toFixed(2)}</strong> has been processed. Thank you!</p>`,
      ),
      this.sendSms(
        riderPhone,
        `Trip #${tripId} completed. Your payment of $${amount.toFixed(2)} has been released. Great job!`,
      ),
    ]);
  }

  async notifyTripCancelled(recipientEmail: string, tripId: string, cancelledBy: string, reason: string): Promise<void> {
    await this.sendEmail(
      recipientEmail,
      'Your trip has been cancelled',
      `Your trip (${tripId}) has been cancelled by ${cancelledBy}. Reason: ${reason}.`,
      `<p>Your trip <strong>#${tripId}</strong> has been cancelled by <strong>${cancelledBy}</strong>.</p><p>Reason: ${reason}</p>`,
    );
  }

  async notifyRiderAssigned(riderPhone: string, tripId: string, deliveryId: string | null, agreedPrice: number): Promise<void> {
    const context = deliveryId ? `package delivery (${deliveryId})` : 'trip';
    await this.sendSms(
      riderPhone,
      `You have been assigned to ${context} — Trip #${tripId}. Agreed price: $${agreedPrice.toFixed(2)}. Head to the pickup location.`,
    );
  }

  async notifyRiderHandedOff(fromRiderPhone: string, toRiderPhone: string, tripId: string): Promise<void> {
    await Promise.all([
      this.sendSms(fromRiderPhone, `Trip #${tripId} has been handed off successfully. Thank you!`),
      this.sendSms(toRiderPhone, `You have received trip #${tripId} via handoff. Please proceed to the pickup location.`),
    ]);
  }

  async notifyDeliveryCreated(recipientPhone: string, trackingNumber: string, dropoffAddress: string): Promise<void> {
    await this.sendSms(
      recipientPhone,
      `A package is on its way to you! Tracking: ${trackingNumber}. Delivery address: ${dropoffAddress}. We'll notify you when it's picked up.`,
    );
  }

  async notifyDeliveryPickedUp(recipientPhone: string, trackingNumber: string): Promise<void> {
    await this.sendSms(
      recipientPhone,
      `Good news! Your package (${trackingNumber}) has been picked up by the rider and is on its way.`,
    );
  }

  async notifyDeliveryDelivered(recipientPhone: string, trackingNumber: string): Promise<void> {
    await this.sendSms(
      recipientPhone,
      `Your package (${trackingNumber}) has been delivered successfully. Thank you!`,
    );
  }

  async notifyDeliveryFailed(recipientPhone: string, trackingNumber: string, reason: string, attempt: number): Promise<void> {
    await this.sendSms(
      recipientPhone,
      `Delivery attempt #${attempt} for package (${trackingNumber}) was unsuccessful. Reason: ${reason}. We will try again soon.`,
    );
  }

  async notifyDeliveryReturned(senderEmail: string, trackingNumber: string, reason: string): Promise<void> {
    await this.sendEmail(
      senderEmail,
      'Your package has been returned',
      `Your package (${trackingNumber}) could not be delivered and has been returned. Reason: ${reason}. Please contact support if you need assistance.`,
      `<p>Your package <strong>${trackingNumber}</strong> could not be delivered and has been returned.</p><p>Reason: ${reason}</p>`,
    );
  }

  async notifyRidersOffered(passengerEmail: string, tripId: string, riderCount: number): Promise<void> {
    await this.sendEmail(
      passengerEmail,
      'Riders are being matched for your trip',
      `Great news! We found ${riderCount} available rider(s) near you for trip #${tripId}. A rider will confirm shortly.`,
      `<p>Great news! We found <strong>${riderCount}</strong> available rider(s) near you for trip <strong>#${tripId}</strong>.</p><p>A rider will confirm shortly.</p>`,
    );
  }
}
