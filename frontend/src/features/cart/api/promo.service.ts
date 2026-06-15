import { API_ROUTES } from '@/constants/api.constant';
import apiClient from '@/services/api/clients/api-client';
import { z } from 'zod';
import { parseResponseWithSchema } from '@/services/api/request/safe-fetch';

const promoValidateResponseSchema = z.object({
  code: z.string(),
  discountType: z.string(),
  discountValue: z.string(),
  discount: z.string(),
});

export type PromoValidateResponse = z.infer<typeof promoValidateResponseSchema>;

const PromoService = {
  validate: async (
    code: string,
    subtotal: number
  ): Promise<PromoValidateResponse> => {
    const response = await apiClient.post<
      unknown,
      { code: string; subtotal: number }
    >(API_ROUTES.PROMO_VALIDATE, { code, subtotal });

    return parseResponseWithSchema(
      response,
      promoValidateResponseSchema
    ) as PromoValidateResponse;
  },
};

export default PromoService;
