import { Layout, Spin } from 'antd';

export function LoadingPage() {
  return (
    <Layout.Content className="fully-flex-center">
      <Spin size="large" />
    </Layout.Content>
  );
}
