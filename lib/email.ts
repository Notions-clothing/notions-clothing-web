import net from 'net';
import tls from 'tls';
import { Order } from '@/types/database';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_SMTP_HOST = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
const BREVO_SMTP_PORT = Number(process.env.BREVO_SMTP_PORT || 587);
const BREVO_SMTP_USER = process.env.BREVO_SMTP_USER || 'c0a73d001@smtp-brevo.com';
const BREVO_SMTP_PASS = process.env.BREVO_SMTP_PASS || BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'SIYADSIDU760@GMAIL.COM';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'NOTIONS® Opulent Clothing';

/**
 * Native STARTTLS SMTP sender for Brevo SMTP Relay (smtp-relay.brevo.com:587)
 */
async function sendViaBrevoSmtp(options: {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  toName: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const socket = net.createConnection(BREVO_SMTP_PORT, BREVO_SMTP_HOST);
    let currentStream: net.Socket | tls.TLSSocket = socket;
    let buffer = '';

    const timeout = setTimeout(() => {
      try {
        currentStream.destroy();
      } catch {}
      resolve({ success: false, message: 'SMTP connection timed out' });
    }, 15000);

    const finish = (result: { success: boolean; message: string }) => {
      clearTimeout(timeout);
      try {
        currentStream.end();
      } catch {}
      resolve(result);
    };

    const readResponse = (stream: net.Socket | tls.TLSSocket): Promise<string> => {
      return new Promise((res, rej) => {
        const onData = (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split('\r\n');
          // Check if the last complete line has a 3-digit code followed by space (end of multiline response)
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (/^\d{3} /.test(line)) {
              const fullResp = lines.slice(0, i + 1).join('\r\n');
              buffer = lines.slice(i + 1).join('\r\n');
              stream.removeListener('data', onData);
              stream.removeListener('error', onErr);
              res(fullResp);
              return;
            }
          }
        };
        const onErr = (err: Error) => {
          stream.removeListener('data', onData);
          rej(err);
        };
        stream.on('data', onData);
        stream.once('error', onErr);
      });
    };

    const sendCommand = async (stream: net.Socket | tls.TLSSocket, cmd: string): Promise<string> => {
      stream.write(cmd + '\r\n');
      return readResponse(stream);
    };

    (async () => {
      try {
        // 1. Read 220 banner
        const banner = await readResponse(socket);
        if (!banner.startsWith('220')) {
          return finish({ success: false, message: `SMTP greeting failed: ${banner}` });
        }

        // 2. EHLO
        const ehlo1 = await sendCommand(socket, 'EHLO notionsclothing.com');
        if (!ehlo1.startsWith('250')) {
          return finish({ success: false, message: `SMTP EHLO failed: ${ehlo1}` });
        }

        // 3. STARTTLS
        const startTlsResp = await sendCommand(socket, 'STARTTLS');
        if (!startTlsResp.startsWith('220')) {
          return finish({ success: false, message: `SMTP STARTTLS failed: ${startTlsResp}` });
        }

        // 4. Upgrade to TLS
        const tlsSocket = await new Promise<tls.TLSSocket>((res, rej) => {
          const secure = tls.connect(
            {
              socket,
              servername: BREVO_SMTP_HOST,
            },
            () => res(secure)
          );
          secure.once('error', rej);
        });
        currentStream = tlsSocket;
        buffer = '';

        // 5. EHLO over TLS
        const ehlo2 = await sendCommand(tlsSocket, 'EHLO notionsclothing.com');
        if (!ehlo2.startsWith('250')) {
          return finish({ success: false, message: `TLS EHLO failed: ${ehlo2}` });
        }

        // 6. AUTH LOGIN
        const authResp = await sendCommand(tlsSocket, 'AUTH LOGIN');
        if (!authResp.startsWith('334')) {
          return finish({ success: false, message: `SMTP AUTH LOGIN failed: ${authResp}` });
        }

        const userResp = await sendCommand(
          tlsSocket,
          Buffer.from(BREVO_SMTP_USER, 'utf8').toString('base64')
        );
        if (!userResp.startsWith('334')) {
          return finish({ success: false, message: `SMTP username rejected: ${userResp}` });
        }

        const passResp = await sendCommand(
          tlsSocket,
          Buffer.from(BREVO_SMTP_PASS, 'utf8').toString('base64')
        );
        if (!passResp.startsWith('235')) {
          return finish({ success: false, message: `SMTP authentication failed: ${passResp}` });
        }

        // 7. MAIL FROM & RCPT TO
        const mailFrom = await sendCommand(tlsSocket, `MAIL FROM:<${options.fromEmail}>`);
        if (!mailFrom.startsWith('250')) {
          return finish({ success: false, message: `MAIL FROM rejected: ${mailFrom}` });
        }

        const rcptTo = await sendCommand(tlsSocket, `RCPT TO:<${options.toEmail}>`);
        if (!rcptTo.startsWith('250')) {
          return finish({ success: false, message: `RCPT TO rejected: ${rcptTo}` });
        }

        // 8. DATA
        const dataCmd = await sendCommand(tlsSocket, 'DATA');
        if (!dataCmd.startsWith('354')) {
          return finish({ success: false, message: `DATA rejected: ${dataCmd}` });
        }

        const encodedSubject = `=?UTF-8?B?${Buffer.from(options.subject, 'utf8').toString('base64')}?=`;
        const encodedFromName = `=?UTF-8?B?${Buffer.from(options.fromName, 'utf8').toString('base64')}?=`;
        const base64Html = Buffer.from(options.html, 'utf8')
          .toString('base64')
          .replace(/(.{76})/g, '$1\r\n');

        const mimeMessage = [
          `From: ${encodedFromName} <${options.fromEmail}>`,
          `To: "${options.toName.replace(/"/g, '')}" <${options.toEmail}>`,
          `Subject: ${encodedSubject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          `Date: ${new Date().toUTCString()}`,
          ``,
          base64Html,
          `.`,
        ].join('\r\n');

        const dataDone = await sendCommand(tlsSocket, mimeMessage);
        if (!dataDone.startsWith('250')) {
          return finish({ success: false, message: `Message body rejected: ${dataDone}` });
        }

        await sendCommand(tlsSocket, 'QUIT');
        return finish({
          success: true,
          message: `Email dispatched via Brevo SMTP (${BREVO_SMTP_HOST}:${BREVO_SMTP_PORT}).`,
        });
      } catch (err: any) {
        return finish({ success: false, message: err.message || 'SMTP error' });
      }
    })();
  });
}

export async function sendOrderConfirmationEmail(
  order: Order
): Promise<{ success: boolean; message: string }> {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #EAE5DC;">
          <strong>${item.product_name}</strong><br/>
          <span style="font-size: 12px; color: #777777;">Size: ${item.variant_label || 'Standard'} | Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #EAE5DC; text-align: right; font-weight: bold;">
          ₹${(item.unit_price * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>NOTIONS® Order Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F5; margin: 0; padding: 40px 20px; color: #181818;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #EAE5DC; border-radius: 12px; overflow: hidden; padding: 36px;">
        
        <!-- Brand Header -->
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #EAE5DC;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #143728; margin: 0 0 6px 0; letter-spacing: 1px;">NOTIONS®</h1>
          <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7A756D; margin: 0;">OPULENT CLOTHING</p>
        </div>

        <!-- Greeting -->
        <div style="padding: 24px 0 16px 0;">
          <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #181818;">Order Confirmed, ${order.customer_name}</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0;">
            Thank you for selecting NOTIONS®. Your order <strong>#${order.order_number}</strong> has been received and is being prepared with exquisite care by our atelier staff.
          </p>
        </div>

        <!-- Order Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #143728; text-align: left; text-transform: uppercase; font-size: 11px; color: #143728;">
              <th style="padding-bottom: 8px;">Item</th>
              <th style="padding-bottom: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div style="padding-top: 16px; font-size: 13px; border-top: 1px solid #EAE5DC; margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #666666;">Subtotal:</span>
            <strong>₹${order.subtotal.toLocaleString('en-IN')}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #666666;">Shipping:</span>
            <strong>${order.shipping_amount === 0 ? 'Complimentary' : '₹' + order.shipping_amount}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #143728; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #EAE5DC;">
            <span>Total Paid:</span>
            <span>₹${order.total_amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <!-- Shipping Address -->
        <div style="margin-top: 24px; padding: 16px; background-color: #FAF9F5; border-radius: 8px; font-size: 12px; line-height: 1.6; color: #555555;">
          <strong style="color: #181818; display: block; margin-bottom: 4px;">Delivery Destination:</strong>
          ${order.customer_name}<br/>
          ${order.shipping_address.street}<br/>
          ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.postal_code}<br/>
          Phone: ${order.customer_phone}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #EAE5DC; font-size: 11px; color: #8C887E;">
          <p style="margin: 0 0 4px 0;">NOTIONS® Flagship Atelier • Indiranagar, Bengaluru, India</p>
          <p style="margin: 0;">For inquiries, contact <a href="mailto:${SENDER_EMAIL}" style="color: #143728; text-decoration: none;">${SENDER_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = `Order Confirmed #${order.order_number} — NOTIONS® Opulent Clothing`;

  // 1. If Brevo SMTP key (`xsmtpsib-...`) or SMTP password is provided, send via Brevo SMTP Relay (smtp-relay.brevo.com:587)
  if (BREVO_SMTP_PASS && BREVO_SMTP_PASS.startsWith('xsmtpsib-')) {
    return sendViaBrevoSmtp({
      fromName: SENDER_NAME,
      fromEmail: SENDER_EMAIL,
      toEmail: order.customer_email,
      toName: order.customer_name,
      subject,
      html: emailHtml,
    });
  }

  // 2. If Brevo v3 REST API key (`xkeysib-...`) is provided, send via REST API
  if (BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: order.customer_email, name: order.customer_name }],
          subject,
          htmlContent: emailHtml,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('Brevo API Error:', errData);
        return { success: false, message: errData.message || 'Brevo API error' };
      }

      return { success: true, message: 'Order confirmation dispatched via Brevo REST API.' };
    } catch (err: any) {
      console.error('Brevo dispatch error:', err);
      return { success: false, message: err.message };
    }
  }

  return {
    success: true,
    message: 'Brevo credentials not supplied in .env.local.',
  };
}

