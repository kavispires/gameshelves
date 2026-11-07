import { InboxOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Popconfirm, Select, Table, type TableColumnsType, Typography } from 'antd';
import { GameCover } from 'components';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BOX_SIZES, SHELVES_IDS } from 'utils/constants';

type BoxTableProps = {
  boxes: ShelfEntry[];
  disabled: boolean;
  onMove: (boxId: string, shelfId: string) => void;
};

const locationName = (id: string) => SHELVES_IDS[id]?.description ?? id;
const contentsName = (box: ShelfEntry) => box.contains.map((game) => game.name).join(', ');

export function BoxTable({ boxes, disabled, onMove }: BoxTableProps) {
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
      title: 'Shelf',
      key: 'shelf',
      width: 180,
      sorter: (a, b) => locationName(a.shelfId).localeCompare(locationName(b.shelfId)),
      filters: [...new Set(boxes.map((box) => box.shelfId))].map((id) => ({
        text: locationName(id),
        value: id,
      })),
      filterSearch: true,
      onFilter: (value, box) => box.shelfId === value,
      render: (_, box) => <Link to={`/shelves/${box.shelfId}`}>{locationName(box.shelfId)}</Link>,
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
      width: 200,
      render: (_, box) => (
        <div className="flex flex-col items-start gap-2">
          <Select
            aria-label={`Move ${box.name}`}
            className="w-full"
            value={box.shelfId}
            showSearch
            optionFilterProp="label"
            disabled={disabled}
            onChange={(shelfId) => onMove(box.id, shelfId)}
            options={Object.entries(SHELVES_IDS).map(([id, shelf]) => ({
              value: id,
              label: shelf.description,
            }))}
          />
          {box.shelfId !== 'unshelved' && (
            <Popconfirm
              title="Remove box from this shelf?"
              description="The box and its games will remain in your library, marked unshelved."
              okText="Remove"
              disabled={disabled}
              onConfirm={() => onMove(box.id, 'unshelved')}
            >
              <Button danger size="small" disabled={disabled} aria-label={`Unshelve ${box.name}`}>
                Remove from shelf
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card className="!rounded-2xl" styles={{ body: { padding: 0 } }}>
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
        <Typography.Text type="secondary">Changing a location saves immediately.</Typography.Text>
      </div>
      <Table<ShelfEntry>
        rowKey="id"
        dataSource={filtered}
        columns={columns}
        size="small"
        scroll={{ x: 1330 }}
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
