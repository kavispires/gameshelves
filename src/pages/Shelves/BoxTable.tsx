import {
  Button,
  Card,
  Input,
  Popconfirm,
  Table,
  type TableColumnsType,
  type TableProps,
  Typography,
} from 'antd';
import { GameCover } from 'components';
import { clearIcon, saveIcon, tableIcons } from 'components/icons';
import { Package, Pencil, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BOX_SIZES, SHELVES_IDS } from 'utils/constants';
import { STORAGES, shelfName, storageForShelf } from 'utils/storage';

type BoxTableProps = {
  boxes: ShelfEntry[];
  disabled: boolean;
  onEdit: (box: ShelfEntry) => void;
  onDelete: (boxId: string) => void;
};

const contentsName = (box: ShelfEntry) => box.contains.map((game) => game.name).join(', ');
const PAGE_SIZES = [10, 25, 50, 100];
const SORT_KEYS = ['name', 'storage', 'shelf', 'size', 'items', 'contents'] as const;
type SortKey = (typeof SORT_KEYS)[number];
const isSortKey = (value: unknown): value is SortKey => SORT_KEYS.some((key) => key === value);

export function BoxTable({ boxes, disabled, onEdit, onDelete }: BoxTableProps) {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const pageSize = PAGE_SIZES.find((size) => String(size) === params.get('pageSize')) ?? 10;
  const pageValue = Number(params.get('page') ?? 1);
  const requestedPage = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const requestedSort = params.get('sort');
  const sortKey = requestedSort === 'none' ? null : isSortKey(requestedSort) ? requestedSort : 'name';
  const sortOrder: 'ascend' | 'descend' | null = sortKey
    ? params.get('order') === 'descend'
      ? 'descend'
      : 'ascend'
    : null;
  const storageFilters = params
    .getAll('storage')
    .filter((id) => STORAGES.some((storage) => storage.id === id));
  const shelfFilters = params.getAll('shelf').filter((id) => Object.hasOwn(SHELVES_IDS, id));
  const sizeFilters = params
    .getAll('size')
    .filter((size) => BOX_SIZES.some((value) => value !== 'none' && value === size));
  const query = search.trim().toLocaleLowerCase();
  const filtered = boxes.filter(
    (box) =>
      `${box.name} ${contentsName(box)}`.toLocaleLowerCase().includes(query) &&
      (!storageFilters.length || storageFilters.includes(storageForShelf(box.shelfId).id)) &&
      (!shelfFilters.length || shelfFilters.includes(box.shelfId)) &&
      (!sizeFilters.length || sizeFilters.includes(box.box)),
  );
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(filtered.length / pageSize)));

  useEffect(() => {
    if (page === requestedPage) return;
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (page === 1) next.delete('page');
        else next.set('page', String(page));
        return next;
      },
      { replace: true },
    );
  }, [page, requestedPage, setParams]);

  function updateParams(changes: Record<string, string | string[] | undefined>) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key);
          if (Array.isArray(value)) {
            for (const item of value) next.append(key, item);
          } else if (value) next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  }

  const onTableChange: NonNullable<TableProps<ShelfEntry>['onChange']> = (pagination, filters, sorter) => {
    const sorting = Array.isArray(sorter) ? sorter[0] : sorter;
    const sortedKey = sorting?.order && isSortKey(sorting.columnKey) ? sorting.columnKey : undefined;
    updateParams({
      page: pagination.current && pagination.current > 1 ? String(pagination.current) : undefined,
      pageSize: pagination.pageSize && pagination.pageSize !== 10 ? String(pagination.pageSize) : undefined,
      sort: sortedKey ?? 'none',
      order: sortedKey ? (sorting?.order ?? undefined) : undefined,
      storage: filters.storage?.map(String) ?? [],
      shelf: filters.shelf?.map(String) ?? [],
      size: filters.size?.map(String) ?? [],
    });
  };
  const columns: TableColumnsType<ShelfEntry> = [
    {
      title: 'Box',
      key: 'name',
      width: 220,
      sortOrder: sortKey === 'name' ? sortOrder : null,
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
            <Package size={24} className="text-info" />
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
      sortOrder: sortKey === 'storage' ? sortOrder : null,
      filters: STORAGES.filter((storage) =>
        boxes.some((box) => storageForShelf(box.shelfId).id === storage.id),
      ).map((storage) => ({ text: storage.name, value: storage.id })),
      filteredValue: storageFilters,
      render: (_, box) => storageForShelf(box.shelfId).name,
    },
    {
      title: 'Shelf',
      key: 'shelf',
      width: 180,
      sorter: (a, b) => shelfName(a.shelfId).localeCompare(shelfName(b.shelfId)),
      sortOrder: sortKey === 'shelf' ? sortOrder : null,
      filters: [...new Set(boxes.map((box) => box.shelfId))].map((id) => ({
        text: `${storageForShelf(id).name}: ${shelfName(id)}`,
        value: id,
      })),
      filterSearch: true,
      filteredValue: shelfFilters,
      render: (_, box) => <Link to={`/shelves/${box.shelfId}`}>{shelfName(box.shelfId)}</Link>,
    },
    {
      title: 'Size',
      key: 'size',
      dataIndex: 'box',
      width: 100,
      sorter: (a, b) => BOX_SIZES.indexOf(a.box) - BOX_SIZES.indexOf(b.box),
      sortOrder: sortKey === 'size' ? sortOrder : null,
      filters: BOX_SIZES.filter((size) => size !== 'none').map((size) => ({ text: size, value: size })),
      filteredValue: sizeFilters,
    },
    {
      title: 'Dimensions',
      key: 'dimensions',
      width: 180,
      render: (_, box) =>
        box.dimensions ? (
          <span className="whitespace-nowrap">
            {box.dimensions.width} x {box.dimensions.height} x {box.dimensions.depth} mm
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      sorter: (a, b) => a.contains.length - b.contains.length,
      sortOrder: sortKey === 'items' ? sortOrder : null,
      render: (_, box) => box.contains.length,
    },
    {
      title: 'Contents',
      key: 'contents',
      width: 220,
      sorter: (a, b) => contentsName(a).localeCompare(contentsName(b)),
      sortOrder: sortKey === 'contents' ? sortOrder : null,
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
      width: 112,
      render: (_, box) => (
        <div className="flex items-center gap-1">
          <Button
            type="text"
            icon={<Pencil />}
            style={{ minWidth: 44, minHeight: 44 }}
            disabled={disabled}
            title="Edit location"
            aria-label={`Edit location for ${box.name}`}
            onClick={() => onEdit(box)}
          />
          <Popconfirm
            icon={<TriangleAlert className="text-warning" />}
            title={`Delete ${box.name}?`}
            description="The box will be deleted. Its items will remain in the catalog, unassigned to a box."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true, disabled, icon: saveIcon }}
            cancelButtonProps={{ icon: <X /> }}
            disabled={disabled}
            onConfirm={() => onDelete(box.id)}
          >
            <Button
              type="text"
              danger
              icon={<Trash2 />}
              style={{ minWidth: 44, minHeight: 44 }}
              title="Delete box"
              aria-label={`Delete box ${box.name}`}
              disabled={disabled}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <Card styles={{ body: { padding: 0 } }}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Input
          aria-label="Search boxes"
          className="sm:!max-w-sm"
          prefix={<Search />}
          placeholder="Search boxes or contained games"
          allowClear={{ clearIcon }}
          value={search}
          onChange={(event) => {
            updateParams({ search: event.target.value || undefined, page: undefined });
          }}
        />
        <Typography.Text type="secondary">Edit a box to choose its storage and shelf.</Typography.Text>
      </div>
      <Table<ShelfEntry>
        rowKey="id"
        dataSource={filtered}
        columns={columns.map((column) => ({ ...tableIcons, ...column }))}
        size="small"
        scroll={{ x: 1232 }}
        pagination={{
          current: page,
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZES,
          showTotal: (total) => `${total} ${total === 1 ? 'box' : 'boxes'}`,
        }}
        onChange={onTableChange}
      />
    </Card>
  );
}
