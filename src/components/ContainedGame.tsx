import { Button, Popconfirm } from 'antd';
import { CircleX, TriangleAlert, X } from 'lucide-react';
import { GameCover } from './GameCover';
import { GameTypeSelect } from './GameTypeSelect';

type ContainedGameProps = {
  game: ContainedGameEntry;
  index: number;
  removeContainedGame: (game: ContainedGameEntry) => void;
  updateType: (gameId: GameId, type: GameType) => void;
};

export function ContainedGame({ game, index, removeContainedGame, updateType }: ContainedGameProps) {
  return (
    <li className="mr-2 mb-2 flex max-w-[120px] flex-col items-center bg-paper p-2 text-center">
      <GameCover id={game.id} name={game.name} width={80} height={80} />
      <span className="max-w-[100px] truncate" title={game.name}>
        {game.name}
      </span>
      <span>
        <GameTypeSelect gameId={game.id} value={game.type} onChange={updateType} />
      </span>
      {index > 0 && (
        <span className="mt-2">
          <Popconfirm
            icon={<TriangleAlert className="text-warning" />}
            okButtonProps={{ icon: <CircleX /> }}
            cancelButtonProps={{ icon: <X /> }}
            title="Are you sure you want to orphan this item?"
            onConfirm={() => removeContainedGame(game)}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<CircleX />}
              aria-label={`Remove ${game.name} from box`}
              title={`Remove ${game.name} from box`}
            />
          </Popconfirm>
        </span>
      )}
    </li>
  );
}
