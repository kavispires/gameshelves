import { Button, Image } from 'antd';
import { URLS } from 'utils/constants';
import { GameTypeSelect } from './GameTypeSelect';

type ContainedGamesPanelContentProps = {
  games: ContainedGameEntry[];
};

export function ContainedGamesPanelContent({ games }: ContainedGamesPanelContentProps) {
  return (
    <>
      {games.map((game, index) => (
        <div key={`contained-${game.id}`} className="contained-game">
          <Image
            src={game.thumbnail}
            width={80}
            fallback={URLS.BGG_NO_IMAGE}
            className="game-card__image"
            title={`Cover for: ${game.name}`}
          />
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
