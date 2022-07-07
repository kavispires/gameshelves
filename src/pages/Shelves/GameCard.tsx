import { Button, Card } from 'antd';
import { GameCover } from 'components';
import { ReactNode } from 'react';

type GameCardProps = {
  game: ShelfEntry;
  extra?: ReactNode;
  children: [ReactNode, ReactNode];
  isMutated?: boolean;
  save: GenericFunction;
};

export function GameCard({ game, children, isMutated = false, save }: GameCardProps) {
  return (
    <Card
      title={game.name}
      extra={
        isMutated && (
          <Button type="primary" size="small" danger onClick={save}>
            Save
          </Button>
        )
      }
      className="game-card"
    >
      <div className="game-card__content">
        <GameCover src={game.thumbnail} name={game.name} width={120} className="game-card__image" />

        <div className="game-card__details">{children[0]}</div>
        <div className="game-card__data">{children[1]}</div>
      </div>
    </Card>
  );
}