import { Button } from 'antd';
import { GameCover } from './GameCover';
import { GameTypeSelect } from './GameTypeSelect';

type ContainedGamesPanelContentProps = {
  games: ContainedGameEntry[];
};

export function ContainedGamesPanelContent({ games }: ContainedGamesPanelContentProps) {
  return (
    <>
      {games.map((game, index) => (
        <div key={`contained-${game.id}`} className="contained-game">
          <GameCover src={game.thumbnail} name={game.name} width={80} className="game-card__image" />
          <span className="a">{game.name}</span>
          <span className="a">
            <GameTypeSelect value={game.type} />
          </span>
          {index !== 0 && (
            <span>
              <Button size="small" danger>
                Remove
              </Button>
            </span>
          )}
        </div>
      ))}
      <div className="contained-game">
        <Button>Add game</Button>
      </div>
    </>
  );
}
