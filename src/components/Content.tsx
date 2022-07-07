import { Layout } from 'antd';
import clsx from 'clsx';
import { ReactNode } from 'react';

type ContentProps = {
  children: ReactNode;
  centered?: boolean;
};

export function Content({ children, centered = false }: ContentProps) {
  return (
    <Layout.Content className={clsx('content', centered && 'fully-flex-center')}>{children}</Layout.Content>
  );
}
