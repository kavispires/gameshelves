import { Layout, Modal, notification, Select, Table, Typography } from 'antd';
import { GameCover, ShelvesSVG } from 'components';
import { LoadingPage } from 'components/LoadingPage';
import { useMutateShelvedGames, useQueryShelvedGames } from 'hooks';
import { cloneDeep, orderBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { SEPARATOR, SHELVES_IDS } from 'utils/constants';

export function Shelves() {
  const { isLoading, boxedGames, perShelf, response, refetch } = useQueryShelvedGames();
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
      notification.success({ message: 'Shelf saved successfully' });
      // Work around since invalidate is not working
      refetch();
    }
  }, [mutateShelvedGames.isSuccess, refetch]);

  useEffect(() => {
    const shelf = perShelf[activeShelf] ?? [];
    setOnShelf(
      shelf.reduce((acc: BooleanDictionary, entry) => {
        acc[entry.id] = true;
        return acc;
      }, {})
    );
  }, [perShelf, activeShelf]);

  const boxes = useMemo(
    () =>
      orderBy(
        Object.keys(onShelf).map((gameId) => boxedGames[gameId]),
        ['name']
      ),
    [onShelf, boxedGames]
  );

  const handleChange = (e: any) => {
    if (e.target.id) {
      setActiveShelf(e.target.id);
    }
  };

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
    <Layout.Content className="content">
      <Typography.Title level={2}>Shelves</Typography.Title>
      <ShelvesSVG onClick={handleChange} active={activeShelf ? [activeShelf] : []} perShelf={perShelf} />
      <Modal
        title={`${activeShelfData?.description ?? 'Unknown'} - ${activeShelfData?.id}`}
        visible={Boolean(activeShelf)}
        onOk={handleSave}
        okText="Save Shelf"
        onCancel={handleCancel}
        closable={false}
        maskClosable={false}
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

  return <Table dataSource={games} columns={columns} size="small" />;
}

type AddGameToShelfProps = {
  boxedGames: Record<ShelfEntryId, ShelfEntry>;
  updateOnShelf: GenericFunction;
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
    [onShelf, boxedGames]
  );

  const sortedBoxedGames = useMemo(() => orderBy(Object.values(boxedGames), ['name']), [boxedGames]);

  const handleChange = (gameKeys: string[]) =>
    gameKeys.forEach((key) => updateOnShelf('add', key.split(SEPARATOR)[0]));

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: '100%' }}
      placeholder="Add game to shelf"
      onChange={handleChange}
      defaultValue={defaultKeys}
    >
      {sortedBoxedGames.map((boxedGame) => {
        return (
          <Select.Option key={boxedGame.id} value={`${boxedGame.id}${SEPARATOR}${boxedGame.name}`}>
            {boxedGame.name}
          </Select.Option>
        );
      })}
    </Select>
  );
}
