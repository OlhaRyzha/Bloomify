import { after } from 'next/server';
import { ZodError } from 'zod';

import {
  hasValidQueueSignature,
  sendTelegramNotification,
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
    after(async () => {
      try {
        await sendTelegramNotification(payload);
      } catch (error) {
        console.error('Failed to send Telegram notification', error);
      }
    });

    return Response.json({ status: 'accepted' });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return Response.json(
        { detail: 'Invalid notification payload.' },
        { status: 400 }
      );
    }

    console.error('Failed to accept Telegram notification', error);
    return Response.json(
      { detail: 'Unable to accept Telegram notification.' },
      { status: 502 }
    );
  }
};
