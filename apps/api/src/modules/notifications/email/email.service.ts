import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { config } from '../../../config';
import { logger } from '../../../shared/utils/logger';
import { withRetry } from '../../../shared/utils/retry';
import { emailEventsService } from '../email-events/email-events.service';
import { SendEmailOptions, SendEmailResult } from './email.types';

const TEMPLATES_DIR = join(__dirname, 'templates');

const TEMPLATE_FILES: Record<string, string> = {
  welcome: 'welcome.html',
  invoice: 'invoice.html',
  password_reset: 'password-reset.html',
};

function loadTemplate(templateName: string, vars: Record<string, string> = {}): string | null {
  const filename = TEMPLATE_FILES[templateName];
  if (!filename) return null;
  try {
    let html = readFileSync(join(TEMPLATES_DIR, filename), 'utf-8');
    for (const [key, value] of Object.entries(vars)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return html;
  } catch {
    return null;
  }
}

class EmailService {
  private resend: Resend | null = config.resendApiKey ? new Resend(config.resendApiKey) : null;

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const messageId = randomUUID();
    const from = options.from ?? config.emailFrom;

    // Resolve HTML: explicit override > named template file > plain body fallback
    let html = options.html;
    if (!html && options.templateName) {
      html = loadTemplate(options.templateName, options.templateVars ?? {}) ?? undefined;
    }
    if (!html) {
      html = `<p>${options.body ?? options.subject}</p>`;
    }

    if (this.resend) {
      const { error } = await withRetry(
        () => this.resend!.emails.send({
          from,
          to: options.to,
          subject: options.subject,
          html,
        }),
        { label: 'resend.sendEmail', attempts: 3 }
      );

      if (error) {
        logger.error({ event: 'EMAIL_SEND_ERROR', error, to: options.to });
        // Log failed delivery event
        await emailEventsService.logEmailEvent({
          firmId: options.firmId ?? null,
          messageId,
          emailTo: options.to,
          emailFrom: from,
          subject: options.subject,
          templateName: options.templateName,
          eventType: 'failed',
        });
      } else {
        logger.info({ event: 'EMAIL_SENT', to: options.to, subject: options.subject });
      }
    } else {
      logger.info({
        event: 'EMAIL_STUB',
        to: options.to,
        subject: options.subject,
        template: options.templateName,
      });
    }

    await emailEventsService.logEmailEvent({
      firmId: options.firmId ?? null,
      messageId,
      emailTo: options.to,
      emailFrom: from,
      subject: options.subject,
      templateName: options.templateName,
      eventType: 'sent',
    });

    return { messageId };
  }
}

export const emailService = new EmailService();
