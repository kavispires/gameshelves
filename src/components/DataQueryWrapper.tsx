import { Button, Result } from 'antd';
import { useQueryImages, useQueryShelvedGames } from 'hooks';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingPage } from './LoadingPage';

type DataQueryWrapperProps = {
  children: ReactNode;
};

export function DataQueryWrapper({ children }: DataQueryWrapperProps) {
  const shelvedGamesQuery = useQueryShelvedGames();
  const imagesQuery = useQueryImages();
  const navigate = useNavigate();

  if (shelvedGamesQuery.isLoading || imagesQuery.isLoading) {
    return <LoadingPage />;
  }

  if (shelvedGamesQuery.isError) {
    return (
      <Result
        status="500"
        title="500"
        subTitle={JSON.stringify(shelvedGamesQuery.error)}
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back Home
          </Button>
        }
      />
    );
  }

  if (imagesQuery.isError) {
    return (
      <Result
        status="500"
        title="500"
        subTitle={JSON.stringify(imagesQuery.error)}
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back Home
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
