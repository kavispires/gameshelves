import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  Input,
  Layout,
  Radio,
  Table,
  type TableColumnsType,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { GameCover } from 'components';
import { boxExpandIcon, clearIcon, GameTypeIcon, saveIcon, tableIcons } from 'components/icons';
import { useSaveLibrary } from 'hooks/useLibrary';
import { useQueryShelvedGames } from 'hooks/useQueryShelvedGames';
import {
  Box,
  Boxes,
  CircleCheck,
  CornerDownRight,
  ExternalLink,
  ImageOff,
  List,
  ListX,
  MapPin,
  Package,
  PackageOpen,
  Search,
} from 'lucide-react';
import { type ComponentPropsWithoutRef, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GAME_TYPES, URLS } from 'utils/constants';
import { createIndividualBoxes, findBox, groupGames } from 'utils/library';
import { shelfName, storageForShelf } from 'utils/storage';
import { GroupGamesModal } from './GroupGamesModal';

type GameRow = {
  id: string;
  name: string;
  boxId?: string;
  boxName?: string;
  shelfId?: string;
  itemCount?: number;
  children?: GameRow[];
} & ({ kind: 'game'; type: GameType; missingImage: boolean } | { kind: 'container' });

const rowLabels = {
  box: 'Physical box',
  unassigned: 'Unassigned',
  contained: 'Inside another box',
};
const rowIcons: Record<string, ReactNode> = {
  box: <Package />,
  unassigned: <PackageOpen />,
  contained: <Boxes />,
};
const rowState = (game: GameRow) =>
  game.boxId === game.id ? 'box' : game.boxId ? 'contained' : 'unassigned';
const matchesSearch = (game: GameRow, query: string) =>
  `${game.name} ${game.boxName ?? ''}`.toLocaleLowerCase().includes(query);
const shortBoxName = (name: string) => {
  const characters = Array.from(name);
  return characters.length > 15 ? `${characters.slice(0, 14).join('')}\u2026` : name;
};

const locationName = (game: GameRow) =>
  game.shelfId ? `${storageForShelf(game.shelfId).name} / ${shelfName(game.shelfId)}` : '';
const PAGE_SIZES = [10, 25, 50, 100];
const SORT_KEYS = ['name', 'type', 'box', 'items', 'location'] as const;

function GameTableCell({ children, ...props }: ComponentPropsWithoutRef<'td'>) {
  return (
    <td {...props}>
      {/* Ant injects tree controls outside the column renderer; align both together. */}
      {props.className?.split(' ').includes('game-name-cell') ? (
        <div className="flex items-center">{children}</div>
      ) : (
        children
      )}
    </td>
  );
}

