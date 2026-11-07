import { Alert, Button, Card, Space, Spin } from 'antd';
import { useBatchMutateGames, useMutateShelvedGames } from 'hooks';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { prepareGamesToBeSaved } from './utils';

type SaveDataCardProps = {
  dataToBeAdded: GameEntry[];
  classifications: Record<GameId, Classification>;
};

export function SaveDataCard({ dataToBeAdded, classifications }: SaveDataCardProps) {
  const [{ games, shelvedGames }] = useState(prepareGamesToBeSaved(dataToBeAdded, classifications));
  const navigate = useNavigate();

  const shelvedGamesMutation = useMutateShelvedGames();

  const batchSaveGamesMutation = useBatchMutateGames();

  const performSave = () => {
    shelvedGamesMutation.mutate(shelvedGames);
    batchSaveGamesMutation.mutate(games);
  };

  const isLoading = shelvedGamesMutation.isPending || batchSaveGamesMutation.isPending;
  const isSuccess = shelvedGamesMutation.isSuccess && batchSaveGamesMutation.isSuccess;

  return (
    <Card title="Save Data" className="w-full m-4">
      {isLoading && <Spin />}

      {shelvedGamesMutation.isError && (
        <Alert
          type="error"
          title="Failed to save shelved games"
          description={shelvedGamesMutation.error.message}
        />
      )}

      {batchSaveGamesMutation.isError && (
        <Alert type="error" title="Failed to save games" description={batchSaveGamesMutation.error.message} />
      )}

      {isSuccess && <Alert type="success" title="New games added successfully" />}

      <Space className="w-full flex justify-center m-4">
        <Button type="primary" size="large" onClick={performSave} loading={isLoading} disabled={isSuccess}>
          Save {games.length} games
        </Button>
      </Space>

      {isSuccess && (
        <Space className="w-full flex justify-center m-4">
          <Button type="link" onClick={() => navigate('/')}>
            Back to Home page
          </Button>
        </Space>
      )}
    </Card>
  );
}
