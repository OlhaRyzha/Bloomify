'use client';

import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from '@/hooks/use-translation';

type TransProps = {
  i18nKey: string;
  values?: Record<string, string | number>;
  components?: ReactElement[];
};

export default function Trans({ i18nKey, values, components = [] }: TransProps) {
  const { t } = useTranslation();
  const raw = t(i18nKey, values);

  const nodes: ReactNode[] = [raw];

  components.forEach((component, index) => {
    const openTag = `<${index + 1}>`;
    const closeTag = `</${index + 1}>`;

    for (let i = 0; i < nodes.length; i++) {
      const part = nodes[i];
      if (typeof part !== 'string') continue;

      const start = part.indexOf(openTag);
      const end = part.indexOf(closeTag);
      if (start === -1 || end === -1 || end < start) continue;

      const before = part.slice(0, start);
      const inside = part.slice(start + openTag.length, end);
      const after = part.slice(end + closeTag.length);

      nodes.splice(
        i,
        1,
        before,
        cloneElement(component, { key: `${i18nKey}-${index}-${i}` }, inside),
        after
      );
      break;
    }
  });

  return <>{nodes}</>;
}
