/**
 * Server-side Brevo (formerly Sendinblue) Transactional Email Service
 *
 * Uses the official Brevo REST API v3 (https://api.brevo.com/v3/smtp/email)
 * with HTTPS authentication via the `api-key` header.
 *
 * NOTE: This service runs strictly on the server-side. Do not import in client components.
 */

const BREVO_API_BASE_URL = 'https://api.brevo.com/v3';

export interface BrevoEmailRecipient {
  email: string;
  name?: string;
}

export interface BrevoEmailAttachment {
  name: string;
  url?: string;
  content?: string; // Base64 encoded string
}

export interface SendBrevoEmailOptions {
  /**
   * One or more recipient email addresses or recipient objects.
   */
  to: BrevoEmailRecipient[] | BrevoEmailRecipient | string | string[];

  /**
   * Email subject line.
   */
  subject: string;

  /**
   * HTML body of the email. At least one of htmlContent, textContent, or templateId must be specified.
   */
  htmlContent?: string;

  /**
   * Plain text fallback body of the email.
   */
  textContent?: string;

  /**
   * Optional sender override. Defaults to BREVO_SENDER_EMAIL and BREVO_SENDER_NAME environment variables.
   */
  sender?: BrevoEmailRecipient;

  /**
   * Optional reply-to recipient.
   */
  replyTo?: BrevoEmailRecipient;

  /**
   * Carbon copy recipients.
   */
  cc?: BrevoEmailRecipient[];

  /**
   * Blind carbon copy recipients.
   */
  bcc?: BrevoEmailRecipient[];

  /**
   * Optional attachments (URL or base64 content).
   */
  attachment?: BrevoEmailAttachment[];

  /**
   * Custom HTTP email headers (e.g. X-Mailin-custom).
   */
  headers?: Record<string, string>;

  /**
   * Dynamic template parameters / variables if using templates or placeholders.
   */
  params?: Record<string, unknown>;

  /**
   * Brevo transactional template ID if sending with a pre-configured template.
   */
  templateId?: number;

  /**
   * Tags for organizing and tracking campaigns in Brevo analytics.
   */
  tags?: string[];
}

export interface BrevoSuccessResponse {
  success: true;
  messageId: string;
}

export interface BrevoErrorResponse {
  success: false;
  error: string;
  code?: string;
  statusCode?: number;
}

export type BrevoSendEmailResult = BrevoSuccessResponse | BrevoErrorResponse;

export interface BrevoConfigSummary {
  isConfigured: boolean;
  hasApiKey: boolean;
  senderEmail: string;
  senderName: string;
}

export interface BrevoAccountInfo {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface BrevoConnectionCheckResult {
  success: boolean;
  account?: BrevoAccountInfo;
  error?: string;
  statusCode?: number;
}

/**
 * Ensures this module is only ever executed in a server environment.
 */
function assertServerEnvironment(): void {
  if (typeof window !== 'undefined') {
    throw new Error('[Brevo Service] This email service is strictly server-side and must not be bundled or executed in the browser.');
  }
}

/**
 * Strips surrounding quotes and whitespace from environment strings.
 */
function cleanEnvString(val?: string | null): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Normalizes input recipients into an array of BrevoEmailRecipient objects.
 */
function normalizeRecipients(
  input: BrevoEmailRecipient[] | BrevoEmailRecipient | string | string[]
): BrevoEmailRecipient[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === 'string' ? { email: item.trim() } : { email: item.email.trim(), name: item.name?.trim() }))
      .filter((r) => Boolean(r.email));
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed ? [{ email: trimmed }] : [];
  }

  if (input && typeof input === 'object' && input.email) {
    return [{ email: input.email.trim(), name: input.name?.trim() }];
  }

  return [];
}

/**
 * Retrieves the current Brevo configuration from environment variables.
 */
export function getBrevoConfig(): BrevoConfigSummary {
  assertServerEnvironment();

  const apiKey = cleanEnvString(process.env.BREVO_API_KEY);
  const senderEmail = cleanEnvString(process.env.BREVO_SENDER_EMAIL);
  const senderName = cleanEnvString(process.env.BREVO_SENDER_NAME);

  return {
    isConfigured: Boolean(apiKey && senderEmail),
    hasApiKey: Boolean(apiKey),
    senderEmail,
    senderName,
  };
}

/**
 * Checks whether the minimum required Brevo environment variables are configured.
 */
export function isBrevoConfigured(): boolean {
  return getBrevoConfig().isConfigured;
}

/**
 * Sends a transactional email using the official Brevo REST API v3.
 *
 * @param options SendBrevoEmailOptions configuration
 * @returns Promise<BrevoSendEmailResult>
 */
