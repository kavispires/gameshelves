import { Empty, Layout, Typography } from 'antd';

export function Friends() {
  return (
    <Layout.Content className="p-4">
      <Typography.Title level={1}>Friends</Typography.Title>
      <Empty description="Friends and their game ratings are coming soon." />
    </Layout.Content>
  );
}
