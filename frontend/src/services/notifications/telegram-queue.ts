import { createHmac, timingSafeEqual } from 'crypto';

import { QueueClient } from '@vercel/queue';
import { z } from 'zod';

export const TELEGRAM_NOTIFICATIONS_TOPIC = 'telegram-notifications';
const QUEUE_REGION = process.env.VERCEL_REGION ?? 'iad1';
const queueClient = new QueueClient({ region: QUEUE_REGION });

export const sendQueueMessage = queueClient.send;
export const handleQueueCallback = queueClient.handleCallback;

export const telegramNotificationSchema = z.object({
  eventType: z.enum([
    'order.paid',
    'order.cash_on_delivery',
    'sentry.alert',
  ]),
  idempotencyKey: z.string().min(1).max(180),
  text: z.string().min(1).max(4096),
});

export type TelegramNotificationPayload = z.infer<
  typeof telegramNotificationSchema
>;

export const buildQueueSignature = (body: string, secret: string): string => {
  const digest = createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${digest}`;
};

export const hasValidQueueSignature = (
  body: string,
  signature: string | null,
  secret: string
): boolean => {
  if (!signature || !signature.startsWith('sha256=')) return false;

  const expected = buildQueueSignature(body, secret);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

export const getTelegramEnv = () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID ?? '',
});

export const sendTelegramNotification = async (
  payload: TelegramNotificationPayload
): Promise<void> => {
  const { botToken, adminChatId } = getTelegramEnv();

  if (!botToken || !adminChatId) {
    throw new Error('Telegram notification environment is not configured.');
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: payload.text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Telegram API failed with HTTP ${response.status}.`);
  }
};