export async function sendBrevoEmail(
  options: SendBrevoEmailOptions
): Promise<BrevoSendEmailResult> {
  assertServerEnvironment();

  const apiKey = cleanEnvString(process.env.BREVO_API_KEY);
  if (!apiKey) {
    return {
      success: false,
      error: 'Brevo API key is missing. Set the BREVO_API_KEY environment variable.',
    };
  }

  const defaultSenderEmail = cleanEnvString(process.env.BREVO_SENDER_EMAIL);
  const defaultSenderName = cleanEnvString(process.env.BREVO_SENDER_NAME);

  const senderEmail = options.sender?.email?.trim() || defaultSenderEmail;
  const senderName = options.sender?.name?.trim() || defaultSenderName;

  if (!senderEmail) {
    return {
      success: false,
      error: 'Brevo sender email is missing. Set BREVO_SENDER_EMAIL or provide sender.email in options.',
    };
  }

  const recipients = normalizeRecipients(options.to);
  if (recipients.length === 0) {
    return {
      success: false,
      error: 'At least one valid recipient email is required.',
    };
  }

  if (!options.subject?.trim()) {
    return {
      success: false,
      error: 'Email subject cannot be empty.',
    };
  }

  if (!options.htmlContent && !options.textContent && !options.templateId) {
    return {
      success: false,
      error: 'Email content is missing. Provide htmlContent, textContent, or templateId.',
    };
  }

  // Construct official Brevo API v3 transactional email payload
  const payload: Record<string, unknown> = {
    sender: senderName ? { name: senderName, email: senderEmail } : { email: senderEmail },
    to: recipients,
    subject: options.subject.trim(),
  };

  if (options.htmlContent) {
    payload.htmlContent = options.htmlContent;
  }

  if (options.textContent) {
    payload.textContent = options.textContent;
  }

  if (options.templateId) {
    payload.templateId = options.templateId;
  }

  if (options.replyTo && options.replyTo.email) {
    payload.replyTo = {
      email: options.replyTo.email.trim(),
      ...(options.replyTo.name ? { name: options.replyTo.name.trim() } : {}),
    };
  }

  if (options.cc && options.cc.length > 0) {
    payload.cc = normalizeRecipients(options.cc);
  }

  if (options.bcc && options.bcc.length > 0) {
    payload.bcc = normalizeRecipients(options.bcc);
  }

  if (options.attachment && options.attachment.length > 0) {
    payload.attachment = options.attachment;
  }

  if (options.headers && Object.keys(options.headers).length > 0) {
    payload.headers = options.headers;
  }

  if (options.params && Object.keys(options.params).length > 0) {
    payload.params = options.params;
  }

  if (options.tags && options.tags.length > 0) {
    payload.tags = options.tags.map((t) => t.trim()).filter(Boolean);
  }

  try {
    const response = await fetch(`${BREVO_API_BASE_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        responseData && typeof responseData === 'object' && 'message' in responseData
          ? String((responseData as { message: unknown }).message)
          : `Brevo API returned status ${response.status} (${response.statusText})`;

      const errorCode =
        responseData && typeof responseData === 'object' && 'code' in responseData
          ? String((responseData as { code: unknown }).code)
          : undefined;

      console.error('[Brevo Service] API request failed:', {
        statusCode: response.status,
        code: errorCode,
        message: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        code: errorCode,
        statusCode: response.status,
      };
    }

    const messageId =
      responseData && typeof responseData === 'object' && 'messageId' in responseData
        ? String((responseData as { messageId: unknown }).messageId)
        : '';

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error sending email via Brevo API';
    console.error('[Brevo Service] Network exception occurred:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Validates Brevo API key authentication and retrieves account details.
 * Useful for health-checks and administrative configuration verification.
 *
 * @returns Promise<BrevoConnectionCheckResult>
 */
export async function verifyBrevoConnection(): Promise<BrevoConnectionCheckResult> {
  assertServerEnvironment();

  const apiKey = cleanEnvString(process.env.BREVO_API_KEY);
  if (!apiKey) {
    return {
      success: false,
      error: 'Brevo API key is missing. Set the BREVO_API_KEY environment variable.',
    };
  }

  try {
    const response = await fetch(`${BREVO_API_BASE_URL}/account`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': apiKey,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        data && typeof data === 'object' && 'message' in data
          ? String((data as { message: unknown }).message)
          : `Brevo account verification failed with status ${response.status}`;

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
      };
    }

    return {
      success: true,
      account: {
        email: data?.email || '',
        firstName: data?.firstName,
        lastName: data?.lastName,
        companyName: data?.companyName,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect to Brevo API';
    return {
      success: false,
      error: message,
    };
  }
}

