import { App, Layout, Modal, Select, Table, Typography } from 'antd';
import { GameCover, ShelvesSVG } from 'components';
import { LoadingPage } from 'components/LoadingPage';
import { useMutateShelvedGames, useQueryShelvedGames } from 'hooks';
import { useLibrary } from 'hooks/useLibrary';
import { cloneDeep, orderBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SHELVES_IDS } from 'utils/constants';

export function Shelves() {
  const { isLoading, boxedGames, perShelf, response } = useQueryShelvedGames();
  const { notification } = App.useApp();
  const mutateShelvedGames = useMutateShelvedGames();
  const { data: library } = useLibrary();
  const [activeShelf, setActiveShelf] = useState<ShelfId>('');
  const [onShelf, setOnShelf] = useState<BooleanDictionary>({});

  const onSaveShelves = (shelfId: ShelfId, entries: BooleanDictionary) => {
    const newShelvedGames = cloneDeep(response);
    Object.keys(entries).forEach((key) => {
      if (entries[key]) {
        newShelvedGames[key].shelfId = shelfId;
      } else if (newShelvedGames[key].shelfId === shelfId) {
        newShelvedGames[key].shelfId = 'unshelved';
      }
    });

    mutateShelvedGames.mutate(newShelvedGames, { onSuccess: () => setActiveShelf('') });
  };

  useEffect(() => {
    if (mutateShelvedGames.isSuccess) {
      notification.success({ title: 'Shelf saved successfully' });
    }
  }, [mutateShelvedGames.isSuccess, notification]);

  useEffect(() => {
    if (mutateShelvedGames.isError) {
      notification.error({
        title: 'Failed to save shelf',
        description: mutateShelvedGames.error.message,
      });
    }
  }, [mutateShelvedGames.isError, mutateShelvedGames.error, notification]);

  useEffect(() => {
    const shelf = perShelf[activeShelf] ?? [];
    setOnShelf(
      shelf.reduce((acc: BooleanDictionary, entry) => {
        acc[entry.id] = true;
        return acc;
      }, {}),
    );
  }, [perShelf, activeShelf]);

  const boxes = useMemo(
    () =>
      orderBy(
        Object.keys(onShelf)
          .filter((gameId) => onShelf[gameId] && boxedGames[gameId])
          .map((gameId) => boxedGames[gameId]),
        ['name'],
      ),
    [onShelf, boxedGames],
  );

  const handleCancel = () => {
    setOnShelf({});
    setActiveShelf('');
  };
  const handleSave = () => {
    onSaveShelves(activeShelf, onShelf);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  const activeShelfData = SHELVES_IDS?.[activeShelf];

  const updateOnShelf = (action: 'add' | 'remove', gameId: ShelfEntryId) => {
    setOnShelf((v) => ({ ...v, [gameId]: action === 'add' }));
  };

  return (
    <Layout.Content className="p-4">
      <Typography.Title level={2}>Shelves</Typography.Title>
      <ShelvesSVG
        onSelectShelf={setActiveShelf}
        active={activeShelf ? [activeShelf] : []}
        perShelf={perShelf}
      />
      <Modal
        title={`${activeShelfData?.description ?? 'Unknown'} - ${activeShelfData?.id}`}
        open={Boolean(activeShelf)}
        onOk={handleSave}
        okText="Save Shelf"
        onCancel={handleCancel}
        confirmLoading={mutateShelvedGames.isPending}
        okButtonProps={{ disabled: Boolean(library?.legacy) }}
        cancelButtonProps={{ disabled: mutateShelvedGames.isPending }}
        closable={false}
        mask={{ closable: false }}
      >
        <AddGameToShelf
          boxedGames={boxedGames}
          updateOnShelf={updateOnShelf}
          onShelf={onShelf}
          disabled={Boolean(library?.legacy) || mutateShelvedGames.isPending}
        />
        <InShelfGamesTable games={boxes} />
      </Modal>
    </Layout.Content>
  );
}

type InShelfGamesTableProps = {
  games: ShelfEntry[];
};

function InShelfGamesTable({ games }: InShelfGamesTableProps) {
  const columns = [
    {
      title: 'Cover',
      dataIndex: 'id',
      key: 'cover',
      render: (id: GameId) => <GameCover id={id} name={'idk'} width={30} height={30} />,
    },
    {
      title: 'Title',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, entry: ShelfEntry) => <Link to={`/shelves/${entry.id}`}>{name}</Link>,
    },
    {
      title: 'Box Size',
      dataIndex: 'box',
      key: 'boxSize',
    },
  ];

  return <Table rowKey="id" dataSource={games} columns={columns} size="small" scroll={{ x: true }} />;
}

type AddGameToShelfProps = {
  boxedGames: Record<ShelfEntryId, ShelfEntry>;
  updateOnShelf: (action: 'add' | 'remove', id: ShelfEntryId) => void;
  onShelf: BooleanDictionary;
  disabled: boolean;
};

function AddGameToShelf({ boxedGames, updateOnShelf, onShelf, disabled }: AddGameToShelfProps) {
  const defaultKeys = useMemo(
    () =>
      Object.keys(onShelf).reduce((acc: string[], id) => {
        if (onShelf[id]) {
          acc.push(id);
        }
        return acc;
      }, []),
    [onShelf],
  );

  const sortedBoxedGames = useMemo(() => orderBy(Object.values(boxedGames), ['name']), [boxedGames]);

  const handleChange = (gameKeys: string[]) => {
    for (const id of new Set([...Object.keys(onShelf), ...gameKeys])) {
      updateOnShelf(gameKeys.includes(id) ? 'add' : 'remove', id);
    }
  };

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: '100%' }}
      placeholder="Add game to shelf"
      onChange={handleChange}
      value={defaultKeys}
      disabled={disabled}
      aria-label="Games on shelf"
      options={sortedBoxedGames.map((game) => ({
        value: game.id,
        label: game.name,
      }))}
    />
  );
}
