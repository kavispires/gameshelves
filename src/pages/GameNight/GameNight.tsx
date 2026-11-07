import { Empty, Layout, Typography } from 'antd';

export function GameNight() {
  return (
    <Layout.Content className="p-4">
      <Typography.Title level={1}>Game Night</Typography.Title>
      <Empty description="Game night planning and game suggestions are coming soon." />
    </Layout.Content>
  );
}
