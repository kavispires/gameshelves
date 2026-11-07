import { Layout, Spin } from 'antd';

export function LoadingPage() {
  return (
    <Layout.Content
      role="status"
      aria-label="Loading data"
      className="flex h-full w-full items-center justify-center"
    >
      <Spin size="large" />
    </Layout.Content>
  );
}
