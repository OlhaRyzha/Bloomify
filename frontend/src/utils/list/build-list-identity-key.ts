type IdentifiableListItem = {
  id: string | number;
};

export const buildListIdentityKey = (
  namespace: string,
  items: IdentifiableListItem[]
) => `${namespace}:${items.map((item) => item.id).join(',')}`;
