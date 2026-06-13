export const getTrimmedValue = (value: string) => {
  if (!value) {
    return '';
  }
  return value.trim();
};
