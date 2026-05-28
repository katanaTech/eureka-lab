import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface CoppaConfirmationEmail {
  parentEmail: string;
  kidDisplayName: string;
  confirmUrl: string;
}

/**
 * Transactional email service backed by Resend.
 *
 * When `RESEND_API_KEY` is absent (local dev), this service logs the
 * email payload to console instead of sending — that lets the COPPA
 * flow be exercised end-to-end without sending real email or signing
 * up for a Resend account.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend?: Resend;
  private readonly fromAddress: string;

  constructor(@Optional() private readonly config?: ConfigService) {
    const apiKey = config?.get<string>('RESEND_API_KEY') ?? process.env.RESEND_API_KEY;
    this.fromAddress =
      config?.get<string>('RESEND_FROM_EMAIL') ??
      process.env.RESEND_FROM_EMAIL ??
      'no-reply@eurekalab.example.com';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY not set — EmailService runs in console-log mode (no real emails sent).',
      );
    }
  }

  /**
   * Send the COPPA parent-confirmation email.
   *
   * @param email - Parent's email address (from the pending signup)
   * @returns Resolved when the send call completes (or logged in dev).
   */
  async sendCoppaConfirmation(email: CoppaConfirmationEmail): Promise<void> {
    const subject = `Confirm ${email.kidDisplayName}'s Eureka Lab account`;
    const text = [
      `Hi,`,
      ``,
      `${email.kidDisplayName} wants to create an Eureka Lab account to learn about AI.`,
      `Because they are under 13, US COPPA rules require a parent to confirm.`,
      ``,
      `Click here to confirm: ${email.confirmUrl}`,
      ``,
      `This link expires in 7 days. If you didn't expect this email, you can ignore it — no account is created until you click.`,
      ``,
      `— The Eureka Lab team`,
    ].join('\n');

    if (!this.resend) {
      this.logger.log({
        event: 'email_send_stub',
        to: email.parentEmail,
        subject,
        body: text,
      });
      return;
    }

    const result = await this.resend.emails.send({
      from: this.fromAddress,
      to: email.parentEmail,
      subject,
      text,
    });

    if (result.error) {
      this.logger.error(
        `Resend send failed for ${email.parentEmail}: ${result.error.message}`,
      );
      throw new Error(`Failed to send confirmation email: ${result.error.message}`);
    }

    this.logger.log({ event: 'email_sent', to: email.parentEmail, subject });
  }
}
