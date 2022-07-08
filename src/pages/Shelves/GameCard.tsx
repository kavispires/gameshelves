import { Button, Card, notification } from 'antd';
import { GameCover } from 'components';
import { useQueryShelvedGames } from 'hooks';
import { ReactNode, useEffect } from 'react';
import { UseMutationResult } from 'react-query';
import { useNavigate } from 'react-router-dom';

type GameCardProps = {
  game: ShelfEntry;
  extra?: ReactNode;
  children: [ReactNode, ReactNode];
  isMutated?: boolean;
  save: GenericFunction;
  saveResult: UseMutationResult;
};

export function GameCard({ game, children, isMutated = false, save, saveResult }: GameCardProps) {
  const navigate = useNavigate();
  const { refetch } = useQueryShelvedGames();

  useEffect(() => {
    if (saveResult.isSuccess) {
      console.count('save');
      notification.success({ message: 'Game saved successfully' });
      // Work around since invalidate is not working
      refetch();
      navigate('/');
    }
  }, [saveResult.isSuccess, navigate, refetch]);

  return (
    <Card
      title={game.name}
      extra={
        isMutated && (
          <Button type="primary" size="small" danger onClick={save} loading={saveResult.isLoading}>
            Save
          </Button>
        )
      }
      className="game-card"
    >
      <div className="game-card__content">
        <GameCover id={game.id} name={game.name} width={120} className="game-card__image" />

        <div className="game-card__details">{children[0]}</div>
        <div className="game-card__data">{children[1]}</div>
      </div>
    </Card>
  );
}
