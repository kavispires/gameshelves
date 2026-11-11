import { Empty, Layout, Typography } from 'antd';
import { Users } from 'lucide-react';

export function Friends() {
  return (
    <Layout.Content className="p-4">
      <Typography.Title level={1}>
        <span className="icon-label">
          <Users size={28} />
          Friends
        </span>
      </Typography.Title>
      <Empty image={<Users size={48} />} description="Friends and their game ratings are coming soon." />
    </Layout.Content>
  );
}
