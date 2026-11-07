import { App, Layout, Modal, Select, Table, Typography } from 'antd';
import { GameCover, ShelvesSVG } from 'components';
import { LoadingPage } from 'components/LoadingPage';
import { useMutateShelvedGames, useQueryShelvedGames } from 'hooks';
import { cloneDeep, orderBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { SEPARATOR, SHELVES_IDS } from 'utils/constants';

export function Shelves() {
  const { isLoading, boxedGames, perShelf, response } = useQueryShelvedGames();
  const { notification } = App.useApp();
  const mutateShelvedGames = useMutateShelvedGames();
  const [activeShelf, setActiveShelf] = useState<ShelfId>('');
  const [onShelf, setOnShelf] = useState<BooleanDictionary>({});

  const onSaveShelves = (shelfId: ShelfId, entries: BooleanDictionary) => {
    const newShelvedGames = cloneDeep(response);
    Object.keys(entries).forEach((key) => {
      if (entries[key]) {
        newShelvedGames[key].shelfId = shelfId;
      } else {
        newShelvedGames[key].shelfId = 'unshelved';
      }
    });

    mutateShelvedGames.mutate(newShelvedGames);
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
        Object.keys(onShelf).map((gameId) => boxedGames[gameId]),
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
    setActiveShelf('');
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
        closable={false}
        mask={{ closable: false }}
      >
        <AddGameToShelf boxedGames={boxedGames} updateOnShelf={updateOnShelf} onShelf={onShelf} />
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
    },
    {
      title: 'Box Size',
      dataIndex: 'box',
      key: 'boxSize',
    },
  ];

  return <Table rowKey="id" dataSource={games} columns={columns} size="small" />;
}

type AddGameToShelfProps = {
  boxedGames: Record<ShelfEntryId, ShelfEntry>;
  updateOnShelf: (action: 'add' | 'remove', id: ShelfEntryId) => void;
  onShelf: BooleanDictionary;
};

function AddGameToShelf({ boxedGames, updateOnShelf, onShelf }: AddGameToShelfProps) {
  const defaultKeys = useMemo(
    () =>
      Object.keys(onShelf).reduce((acc: string[], id) => {
        if (onShelf[id]) {
          acc.push(`${boxedGames[id].id}${SEPARATOR}${boxedGames[id].name}`);
        }
        return acc;
      }, []),
    [onShelf, boxedGames],
  );

  const sortedBoxedGames = useMemo(() => orderBy(Object.values(boxedGames), ['name']), [boxedGames]);

  const handleChange = (gameKeys: string[]) => {
    gameKeys.forEach((key) => {
      updateOnShelf('add', key.split(SEPARATOR)[0]);
    });
  };

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: '100%' }}
      placeholder="Add game to shelf"
      onChange={handleChange}
      defaultValue={defaultKeys}
      options={sortedBoxedGames.map((game) => ({
        value: `${game.id}${SEPARATOR}${game.name}`,
        label: game.name,
      }))}
    />
  );
}