export async function sendOrderStatusEmail(
  order: Order
): Promise<{ success: boolean; message: string }> {
  if (!order.customer_email) {
    return { success: false, message: 'No customer email on order' };
  }

  const statusHeadline =
    order.status === 'shipped'
      ? `Your Order #${order.order_number} Has Shipped`
      : order.status === 'delivered'
      ? `Your Order #${order.order_number} Has Been Delivered`
      : `Order #${order.order_number} Status Update: ${order.status.toUpperCase()}`;

  const trackingBlock =
    order.tracking_carrier || order.tracking_number
      ? `
        <div style="margin-top: 20px; padding: 16px; background-color: #EFF7F2; border: 1px solid #C6E3D2; border-radius: 8px; font-size: 13px; color: #143728;">
          <strong>Courier Tracking Details:</strong><br/>
          Carrier: <strong>${order.tracking_carrier || 'Standard Express'}</strong><br/>
          Tracking Number: <strong>${order.tracking_number || 'Pending'}</strong>
        </div>
      `
      : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${statusHeadline}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F5; margin: 0; padding: 40px 20px; color: #181818;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #EAE5DC; border-radius: 12px; overflow: hidden; padding: 36px;">
        <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #EAE5DC;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #143728; margin: 0 0 6px 0; letter-spacing: 1px;">NOTIONS®</h1>
          <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #7A756D; margin: 0;">OPULENT CLOTHING</p>
        </div>
        <div style="padding: 24px 0 16px 0;">
          <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #181818;">${statusHeadline}</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #555555; margin: 0;">
            Hello ${order.customer_name}, your NOTIONS® order <strong>#${order.order_number}</strong> is now marked as <strong>${order.status.toUpperCase()}</strong>.
          </p>
          ${trackingBlock}
        </div>
        <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid #EAE5DC; font-size: 11px; color: #8C887E;">
          <p style="margin: 0;">NOTIONS® Opulent Clothing • <a href="mailto:${SENDER_EMAIL}" style="color: #143728;">${SENDER_EMAIL}</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (BREVO_SMTP_PASS && BREVO_SMTP_PASS.startsWith('xsmtpsib-')) {
    return sendViaBrevoSmtp({
      fromName: SENDER_NAME,
      fromEmail: SENDER_EMAIL,
      toEmail: order.customer_email,
      toName: order.customer_name,
      subject: `${statusHeadline} — NOTIONS®`,
      html,
    });
  }

  return { success: true, message: 'Status update logged.' };
}
