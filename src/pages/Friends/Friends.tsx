import {
  App,
  Button,
  Card,
  Empty,
  Input,
  Layout,
  Result,
  Table,
  type TableColumnsType,
  Tooltip,
  Typography,
} from 'antd';
import { FriendAvatar } from 'components/FriendAvatar';
import { clearIcon, tableIcons } from 'components/icons';
import { LoadingPage } from 'components/LoadingPage';
import { useFriends, useSaveFriend } from 'hooks/useFriends';
import { Pencil, RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { emptyInterests, INTEREST_FIELDS, ratedCount, usedAvatarIds } from 'utils/friends';
import type { Friend } from '../../types/friends';
import { FriendModal } from './FriendModal';

const PAGE_SIZES = [10, 25, 50, 100];

export function Friends() {
  const query = useFriends();
  const save = useSaveFriend();
  const { notification } = App.useApp();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState<{ friend: Friend; creating: boolean } | null>(null);
  const search = params.get('search') ?? '';
  const pageSize = PAGE_SIZES.find((size) => String(size) === params.get('pageSize')) ?? 10;
  const requested = Number(params.get('page') ?? 1);
  const requestedPage = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const filtered = Object.values(query.data?.friends ?? {}).filter((friend) =>
    friend.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const sort = params.get('sort') === 'rated' ? 'rated' : params.get('sort') === 'none' ? null : 'name';
  const order = sort ? (params.get('order') === 'descend' ? 'descend' : 'ascend') : null;

  function updateParams(changes: Record<string, string | undefined>) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key);
          if (value) next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    if (query.data && page !== requestedPage) {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (page === 1) next.delete('page');
          else next.set('page', String(page));
          return next;
        },
        { replace: true },
      );
    }
  }, [query.data, page, requestedPage, setParams]);

  if (query.isPending) return <LoadingPage />;
  if (query.isError)
    return (
      <Result
        status="error"
        title="Unable to load friends"
        subTitle={query.error.message}
        extra={
          <Button icon={<RefreshCw />} onClick={() => void query.refetch()}>
            Retry
          </Button>
        }
      />
    );

  function open(friend?: Friend) {
    save.reset();
    setDraft({
      creating: !friend,
      friend: friend ?? { id: crypto.randomUUID(), name: '', avatarId: '', interests: emptyInterests() },
    });
  }

  const columns: TableColumnsType<Friend> = [
    {
      title: 'Avatar',
      key: 'avatar',
      width: 76,
      render: (_, friend) => <FriendAvatar avatarId={friend.avatarId} />,
    },
    {
      title: 'Name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortOrder: sort === 'name' ? order : null,
      render: (_, friend) => <span className="break-words">{friend.name}</span>,
    },
    {
      title: 'Rated preferences',
      key: 'rated',
      sorter: (a, b) => ratedCount(a) - ratedCount(b),
      sortOrder: sort === 'rated' ? order : null,
      render: (_, friend) => `${ratedCount(friend)} / ${INTEREST_FIELDS.length}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 84,
      render: (_, friend) => (
        <Tooltip title={`Edit ${friend.name}`}>
          <Button
            icon={<Pencil />}
            aria-label={`Edit ${friend.name}`}
            disabled={save.isPending}
            onClick={() => open(friend)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <Layout.Content className="box-border mx-auto w-full min-w-0 max-w-5xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={1} className="!mb-0">
          <span className="icon-label">
            <Users size={28} />
            Friends
          </span>
        </Typography.Title>
        <div className="flex flex-wrap gap-2">
          <Button
            icon={<RefreshCw />}
            disabled={!!draft || save.isPending}
            loading={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Reload friends
          </Button>
          <Button type="primary" icon={<UserPlus />} onClick={() => open()}>
            Add friend
          </Button>
        </div>
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <div className="p-4">
          <Input
            aria-label="Search friends"
            placeholder="Search friends"
            prefix={<Search />}
            allowClear={{ clearIcon }}
            className="sm:!max-w-sm"
            value={search}
            onChange={(event) => updateParams({ search: event.target.value || undefined, page: undefined })}
          />
        </div>
        <Table<Friend>
          rowKey="id"
          dataSource={filtered}
          columns={columns.map((column) => ({ ...tableIcons, ...column }))}
          scroll={{ x: 520 }}
          locale={{
            emptyText: (
              <Empty
                image={<Users size={48} />}
                description={search ? 'No matching friends.' : 'No friends yet. Add your first friend.'}
              />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            pageSizeOptions: PAGE_SIZES,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${total === 1 ? 'friend' : 'friends'}`,
          }}
          onChange={(pagination, _, sorter) => {
            const sorting = Array.isArray(sorter) ? sorter[0] : sorter;
            const key =
              sorting.order && (sorting.columnKey === 'name' || sorting.columnKey === 'rated')
                ? sorting.columnKey
                : undefined;
            updateParams({
              page: pagination.current && pagination.current > 1 ? String(pagination.current) : undefined,
              pageSize: pagination.pageSize !== 10 ? String(pagination.pageSize) : undefined,
              sort: key ?? 'none',
              order: key ? (sorting.order ?? undefined) : undefined,
            });
          }}
        />
      </Card>
      {draft && (
        <FriendModal
          friend={draft.friend}
          unavailableAvatarIds={usedAvatarIds(query.data.friends, draft.friend.id)}
          creating={draft.creating}
          saving={save.isPending}
          error={save.error?.message}
          onCancel={() => {
            setDraft(null);
            save.reset();
          }}
          onSave={(friend) => {
            if (save.isPending) return;
            save.mutate(
              { base: query.data, friend },
              {
                onSuccess: () => {
                  setDraft(null);
                  notification.success({ title: draft.creating ? 'Friend added' : 'Friend updated' });
                },
              },
            );
          }}
        />
      )}
    </Layout.Content>
  );
}
