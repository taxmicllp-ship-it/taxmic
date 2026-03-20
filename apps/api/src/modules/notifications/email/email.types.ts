export interface SendEmailOptions {
  to: string;
  from?: string;
  subject: string;
  templateName?: string;
  templateVars?: Record<string, string>;
  firmId?: string;
  body?: string;
  html?: string;
}

export interface SendEmailResult {
  messageId: string;
}
