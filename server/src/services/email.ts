import { sendEmail } from "./resend";
import { env } from "../config/env";

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function buildEmailShell(params: { title: string; heading: string; bodyHtml: string; footerHtml?: string }) {
  const { title, heading, bodyHtml, footerHtml } = params;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">${escapeHtml(heading)}</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        ${bodyHtml}
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        ${footerHtml || `<p style="font-size: 12px; color: #999; text-align: center;">Thank you for using LamatFikr!</p>`}
      </div>
    </body>
    </html>
  `;
}

export async function sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LamatFikr!</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Thank you for signing up! Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #667eea; word-break: break-all;">${verificationUrl}</p>
        <p style="font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Verify your email address - LamatFikr",
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">We received a request to reset your password. Click the button below to create a new password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #667eea; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Reset your password - LamatFikr",
    html,
  });
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to LamatFikr</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to LamatFikr!</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${firstName},</p>
        <p style="font-size: 16px;">Your email has been verified and your account is now active!</p>
        <p style="font-size: 16px;">You can now:</p>
        <ul style="font-size: 16px;">
          <li>Complete your profile</li>
          <li>Connect with friends</li>
          <li>Share your thoughts</li>
          <li>Explore the community</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.FRONTEND_URL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Get Started</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">Thank you for joining LamatFikr!</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to LamatFikr!",
    html,
  });
}

export async function sendMarketplaceOrderPaidBuyerEmail(params: {
  to: string;
  buyerFirstName: string;
  orderNumber: string;
  total: number;
  currency: string;
  orderUrl: string;
  items: Array<{ title: string; quantity: number; price: number }>;
}): Promise<void> {
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${escapeHtml(i.title)} <span style="color:#666;">× ${i.quantity}</span></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align:right; white-space:nowrap;">${escapeHtml(money(i.price * i.quantity, params.currency))}</td>
        </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="font-size: 16px;">Hi ${escapeHtml(params.buyerFirstName)},</p>
    <p style="font-size: 16px;">Your payment was successful. We’ve received your order.</p>
    <div style="background:#fafafa; border:1px solid #eee; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="margin:0; font-size:14px; color:#666;">Order</p>
      <p style="margin:0; font-size:18px; font-weight:700;">${escapeHtml(params.orderNumber)}</p>
    </div>
    <table style="width:100%; border-collapse: collapse;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 0; font-weight:700;">Total</td>
        <td style="padding: 12px 0; font-weight:700; text-align:right; white-space:nowrap;">${escapeHtml(money(params.total, params.currency))}</td>
      </tr>
    </table>
    <div style="text-align:center; margin: 28px 0 8px;">
      <a href="${params.orderUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Order</a>
    </div>
    <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">${params.orderUrl}</p>
  `;

  const html = buildEmailShell({
    title: "Order Confirmed",
    heading: "Order Confirmed",
    bodyHtml,
  });

  await sendEmail({
    to: params.to,
    subject: `Order confirmed (${params.orderNumber}) - LamatFikr`,
    html,
  });
}

export async function sendMarketplaceOrderPaidSellerEmail(params: {
  to: string;
  sellerFirstName: string;
  orderNumber: string;
  total: number;
  currency: string;
  orderUrl: string;
  items: Array<{ title: string; quantity: number; price: number }>;
}): Promise<void> {
  const itemsHtml = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">${escapeHtml(i.title)} <span style="color:#666;">× ${i.quantity}</span></td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align:right; white-space:nowrap;">${escapeHtml(money(i.price * i.quantity, params.currency))}</td>
        </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="font-size: 16px;">Hi ${escapeHtml(params.sellerFirstName)},</p>
    <p style="font-size: 16px;">Good news — an order has been paid and is ready for processing.</p>
    <div style="background:#fafafa; border:1px solid #eee; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="margin:0; font-size:14px; color:#666;">Order</p>
      <p style="margin:0; font-size:18px; font-weight:700;">${escapeHtml(params.orderNumber)}</p>
    </div>
    <table style="width:100%; border-collapse: collapse;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 0; font-weight:700;">Total</td>
        <td style="padding: 12px 0; font-weight:700; text-align:right; white-space:nowrap;">${escapeHtml(money(params.total, params.currency))}</td>
      </tr>
    </table>
    <div style="text-align:center; margin: 28px 0 8px;">
      <a href="${params.orderUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Order</a>
    </div>
    <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">${params.orderUrl}</p>
  `;

  const html = buildEmailShell({
    title: "New Paid Order",
    heading: "New Paid Order",
    bodyHtml,
  });

  await sendEmail({
    to: params.to,
    subject: `New paid order (${params.orderNumber}) - LamatFikr`,
    html,
  });
}

export async function sendRoomPaymentCapturedPayerEmail(params: {
  to: string;
  payerFirstName: string;
  roomName: string;
  amount: number;
  currency: string;
  roomUrl: string;
}): Promise<void> {
  const bodyHtml = `
    <p style="font-size: 16px;">Hi ${escapeHtml(params.payerFirstName)},</p>
    <p style="font-size: 16px;">Your payment was successful and your membership is now active.</p>
    <div style="background:#fafafa; border:1px solid #eee; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="margin:0; font-size:14px; color:#666;">Room</p>
      <p style="margin:0; font-size:18px; font-weight:700;">${escapeHtml(params.roomName)}</p>
      <p style="margin:10px 0 0; font-size:14px; color:#666;">Amount</p>
      <p style="margin:0; font-size:18px; font-weight:700;">${escapeHtml(money(params.amount, params.currency))}</p>
    </div>
    <div style="text-align:center; margin: 28px 0 8px;">
      <a href="${params.roomUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Open Room</a>
    </div>
    <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">${params.roomUrl}</p>
  `;

  const html = buildEmailShell({
    title: "Payment Successful",
    heading: "Payment Successful",
    bodyHtml,
  });

  await sendEmail({
    to: params.to,
    subject: `Room membership activated - LamatFikr`,
    html,
  });
}

export async function sendRoomPaymentCapturedOwnerEmail(params: {
  to: string;
  ownerFirstName: string;
  roomName: string;
  amount: number;
  currency: string;
  roomUrl: string;
}): Promise<void> {
  const bodyHtml = `
    <p style="font-size: 16px;">Hi ${escapeHtml(params.ownerFirstName)},</p>
    <p style="font-size: 16px;">A new paid membership has been confirmed for your room.</p>
    <div style="background:#fafafa; border:1px solid #eee; border-radius:8px; padding:16px; margin:16px 0;">
      <p style="margin:0; font-size:14px; color:#666;">Room</p>
      <p style="margin:0; font-size:18px; font-weight:700;">${escapeHtml(params.roomName)}</p>
      <p style="margin:10px 0 0; font-size:14px; color:#666;">Amount</p>
      <p style="margin:0; font-size:18px; font-weight:700;">${escapeHtml(money(params.amount, params.currency))}</p>
    </div>
    <div style="text-align:center; margin: 28px 0 8px;">
      <a href="${params.roomUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Open Room</a>
    </div>
    <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">${params.roomUrl}</p>
  `;

  const html = buildEmailShell({
    title: "New Paid Member",
    heading: "New Paid Member",
    bodyHtml,
  });

  await sendEmail({
    to: params.to,
    subject: `New paid member in ${params.roomName} - LamatFikr`,
    html,
  });
}
