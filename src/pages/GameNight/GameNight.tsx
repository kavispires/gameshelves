import { Empty, Layout, Typography } from 'antd';
import { CalendarDays } from 'lucide-react';

export function GameNight() {
  return (
    <Layout.Content className="p-4">
      <Typography.Title level={1}>
        <span className="icon-label">
          <CalendarDays size={28} />
          Game Night
        </span>
      </Typography.Title>
      <Empty
        image={<CalendarDays size={48} />}
        description="Game night planning and game suggestions are coming soon."
      />
    </Layout.Content>
  );
}
