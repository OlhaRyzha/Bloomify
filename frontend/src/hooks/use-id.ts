import { ParamValue } from 'next/dist/server/request/params';
import { useParams } from 'next/navigation';

export const isValidNumericId = (value: ParamValue) => {
  if (!value) return false;
  const numericValue = Number(value);
  return !Number.isNaN(numericValue);
};

export function useParamId(): { id: string } {
  const { id } = useParams();
  return { id: String(id) ?? '' };
}
