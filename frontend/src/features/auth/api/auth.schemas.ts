import z from 'zod';

export const authTokenResponseSchema = z
  .object({
    access: z.string().optional(),
    access_token: z.string().optional(),
  })
  .transform((value, ctx) => {
    const accessToken = value.access_token ?? value.access;

    if (!accessToken) {
      ctx.addIssue({
        code: 'custom',
        message: 'Missing access token in auth response',
      });

      return z.NEVER;
    }

    return { accessToken };
  });

export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;

export const currentUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
});

export type CurrentUser = z.infer<typeof currentUserSchema>;
