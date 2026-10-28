import { Order } from '@/types/database';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'concierge@notionsclothing.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'NOTIONS® Opulent Clothing';

export async function sendOrderConfirmationEmail(order: Order): Promise<{ success: boolean; message: string }> {
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
          <p style="margin: 0;">For inquiries, contact <a href="mailto:${SENDER_EMAIL}" style="color: #143728; text-decoration: none;">concierge@notionsclothing.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!BREVO_API_KEY) {
    console.log('[Brevo Email Simulation/Pending Configuration] Order email prepared for:', order.customer_email);
    return {
      success: true,
      message: 'Brevo API key not yet supplied in .env.local. Email logged successfully.',
    };
  }

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
        subject: `Order Confirmed #${order.order_number} — NOTIONS® Opulent Clothing`,
        htmlContent: emailHtml,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error('Brevo API Error:', errData);
      return { success: false, message: errData.message || 'Brevo API error' };
    }

    return { success: true, message: 'Order confirmation dispatched via Brevo.' };
  } catch (err: any) {
    console.error('Brevo dispatch error:', err);
    return { success: false, message: err.message };
  }
}
