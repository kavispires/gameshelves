import { Button, Input, Space } from 'antd';
import { CardItem } from './CardItem';

type ShelfActionProps = {
  shelfId: ShelfId;
  isShelved: boolean;
  isBoxed: boolean;
};

export function ShelfAction({ shelfId, isShelved, isBoxed }: ShelfActionProps) {
  return (
    <CardItem label="Shelf">
      <Space>
        <Input disabled value={shelfId} size="small" style={{ width: 120 }} />{' '}
        <Button size="small" disabled={!isBoxed} type={isShelved ? 'default' : 'primary'}>
          {isShelved ? 'Change shelf' : 'Add to shelf'}
        </Button>
      </Space>
    </CardItem>
  );
}
