import { Layout } from 'antd';
import clsx from 'clsx';
import type { ReactNode } from 'react';

type ContentProps = {
  children: ReactNode;
  centered?: boolean;
};

export function Content({ children, centered = false }: ContentProps) {
  return (
    <Layout.Content className={clsx('p-4', centered && 'flex h-full w-full items-center justify-center')}>
      {children}
    </Layout.Content>
  );
}