export function FindGame() {
  const { data: library, response } = useQueryShelvedGames();
  const save = useSaveLibrary();
  const { notification } = App.useApp();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const view = params.get('view') === 'boxes' ? 'boxes' : 'games';
  const missingImages = params.get('image') === 'missing';
  const typeFilters = GAME_TYPES.filter((type) => params.getAll('type').includes(type));
  const unboxedOnly = params.get('box') === 'unboxed';
  const unshelvedOnly = params.get('shelf') === 'unshelved';
  const pageSize = PAGE_SIZES.find((size) => String(size) === params.get('pageSize')) ?? 10;
  const pageValue = Number(params.get('page') ?? 1);
  const requestedPage = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const requestedSort = params.get('sort');
  const sortKey =
    requestedSort === 'none' ? null : (SORT_KEYS.find((key) => key === requestedSort) ?? 'name');
  const sortOrder: 'ascend' | 'descend' | null = sortKey
    ? params.get('order') === 'descend'
      ? 'descend'
      : 'ascend'
    : null;
  const [grouping, setGrouping] = useState(false);
  const [error, setError] = useState('');
  const { games, boxes } = useMemo((): { games: GameRow[]; boxes: GameRow[] } => {
    if (!library) return { games: [], boxes: [] };
    const assignments = new Map<string, ShelfEntry>();
    for (const box of Object.values(response)) {
      if (box.box !== 'none') {
        for (const game of box.contains) assignments.set(game.id, box);
      }
    }
    const catalog = library.legacy
      ? [
          ...new Map(
            Object.values(response).flatMap((box) => box.contains.map((game) => [game.id, game] as const)),
          ).values(),
        ]
      : Object.values(library.games);
    const images = library.legacy?.images ?? library.games;
    const games: GameRow[] = catalog.map((game) => {
      const box = assignments.get(game.id);
      const missingImage = ![images[game.id]?.image, images[game.id]?.thumbnail].some((url) => {
        const value = url?.trim();
        return value && value !== '???' && value !== URLS.BGG_NO_IMAGE;
      });
      return {
        kind: 'game',
        id: game.id,
        name: game.name,
        type: game.type,
        missingImage,
        boxId: box?.id,
        boxName: box?.name,
        shelfId: box?.shelfId,
        itemCount: box?.id === game.id ? box.contains.length : undefined,
      };
    });
    const byId: Record<string, GameRow> = Object.fromEntries(games.map((game) => [game.id, game]));
    const boxes: GameRow[] = Object.values(response)
      .filter((box) => box.box !== 'none')
      .map((box) => {
        const main = byId[box.id];
        const children = box.contains.filter((game) => game.id !== box.id).map((game) => byId[game.id]);
        const row: GameRow = main ?? {
          kind: 'container',
          id: box.id,
          name: box.name,
          boxId: box.id,
          boxName: box.name,
          shelfId: box.shelfId,
          itemCount: box.contains.length,
        };
        return children.length ? { ...row, children } : row;
      });
    return { games, boxes };
  }, [library, response]);
  const query = search.trim().toLocaleLowerCase();
  const gameIds = new Set(games.map((game) => game.id));
  const boxIds = new Set(boxes.map((box) => box.id));
  const selected = [...new Set(params.getAll('selected').filter((id) => gameIds.has(id)))];
  const expanded = params.has('expanded')
    ? params.getAll('expanded').filter((id) => boxIds.has(id))
    : query
      ? boxes.filter((box) => box.children?.some((game) => matchesSearch(game, query))).map((box) => box.id)
      : [];
  const filtered = (view === 'games' ? games : boxes).filter(
    (game) =>
      (matchesSearch(game, query) || game.children?.some((child) => matchesSearch(child, query))) &&
      (view === 'boxes' ||
        (game.kind === 'game' &&
          (!missingImages || game.missingImage) &&
          (!typeFilters.length || typeFilters.includes(game.type)) &&
          (!unboxedOnly || !game.boxId) &&
          (!unshelvedOnly || game.shelfId === 'unshelved'))),
  );
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(filtered.length / pageSize)));
  useEffect(() => {
    if (!library || page === requestedPage) return;
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (page === 1) next.delete('page');
        else next.set('page', String(page));
        return next;
      },
      { replace: true },
    );
  }, [library, page, requestedPage, setParams]);
  if (!library) return null;

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

  const disabled = Boolean(library.legacy) || !library.revision || save.isPending || grouping;
  const allUnboxed = selected.length > 0 && selected.every((id) => !findBox(library.boxes, id));
  const actionError = error || save.error?.message;
  const columns: TableColumnsType<GameRow> = [
    {
      title: 'Game',
      key: 'name',
      width: 320,
      sortOrder: sortKey === 'name' ? sortOrder : null,
      sorter: (a, b) => a.name.localeCompare(b.name),
      onCell: () => ({ className: 'game-name-cell' }),
      render: (_, game) => (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {game.kind === 'game' ? (
            <GameCover
              id={game.id}
              name={game.name}
              width={36}
              height={48}
              rootClassName="shrink-0"
              style={{ objectFit: 'contain' }}
              preview={false}
            />
          ) : (
            <Package size={24} className="text-info" />
          )}
          {rowState(game) === 'contained' && (
            <CornerDownRight size={14} className="shrink-0" aria-hidden="true" />
          )}
          <Link
            className="min-w-0 break-words"
            to={`/${game.kind === 'game' ? 'games' : 'boxes'}/${encodeURIComponent(game.id)}`}
          >
            {game.name}
          </Link>
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      width: 120,
      filters: view === 'games' ? GAME_TYPES.map((type) => ({ text: type, value: type })) : undefined,
      filteredValue: view === 'games' ? typeFilters : [],
      sortOrder: sortKey === 'type' ? sortOrder : null,
      sorter: (a, b) => (a.kind === 'game' ? a.type : '').localeCompare(b.kind === 'game' ? b.type : ''),
      render: (_, game) =>
        game.kind === 'game' ? <Tag icon={<GameTypeIcon type={game.type} />}>{game.type}</Tag> : '-',
    },
    {
      title: 'Box',
      key: 'box',
      width: 180,
      filters: view === 'games' ? [{ text: 'Unboxed', value: 'unboxed' }] : undefined,
      filterMultiple: false,
      filteredValue: view === 'games' && unboxedOnly ? ['unboxed'] : [],
      sortOrder: sortKey === 'box' ? sortOrder : null,
      sorter: (a, b) => (a.boxName ?? '').localeCompare(b.boxName ?? ''),
      render: (_, game) =>
        game.boxId && game.boxName ? (
          <Tooltip title={game.boxName} trigger={['hover', 'focus']}>
            <Link to={`/boxes/${encodeURIComponent(game.boxId)}`} aria-label={`Box: ${game.boxName}`}>
              {shortBoxName(game.boxName)}
            </Link>
          </Tooltip>
        ) : (
          <Typography.Text type="secondary">Unassigned</Typography.Text>
        ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      sortOrder: sortKey === 'items' ? sortOrder : null,
      sorter: (a, b) => (a.itemCount ?? 0) - (b.itemCount ?? 0),
      render: (_, game) => game.itemCount ?? '-',
    },
    {
      title: 'Shelf location',
      key: 'location',
      width: 300,
      filters: view === 'games' ? [{ text: 'Unshelved', value: 'unshelved' }] : undefined,
      filterMultiple: false,
      filteredValue: view === 'games' && unshelvedOnly ? ['unshelved'] : [],
      sortOrder: sortKey === 'location' ? sortOrder : null,
      sorter: (a, b) => locationName(a).localeCompare(locationName(b)),
      render: (_, game) => {
        if (!game.shelfId) return <Typography.Text type="secondary">Unassigned</Typography.Text>;
        const storage = storageForShelf(game.shelfId);
        return (
          <Breadcrumb
            items={[
              {
                title: (
                  <Link to={`/shelves?view=table&storage=${storage.id}`}>
                    <span className="icon-label">
                      <Box size={14} />
                      {storage.name}
                    </span>
                  </Link>
                ),
              },
              {
                title: (
                  <Link to={`/shelves/${game.shelfId}`}>
                    <span className="icon-label">
                      <MapPin size={14} />
                      {shelfName(game.shelfId)}
                    </span>
                  </Link>
                ),
              },
            ]}
          />
        );
      },
    },
    {
      title: 'BGG',
      key: 'bgg',
      width: 72,
      render: (_, game) =>
        game.kind === 'game' ? (
          <Button
            type="link"
            href={`https://boardgamegeek.com/boardgame/${encodeURIComponent(game.id)}`}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLink />}
            style={{ minWidth: 44, minHeight: 44 }}
            title="View on BoardGameGeek"
            aria-label={`View ${game.name} on BoardGameGeek`}
          />
        ) : (
          '-'
        ),
    },
  ];

  function group(leaderId: string) {
    try {
      if (!library) throw new Error('The library is not loaded.');
      const next = groupGames(library, selected, leaderId);
      setError('');
      save.mutate(
        { base: library, next },
        {
          onSuccess: () => {
            setGrouping(false);
            updateParams({ selected: undefined });
            notification.success({
              title: 'Games grouped in box',
              icon: <CircleCheck className="text-success" />,
            });
          },
        },
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to group games.');
    }
  }

  function createBoxes() {
    try {
      if (!library) throw new Error('The library is not loaded.');
      const next = createIndividualBoxes(library, selected);
      setError('');
      save.mutate(
        { base: library, next },
        {
          onSuccess: () => {
            updateParams({ selected: undefined });
            notification.success({
              title: 'Individual boxes created',
              icon: <CircleCheck className="text-success" />,
            });
          },
        },
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create individual boxes.');
    }
  }

  return (
    <Layout.Content className="box-border mx-auto w-full min-w-0 max-w-[1600px] p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Typography.Title level={1} className="!mb-0">
          <span className="icon-label">
            <Search size={28} /> Find Game
          </span>
        </Typography.Title>
        <Radio.Group
          aria-label="Game list view"
          optionType="button"
          value={view}
          onChange={(event) => {
            updateParams({ view: event.target.value === 'boxes' ? 'boxes' : undefined, page: undefined });
          }}
          options={[
            {
              label: (
                <span className="icon-label">
                  <List />
                  All games
                </span>
              ),
              value: 'games',
            },
            {
              label: (
                <span className="icon-label">
                  <Boxes />
                  Boxes
                </span>
              ),
              value: 'boxes',
            },
          ]}
        />
      </div>
      {library.legacy && (
        <Alert
          showIcon
          type="info"
          className="mb-4"
          title="Import and migrate your library in Settings to organize games."
        />
      )}
      <Card styles={{ body: { padding: 0 } }}>
        <div className="flex flex-wrap items-center gap-3 p-4">
          <Input
            aria-label="Search games"
            className="sm:!max-w-sm"
            prefix={<Search />}
            placeholder="Search games or boxes"
            value={search}
            allowClear={{ clearIcon }}
            onChange={(event) => {
              updateParams({ search: event.target.value || undefined, page: undefined, expanded: undefined });
            }}
          />
          {view === 'games' && (
            <Checkbox
              checked={missingImages}
              onChange={(event) =>
                updateParams({ image: event.target.checked ? 'missing' : undefined, page: undefined })
              }
            >
              <span className="icon-label">
                <ImageOff />
                Missing images only
              </span>
            </Checkbox>
          )}
          <Typography.Text aria-live="polite">{selected.length} selected</Typography.Text>
          <Button
            icon={<Boxes />}
            type="primary"
            disabled={disabled || selected.length < 2}
            onClick={() => {
              setError('');
              save.reset();
              setGrouping(true);
            }}
          >
            Group in a box
          </Button>
          <Button
            icon={saveIcon}
            disabled={disabled || !allUnboxed}
            loading={save.isPending && !grouping}
            onClick={createBoxes}
          >
            Create individual boxes
          </Button>
          <Button
            icon={<ListX />}
            disabled={disabled || !selected.length}
            onClick={() => updateParams({ selected: undefined })}
          >
            Clear selection
          </Button>
        </div>
        {!grouping && actionError && (
          <Alert showIcon type="error" className="mx-4 mb-4" title={actionError} />
        )}
        <ul aria-label="Row colors" className="game-row-legend flex flex-wrap gap-2">
          {Object.entries(rowLabels).map(([state, label]) => (
            <li key={state} className={`game-row-key game-row-${state} rounded px-2 py-1 text-xs`}>
              <span className="icon-label">
                {rowIcons[state]}
                {label}
              </span>
            </li>
          ))}
        </ul>
        <Table<GameRow>
          className="find-game-table"
          rowKey="id"
          dataSource={filtered}
          columns={columns.map((column) => ({ ...tableIcons, ...column }))}
          size="small"
          scroll={{ x: 1140 }}
          rowClassName={(game) => `game-row game-row-${rowState(game)}`}
          onRow={(game) => ({ 'aria-label': `${game.name}: ${rowLabels[rowState(game)]}` })}
          expandable={{
            expandedRowKeys: expanded,
            onExpandedRowsChange: (keys) => updateParams({ expanded: keys.length ? keys.map(String) : [''] }),
          }}
          components={{ ExpandIcon: boxExpandIcon, body: { cell: GameTableCell } }}
          rowSelection={{
            selectedRowKeys: selected,
            preserveSelectedRowKeys: true,
            checkStrictly: true,
            onChange: (keys) => updateParams({ selected: keys.map(String) }),
            getCheckboxProps: (game) => ({
              disabled: disabled || game.kind === 'container',
              'aria-label': `Select ${game.name}`,
            }),
          }}
          pagination={{
            current: page,
            pageSize,
            pageSizeOptions: PAGE_SIZES,
            showSizeChanger: true,
            showTotal: (total) =>
              `${total} ${view === 'boxes' ? (total === 1 ? 'box' : 'boxes') : total === 1 ? 'game' : 'games'}`,
          }}
          onChange={(pagination, filters, sorter, extra) => {
            const sorting = Array.isArray(sorter) ? sorter[0] : sorter;
            const key = sorting?.order ? SORT_KEYS.find((key) => key === sorting.columnKey) : undefined;
            updateParams({
              page:
                extra.action !== 'filter' && pagination.current && pagination.current > 1
                  ? String(pagination.current)
                  : undefined,
              pageSize:
                pagination.pageSize && pagination.pageSize !== 10 ? String(pagination.pageSize) : undefined,
              sort: key ?? 'none',
              order: key ? (sorting?.order ?? undefined) : undefined,
              ...(view === 'games'
                ? {
                    type: filters.type?.map(String) ?? [],
                    box: filters.box?.includes('unboxed') ? 'unboxed' : undefined,
                    shelf: filters.location?.includes('unshelved') ? 'unshelved' : undefined,
                  }
                : {}),
            });
          }}
        />
      </Card>
      {grouping && (
        <GroupGamesModal
          library={library}
          selected={selected}
          saving={save.isPending}
          error={actionError}
          onSave={group}
          onCancel={() => {
            setGrouping(false);
            setError('');
            save.reset();
          }}
        />
      )}
    </Layout.Content>
  );
}
