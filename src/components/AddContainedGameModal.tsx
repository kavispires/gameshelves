import { PlusSquareOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Select, Spin } from 'antd';
import { useQueryShelvedGames } from 'hooks';
import { orderBy } from 'lodash';
import { useMemo, useState } from 'react';
import { SEPARATOR } from 'utils/constants';

type AddContainedGameModalProps = {
  name: string;
  onAddContainedGame: (games: ContainedGameEntry[]) => void;
};

export function AddContainedGameModal({ name, onAddContainedGame }: AddContainedGameModalProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isLoading, orphanedGames } = useQueryShelvedGames();
  const [selectedOrphans, setSelectedOrphans] = useState<GameId[]>([]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    onAddContainedGame(buildContainedGameEntries(orphanedGames, selectedOrphans));
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleChange = (entries: GameId[]) => {
    setSelectedOrphans(entries.map((e) => e.split(SEPARATOR)[0]));
  };

  const listOfOrphans = useMemo(() => orderBy(Object.values(orphanedGames), ['name']), [orphanedGames]);

  return (
    <>
      <Button onClick={showModal} className="h-auto">
        <PlusSquareOutlined />
        <br />
        Add game
      </Button>

      <Modal
        title={`Add an entry contained in the same box as ${name}`}
        open={isModalVisible}
        onOk={handleOk}
        okText="Add Games"
        onCancel={handleCancel}
        closable={false}
        mask={{ closable: false }}
      >
        {isLoading && <Spin />}

        <Select
          mode="multiple"
          allowClear
          className="w-full"
          placeholder="Select orphan games"
          onChange={handleChange}
          options={listOfOrphans.map((game) => ({
            value: `${game.id}${SEPARATOR}${game.name}`,
            label: game.name,
          }))}
        />

        <Alert showIcon type="warning" title="Games are only saved upon clicking on OK" />
      </Modal>
    </>
  );
}

function buildContainedGameEntries(orphanedGames: Record<string, ShelfEntry>, ids: ShelfEntryId[]) {
  return ids.map((id) => {
    const entry = orphanedGames[id];

    return {
      ...entry.contains[0],
    };
  });
}
