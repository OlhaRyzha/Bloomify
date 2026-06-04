import {
  handleQueueCallback,
  sendTelegramNotification,
  telegramNotificationSchema,
} from '@/services/notifications/telegram-queue';

export const runtime = 'nodejs';

export const POST = handleQueueCallback(
  async (message: unknown) => {
    const payload = telegramNotificationSchema.parse(message);
    await sendTelegramNotification(payload);
  },
  {
    visibilityTimeoutSeconds: 120,
    retry: (_error, metadata) => {
      if (metadata.deliveryCount > 5) return { acknowledge: true };

      return {
        afterSeconds: Math.min(300, 2 ** metadata.deliveryCount * 5),
      };
    },
  }
);
