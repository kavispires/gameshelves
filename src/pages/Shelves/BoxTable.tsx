import { InboxOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Table, type TableColumnsType, Typography } from 'antd';
import { GameCover } from 'components';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BOX_SIZES } from 'utils/constants';
import { STORAGES, shelfName, storageForShelf } from 'utils/storage';

type BoxTableProps = {
  boxes: ShelfEntry[];
  disabled: boolean;
  onEdit: (box: ShelfEntry) => void;
};

const contentsName = (box: ShelfEntry) => box.contains.map((game) => game.name).join(', ');

export function BoxTable({ boxes, disabled, onEdit }: BoxTableProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const query = search.trim().toLocaleLowerCase();
  const filtered = boxes.filter((box) =>
    `${box.name} ${contentsName(box)}`.toLocaleLowerCase().includes(query),
  );
  const dimensions: TableColumnsType<ShelfEntry> = (['width', 'height', 'depth'] as const).map(
    (dimension) => ({
      title: `${dimension[0].toUpperCase()}${dimension.slice(1)} (mm)`,
      key: dimension,
      dataIndex: ['dimensions', dimension],
      width: 110,
      sorter: (a, b) => (a.dimensions?.[dimension] ?? -1) - (b.dimensions?.[dimension] ?? -1),
      render: (value: number | undefined) => value ?? '-',
    }),
  );
  const columns: TableColumnsType<ShelfEntry> = [
    {
      title: 'Box',
      key: 'name',
      width: 220,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, box) => (
        <div className="flex items-center gap-3">
          {box.contains.some((game) => game.id === box.id) ? (
            <GameCover
              id={box.id}
              name={box.name}
              width={36}
              height={48}
              style={{ objectFit: 'contain' }}
              preview={false}
            />
          ) : (
            <InboxOutlined className="text-2xl text-info" aria-hidden="true" />
          )}
          <Link to={`/boxes/${encodeURIComponent(box.id)}`}>{box.name}</Link>
        </div>
      ),
    },
    {
      title: 'Storage',
      key: 'storage',
      width: 140,
      sorter: (a, b) => storageForShelf(a.shelfId).name.localeCompare(storageForShelf(b.shelfId).name),
      filters: STORAGES.filter((storage) =>
        boxes.some((box) => storageForShelf(box.shelfId).id === storage.id),
      ).map((storage) => ({ text: storage.name, value: storage.id })),
      onFilter: (value, box) => storageForShelf(box.shelfId).id === value,
      render: (_, box) => storageForShelf(box.shelfId).name,
    },
    {
      title: 'Shelf',
      key: 'shelf',
      width: 180,
      sorter: (a, b) => shelfName(a.shelfId).localeCompare(shelfName(b.shelfId)),
      filters: [...new Set(boxes.map((box) => box.shelfId))].map((id) => ({
        text: `${storageForShelf(id).name}: ${shelfName(id)}`,
        value: id,
      })),
      filterSearch: true,
      onFilter: (value, box) => box.shelfId === value,
      render: (_, box) => <Link to={`/shelves/${box.shelfId}`}>{shelfName(box.shelfId)}</Link>,
    },
    {
      title: 'Size',
      key: 'size',
      dataIndex: 'box',
      width: 100,
      sorter: (a, b) => BOX_SIZES.indexOf(a.box) - BOX_SIZES.indexOf(b.box),
      filters: BOX_SIZES.filter((size) => size !== 'none').map((size) => ({ text: size, value: size })),
      onFilter: (value, box) => box.box === value,
    },
    ...dimensions,
    {
      title: 'Games',
      key: 'count',
      width: 80,
      sorter: (a, b) => a.contains.length - b.contains.length,
      render: (_, box) => box.contains.length,
    },
    {
      title: 'Contents',
      key: 'contents',
      width: 220,
      sorter: (a, b) => contentsName(a).localeCompare(contentsName(b)),
      render: (_, box) => (
        <ul className="space-y-1">
          {box.contains.map((game) => (
            <li key={game.id}>
              <Link to={`/games/${encodeURIComponent(game.id)}`}>{game.name}</Link>
            </li>
          ))}
          {!box.contains.length && <li className="text-muted">Empty box</li>}
        </ul>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, box) => (
        <Button
          size="small"
          disabled={disabled}
          aria-label={`Edit location for ${box.name}`}
          onClick={() => onEdit(box)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <Card styles={{ body: { padding: 0 } }}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Input
          aria-label="Search boxes"
          className="sm:!max-w-sm"
          prefix={<SearchOutlined aria-hidden="true" />}
          placeholder="Search boxes or contained games"
          allowClear
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Typography.Text type="secondary">Edit a box to choose its storage and shelf.</Typography.Text>
      </div>
      <Table<ShelfEntry>
        rowKey="id"
        dataSource={filtered}
        columns={columns}
        size="small"
        scroll={{ x: 1350 }}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
          showTotal: (total) => `${total} ${total === 1 ? 'box' : 'boxes'}`,
        }}
        onChange={(pagination) => {
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? 10);
        }}
      />
    </Card>
  );
}
