import { App, Button, Card } from 'antd';
import { GameCover } from 'components';
import { type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type GameCardProps = {
  game: ShelfEntry;
  extra?: ReactNode;
  children: [ReactNode, ReactNode];
  isMutated?: boolean;
  save: () => void;
  saveResult: { isSuccess: boolean; isPending: boolean };
};

export function GameCard({ game, children, isMutated = false, save, saveResult }: GameCardProps) {
  const navigate = useNavigate();
  const { notification } = App.useApp();

  useEffect(() => {
    if (saveResult.isSuccess) {
      notification.success({ title: 'Game saved successfully' });
      navigate('/');
    }
  }, [saveResult.isSuccess, navigate, notification]);

  return (
    <Card
      title={game.name}
      extra={
        isMutated && (
          <Button type="primary" size="small" danger onClick={save} loading={saveResult.isPending}>
            Save
          </Button>
        )
      }
    >
      <div className="grid grid-cols-[120px_auto] gap-8">
        <GameCover id={game.id} name={game.name} width={120} />

        <div>{children[0]}</div>
        <div className="col-span-2">{children[1]}</div>
      </div>
    </Card>
  );
}
