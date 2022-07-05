import { Alert, Button, Card, Space, Spin } from 'antd';
import { getGameRef, useBatchMutateGames, useMutateShelvedGames } from 'hooks';
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

  const { batch, mutation: batchSaveGamesMutation } = useBatchMutateGames();

  const performSave = () => {
    shelvedGamesMutation.mutate(shelvedGames);
    games.forEach((game) => {
      console.log('adding to batch', game.id);
      batch.set(getGameRef(`${game.id}`), game);
    });
    batchSaveGamesMutation.mutate();
  };

  const isLoading = shelvedGamesMutation.isLoading || batchSaveGamesMutation.isLoading;
  const isSuccess = shelvedGamesMutation.isSuccess && batchSaveGamesMutation.isSuccess;
  const isError = shelvedGamesMutation.isError && batchSaveGamesMutation.isError;

  return (
    <Card title="Save Data" className="full-width margin-1">
      {isLoading ? <Spin /> : <></>}

      {shelvedGamesMutation.isError && (
        <Alert
          type="error"
          message="Failed to save shelved games"
          description={JSON.stringify(shelvedGamesMutation.error)}
        />
      )}

      {batchSaveGamesMutation.isError && (
        <Alert
          type="error"
          message="Failed to save games"
          description={JSON.stringify(batchSaveGamesMutation.error)}
        />
      )}

      {isSuccess && <Alert type="success" message="New games added successfully" />}

      <Space className="full-width flex-center margin-1">
        <Button
          type="primary"
          size="large"
          onClick={performSave}
          loading={isLoading}
          disabled={isSuccess || isError}
        >
          Save {games.length} games
        </Button>
      </Space>

      {isSuccess && (
        <Space className="full-width flex-center margin-1">
          <Button type="link" onClick={() => navigate('/')}>
            Back to Home page
          </Button>
        </Space>
      )}
    </Card>
  );
}
