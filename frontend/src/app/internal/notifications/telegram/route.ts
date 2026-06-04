import { ZodError } from 'zod';

import {
  TELEGRAM_NOTIFICATIONS_TOPIC,
  hasValidQueueSignature,
  sendQueueMessage,
  telegramNotificationSchema,
} from '@/services/notifications/telegram-queue';

export const runtime = 'nodejs';

export const POST = async (request: Request): Promise<Response> => {
  const secret = process.env.NOTIFICATION_QUEUE_SECRET ?? '';
  if (!secret) {
    return Response.json(
      { detail: 'Notification queue is not configured.' },
      { status: 404 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('x-bloomify-signature');
  if (!hasValidQueueSignature(body, signature, secret)) {
    return Response.json({ detail: 'Invalid signature.' }, { status: 403 });
  }

  try {
    const payload = telegramNotificationSchema.parse(JSON.parse(body));
    const { messageId } = await sendQueueMessage(
      TELEGRAM_NOTIFICATIONS_TOPIC,
      payload,
      {
        idempotencyKey: payload.idempotencyKey,
        retentionSeconds: 86_400,
      }
    );

    return Response.json({ status: 'queued', messageId });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return Response.json(
        { detail: 'Invalid notification payload.' },
        { status: 400 }
      );
    }

    console.error('Failed to queue Telegram notification', error);
    return Response.json(
      { detail: 'Unable to queue Telegram notification.' },
      { status: 502 }
    );
  }
};
