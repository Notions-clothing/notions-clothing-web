import { Order } from '@/types/database';
import { sendBrevoEmail, isBrevoConfigured } from '@/lib/brevo';
import { saveOrder } from '@/lib/db';

export interface DispatchResult {
  success: boolean;
  message: string;
  messageId?: string;
}

/**
 * Escapes HTML characters to prevent XSS in email bodies.
 */
function escapeHtml(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats currency values in INR.
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Wraps content in the official NOTIONS® Opulent Clothing responsive HTML email shell.
 */
function getEmailShell(contentHtml: string, previewText?: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://notionsclothing.com';
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'concierge@notionsclothing.com';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NOTIONS® Opulent Clothing</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #181818; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; border-radius: 0 !important; }
      .mobile-padding { padding: 24px 18px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 30px 10px; background-color: #FAF9F5;">
  ${previewText ? `<div style="display: none; font-size: 1px; color: #FAF9F5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${escapeHtml(previewText)}</div>` : ''}
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAE5DC; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(20, 55, 40, 0.04);">
          
          <!-- Atelier Header -->
          <tr>
            <td align="center" style="padding: 36px 24px 24px 24px; border-bottom: 1px solid #EAE5DC; background-color: #FFFFFF;">
              <a href="${siteUrl}" target="_blank" style="text-decoration: none;">
                <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; color: #143728; margin: 0; letter-spacing: 2px;">
                  NOTIONS<sup>&reg;</sup>
                </h1>
                <p style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #7A756D; margin: 6px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                  OPULENT CLOTHING
                </p>
              </a>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td class="mobile-padding" style="padding: 36px 32px 32px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Atelier Footer -->
          <tr>
            <td style="padding: 28px 32px; background-color: #FAF9F5; border-top: 1px solid #EAE5DC; text-align: center;">
              <p style="font-family: Georgia, serif; font-size: 13px; color: #143728; margin: 0 0 6px 0;">
                NOTIONS<sup>&reg;</sup> Flagship Atelier
              </p>
              <p style="font-size: 11px; line-height: 1.6; color: #7A756D; margin: 0 0 14px 0;">
                Indiranagar, Bengaluru, India &bull; Bespoke Sartorial Luxury
              </p>
              <p style="font-size: 11px; color: #7A756D; margin: 0;">
                Questions? Inquire with our concierge at 
                <a href="mailto:${senderEmail}" style="color: #143728; font-weight: 600; text-decoration: underline;">
                  ${senderEmail}
                </a>
              </p>
              <p style="font-size: 10px; color: #A6A096; margin: 16px 0 0 0;">
                &copy; ${new Date().getFullYear()} NOTIONS&reg; Opulent Clothing. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Password Reset OTP Email (for Customer or Admin)
 */
export async function sendPasswordResetOtpEmail(options: {
  email: string;
  name: string;
  otp: string;
  role: 'customer' | 'admin';
}): Promise<DispatchResult> {
  const { email, name, otp, role } = options;
  if (!email) {
    return { success: false, message: 'Recipient email is required.' };
  }

  const roleLabel = role === 'admin' ? 'Administrative Portal' : 'Member Account';
  const roleGreeting = role === 'admin' ? 'Administrator' : escapeHtml(name || 'Valued Member');
  const subject = `Security Verification Code: ${otp} - NOTIONS`;
  const previewText = `Your security verification code is ${otp}. Valid for 10 minutes.`;

  const bodyHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 12px; background-color: #EFF7F2; border: 1px solid #C6E3D2; border-radius: 9999px; font-size: 11px; font-weight: 600; color: #143728; letter-spacing: 1px; text-transform: uppercase;">
        ${roleLabel}
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 22px; color: #181818; margin: 16px 0 8px 0; font-weight: normal;">
        Password Reset Verification
      </h2>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 440px;">
        Greetings, ${roleGreeting}. We received a request to update your password credentials. Please use the verification code below to verify your identity:
      </p>
    </div>

    <!-- OTP Code Box -->
    <div style="margin: 28px 0; padding: 24px 16px; background-color: #FAF9F5; border: 1px dashed #143728; border-radius: 10px; text-align: center;">
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #7A756D; margin: 0 0 10px 0; font-weight: 600;">
        One-Time Verification Code
      </p>
      <div style="font-family: 'Courier New', Courier, monospace, Georgia; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #143728; padding: 6px 0;">
        ${escapeHtml(otp)}
      </div>
      <p style="font-size: 11px; color: #7A756D; margin: 10px 0 0 0;">
        Expires in <strong>10 minutes</strong> &bull; Single-use only
      </p>
    </div>

    <!-- Security Notice -->
    <div style="padding: 14px 18px; background-color: #FFF8E7; border: 1px solid #F0DEB4; border-radius: 8px; font-size: 12px; line-height: 1.5; color: #8A6D3B; margin-top: 24px;">
      <strong>Security Notice:</strong> If you did not initiate this request, someone may have entered your email by mistake. Your account remains completely secure and no changes have been applied.
    </div>
  `;

  const html = getEmailShell(bodyHtml, previewText);

  try {
    const res = await sendBrevoEmail({
      to: [{ email: email.trim(), name }],
      subject,
      htmlContent: html,
      textContent: `Your NOTIONS® password reset verification code is: ${otp}. This code is valid for 10 minutes.`,
      tags: ['password-reset', role],
    });

    if (!res.success) {
      console.error(`[Email Service] Password reset OTP failed for ${email}:`, res.error);
      return { success: false, message: res.error };
    }

    return {
      success: true,
      message: `Password reset verification code dispatched to ${email}`,
      messageId: res.messageId,
    };
  } catch (err: any) {
    console.error('[Email Service] Unexpected error sending reset OTP:', err);
    return { success: false, message: err?.message || 'Failed to dispatch security code.' };
  }
}

/**
 * 2. Welcome Email sent upon customer registration
 */
export async function sendWelcomeEmail(options: { email: string; name: string }): Promise<DispatchResult> {
  const { email, name } = options;
  if (!email) {
    return { success: false, message: 'Email is required.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://notionsclothing.com';
  const customerName = escapeHtml(name || 'Patron');
  const subject = `Welcome to NOTIONS Opulent Clothing`;
  const previewText = `Welcome to the Atelier, ${customerName}. Discover contemporary luxury.`;

  const bodyHtml = `
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="display: inline-block; padding: 4px 12px; background-color: #EFF7F2; border: 1px solid #C6E3D2; border-radius: 9999px; font-size: 11px; font-weight: 600; color: #143728; letter-spacing: 1px; text-transform: uppercase;">
        New Member Welcome
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #181818; margin: 18px 0 10px 0; font-weight: normal;">
        Welcome to the Atelier
      </h2>
      <p style="font-size: 13px; line-height: 1.7; color: #555555; margin: 0 auto; max-width: 460px;">
        Dear ${customerName}, thank you for registering with NOTIONS®. It is our privilege to invite you into an atelier dedicated to modern elegance, architectural tailoring, and uncompromising textile purity.
      </p>
    </div>

    <!-- Member Privileges Grid -->
    <div style="margin: 28px 0; padding: 22px 20px; background-color: #FAF9F5; border: 1px solid #EAE5DC; border-radius: 10px;">
      <h3 style="font-family: Georgia, serif; font-size: 14px; color: #143728; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; text-align: center;">
        Your Member Privileges
      </h3>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #333333; line-height: 1.5;">
            &bull; <strong>Curated Private Drops:</strong> Priority access to seasonal capsules and limited-edition garments.
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #333333; line-height: 1.5;">
            &bull; <strong>Real-Time Tracking:</strong> Follow your garments from artisanal finishing to direct delivery.
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-size: 13px; color: #333333; line-height: 1.5;">
            &bull; <strong>Bespoke Concierge:</strong> Dedicated client advisors available for sizing and curation inquiries.
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${siteUrl}/shop" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #143728; color: #FFFFFF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; border-radius: 8px;">
        Explore the Collection
      </a>
    </div>
  `;

  const html = getEmailShell(bodyHtml, previewText);

  try {
    const res = await sendBrevoEmail({
      to: [{ email: email.trim(), name }],
      subject,
      htmlContent: html,
      textContent: `Welcome to NOTIONS® Opulent Clothing, ${name}. Explore our luxury collection at ${siteUrl}/shop.`,
      tags: ['welcome-email', 'customer'],
    });

    if (!res.success) {
      console.error(`[Email Service] Welcome email failed for ${email}:`, res.error);
      return { success: false, message: res.error };
    }

    return {
      success: true,
      message: `Welcome email prepared for ${email}`,
      messageId: res.messageId,
    };
  } catch (err: any) {
    console.error('[Email Service] Welcome email dispatch error:', err);
    return { success: false, message: err?.message || 'Failed to dispatch welcome email.' };
  }
}

/**
 * 3. Order Confirmation Email
 * Dispatches to both Customer and Admin (via direct delivery & BCC).
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<DispatchResult> {
  if (!order || !order.customer_email) {
    return { success: false, message: 'Valid customer email is required on order.' };
  }

  // Idempotency: Prevent duplicate order confirmation emails
  if (order.confirmation_email_sent_at) {
    return {
      success: true,
      message: `Order confirmation email already dispatched on ${order.confirmation_email_sent_at}`,
    };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL || 'admin@notionsclothing.com').trim();
  const customerName = escapeHtml(order.customer_name || 'Valued Patron');
  const subject = `Order Confirmed #${order.order_number} - NOTIONS Opulent Clothing`;
  const previewText = `Thank you for your order #${order.order_number}. Total: ${formatCurrency(order.total_amount)}`;

  // Construct Order Items HTML Table Rows
  const itemsHtml = (order.items || [])
    .map((item) => {
      const variantDetails: string[] = [];
      if (item.selected_size_id) variantDetails.push(`Size: ${escapeHtml(item.selected_size_id)}`);
      if (item.selected_color) variantDetails.push(`Color: ${escapeHtml(item.selected_color)}`);
      if (item.variant_label) variantDetails.push(escapeHtml(item.variant_label));

      return `
        <tr style="border-bottom: 1px solid #F0EDE6;">
          <td style="padding: 14px 8px; vertical-align: top;">
            <p style="font-size: 13px; font-weight: 600; color: #181818; margin: 0 0 4px 0;">
              ${escapeHtml(item.product_name)}
            </p>
            ${variantDetails.length > 0 ? `<p style="font-size: 11px; color: #7A756D; margin: 0;">${variantDetails.join(' &bull; ')}</p>` : ''}
          </td>
          <td style="padding: 14px 8px; text-align: center; vertical-align: top; font-size: 12px; color: #555555;">
            ${item.quantity}
          </td>
          <td style="padding: 14px 8px; text-align: right; vertical-align: top; font-size: 12px; color: #555555;">
            ${formatCurrency(item.unit_price)}
          </td>
          <td style="padding: 14px 8px; text-align: right; vertical-align: top; font-size: 12px; font-weight: 600; color: #181818;">
            ${formatCurrency(item.line_total || item.unit_price * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join('');

  // Shipping Address Formatter
  const addr = order.shipping_address;
  const addressHtml = addr
    ? `${escapeHtml(addr.street || '')}<br/>${escapeHtml(addr.city || '')}, ${escapeHtml(addr.state || '')} - ${escapeHtml(addr.postal_code || '')}<br/>${escapeHtml(addr.country || 'India')}`
    : 'Standard Address on File';

  const bodyHtml = `
    <!-- Header Badge -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 12px; background-color: #EFF7F2; border: 1px solid #C6E3D2; border-radius: 9999px; font-size: 11px; font-weight: 600; color: #143728; letter-spacing: 1px; text-transform: uppercase;">
        Order Confirmed &bull; #${escapeHtml(order.order_number)}
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #181818; margin: 16px 0 8px 0; font-weight: normal;">
        Thank You for Your Patronage
      </h2>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 460px;">
        Dear ${customerName}, your payment has been verified and your order is now secured for atelier fulfillment.
      </p>
    </div>

    <!-- Items Summary Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #EAE5DC; background-color: #FAF9F5;">
          <th align="left" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #7A756D; text-transform: uppercase; letter-spacing: 1px;">Item</th>
          <th align="center" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #7A756D; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
          <th align="right" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #7A756D; text-transform: uppercase; letter-spacing: 1px;">Price</th>
          <th align="right" style="padding: 10px 8px; font-size: 11px; font-weight: 700; color: #7A756D; text-transform: uppercase; letter-spacing: 1px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 16px; border-top: 1px solid #EAE5DC;">
      <tr>
        <td style="padding: 8px 0; font-size: 12px; color: #7A756D;">Subtotal</td>
        <td style="padding: 8px 0; font-size: 12px; color: #181818; text-align: right;">${formatCurrency(order.subtotal || 0)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 12px; color: #7A756D;">Shipping & Handling</td>
        <td style="padding: 8px 0; font-size: 12px; color: #181818; text-align: right;">
          ${(order.shipping_amount || 0) === 0 ? '<span style="color: #143728; font-weight: 600;">Complimentary</span>' : formatCurrency(order.shipping_amount)}
        </td>
      </tr>
      ${order.discount_amount ? `
      <tr>
        <td style="padding: 8px 0; font-size: 12px; color: #143728;">Privilege Discount</td>
        <td style="padding: 8px 0; font-size: 12px; color: #143728; text-align: right;">-${formatCurrency(order.discount_amount)}</td>
      </tr>` : ''}
      <tr style="border-top: 1px solid #EAE5DC;">
        <td style="padding: 12px 0; font-size: 14px; font-weight: 700; color: #143728;">Total Amount</td>
        <td style="padding: 12px 0; font-size: 16px; font-weight: 700; color: #143728; text-align: right;">${formatCurrency(order.total_amount)}</td>
      </tr>
    </table>

    <!-- Dual Column: Delivery Address & Payment Summary -->
    <div style="margin-top: 28px; padding: 20px; background-color: #FAF9F5; border: 1px solid #EAE5DC; border-radius: 8px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td valign="top" class="mobile-stack" style="width: 50%; padding-right: 12px;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #143728; margin: 0 0 6px 0;">
              Delivery Address
            </p>
            <p style="font-size: 12px; line-height: 1.6; color: #444444; margin: 0;">
              <strong>${customerName}</strong><br/>
              ${addressHtml}<br/>
              ${order.customer_phone ? `Phone: ${escapeHtml(order.customer_phone)}` : ''}
            </p>
          </td>
          <td valign="top" class="mobile-stack" style="width: 50%; padding-left: 12px;">
            <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #143728; margin: 0 0 6px 0;">
              Payment Verification
            </p>
            <p style="font-size: 12px; line-height: 1.6; color: #444444; margin: 0;">
              Status: <strong style="color: #143728;">PAID &amp; VERIFIED</strong><br/>
              Method: Razorpay Secure Checkout<br/>
              ${order.razorpay_payment_id ? `Ref: <span style="font-family: monospace;">${escapeHtml(order.razorpay_payment_id)}</span>` : ''}
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;

  const html = getEmailShell(bodyHtml, previewText);

  try {
    // Send to Customer with Admin in BCC for comprehensive order notification
    const bccList = adminEmail && adminEmail.toLowerCase() !== order.customer_email.toLowerCase()
      ? [{ email: adminEmail, name: 'NOTIONS® Orders Desk' }]
      : undefined;

    const res = await sendBrevoEmail({
      to: [{ email: order.customer_email.trim(), name: order.customer_name }],
      bcc: bccList,
      subject,
      htmlContent: html,
      textContent: `Order Confirmed #${order.order_number}. Total: ${formatCurrency(order.total_amount)}. Customer: ${order.customer_name}.`,
      tags: ['order-confirmation', 'transactional'],
    });

    if (!res.success) {
      console.error(`[Email Service] Order confirmation email failed for #${order.order_number}:`, res.error);
      return { success: false, message: res.error };
    }

    // Persist idempotency timestamp to prevent duplicate notifications
    const sentAt = new Date().toISOString();
    try {
      await saveOrder({
        id: order.id,
        order_number: order.order_number,
        confirmation_email_sent_at: sentAt,
      });
    } catch (saveErr) {
      console.warn('[Email Service] Failed to record confirmation timestamp (non-fatal):', saveErr);
    }

    return {
      success: true,
      message: `Order confirmation dispatched for #${order.order_number} to ${order.customer_email}`,
      messageId: res.messageId,
    };
  } catch (err: any) {
    console.error('[Email Service] Unexpected order confirmation error:', err);
    return { success: false, message: err?.message || 'Failed to dispatch order confirmation.' };
  }
}

/**
 * 4. Order Status & Shipping Tracking Email
 * Dispatches notification when order status is marked as 'shipped' (or 'delivered').
 */
export async function sendOrderStatusEmail(
  order: Order,
  options?: { force?: boolean }
): Promise<DispatchResult> {
  if (!order || !order.customer_email) {
    return { success: false, message: 'Valid customer email is required on order.' };
  }

  // Idempotency: Only skip if not explicitly forced, already emailed for this status, and no new tracking info
  if (!options?.force && order.last_emailed_status === order.status && order.status_email_sent_at && !order.tracking_number) {
    return {
      success: true,
      message: `Status email already sent for status (${order.status})`,
    };
  }

  const customerName = escapeHtml(order.customer_name || 'Valued Patron');
  const isShipped = order.status === 'shipped';
  const statusHeadline = isShipped
    ? `Your Order #${escapeHtml(order.order_number)} Has Shipped`
    : order.status === 'delivered'
    ? `Your Order #${escapeHtml(order.order_number)} Has Been Delivered`
    : `Order #${escapeHtml(order.order_number)} Status Update: ${escapeHtml(order.status.toUpperCase())}`;

  // Keep email header clean ASCII to avoid mail transfer agent mojibake
  const subject = `${statusHeadline} - NOTIONS Opulent Clothing`;
  const previewText = `Your order #${order.order_number} is now ${order.status.toUpperCase()}. Track your delivery.`;

  // Tracking Details Box
  const hasTracking = Boolean(order.tracking_carrier || order.tracking_number);
  const trackingBoxHtml = hasTracking
    ? `
      <div style="margin: 24px 0; padding: 20px; background-color: #EFF7F2; border: 1px solid #C6E3D2; border-radius: 10px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #143728; padding-bottom: 8px;">
              Courier &amp; Tracking Information
            </td>
          </tr>
          <tr>
            <td style="font-size: 13px; line-height: 1.6; color: #181818;">
              Carrier: <strong>${escapeHtml(order.tracking_carrier || 'Standard Express Courier')}</strong><br/>
              Tracking ID (AWB): <strong style="font-family: monospace; font-size: 14px; letter-spacing: 1px; color: #143728;">${escapeHtml(order.tracking_number || 'Pending Assignment')}</strong>
            </td>
          </tr>
          ${order.tracking_url ? `
          <tr>
            <td style="padding-top: 14px;">
              <a href="${escapeHtml(order.tracking_url)}" target="_blank" style="display: inline-block; padding: 10px 22px; background-color: #143728; color: #FFFFFF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; border-radius: 6px;">
                Track Consignment
              </a>
            </td>
          </tr>` : ''}
        </table>
      </div>
    `
    : '';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://notionsclothing.com';
  const lookupUrl = `${siteUrl}/account?orderNumber=${encodeURIComponent(order.order_number)}`;

  const bodyHtml = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 12px; background-color: #EFF7F2; border: 1px solid #C6E3D2; border-radius: 9999px; font-size: 11px; font-weight: 600; color: #143728; letter-spacing: 1px; text-transform: uppercase;">
        Order #${escapeHtml(order.order_number)} &bull; ${escapeHtml(order.status.toUpperCase())}
      </span>
      <h2 style="font-family: Georgia, serif; font-size: 24px; color: #181818; margin: 16px 0 8px 0; font-weight: normal;">
        ${statusHeadline}
      </h2>
      <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0 auto; max-width: 460px;">
        Dear ${customerName}, your NOTIONS® bespoke garments have been carefully inspected, packaged in our atelier, and handed over to our courier partner.
      </p>
    </div>

    ${trackingBoxHtml}

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${lookupUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #143728; color: #FFFFFF; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; border-radius: 6px;">
        View Order in Member Account
      </a>
    </div>
  `;

  const html = getEmailShell(bodyHtml, previewText);

  try {
    const res = await sendBrevoEmail({
      to: [{ email: order.customer_email.trim(), name: order.customer_name }],
      subject,
      htmlContent: html,
      textContent: `${statusHeadline}. Carrier: ${order.tracking_carrier || 'Express'}. Tracking: ${order.tracking_number || 'Pending'}.`,
      tags: ['shipping-update', order.status],
    });

    if (!res.success) {
      console.error(`[Email Service] Status update email failed for #${order.order_number}:`, res.error);
      return { success: false, message: res.error };
    }

    return {
      success: true,
      message: `Order status update (${order.status}) prepared for ${order.customer_email}`,
      messageId: res.messageId,
    };
  } catch (err: any) {
    console.error('[Email Service] Unexpected status email error:', err);
    return { success: false, message: err?.message || 'Failed to dispatch status update email.' };
  }
}
