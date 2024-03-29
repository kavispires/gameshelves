import { CloseCircleFilled } from '@ant-design/icons';
import { Button, Popconfirm } from 'antd';
import { GameCover } from './GameCover';
import { GameTypeSelect } from './GameTypeSelect';

type ContainedGameProps = {
  game: ContainedGameEntry;
  index: number;
  removeContainedGame: GenericFunction;
  updateType: GenericFunction;
};

export function ContainedGame({ game, index, removeContainedGame, updateType }: ContainedGameProps) {
  return (
    <li key={`contained-${game.id}`} className="contained-game">
      <GameCover id={game.id} name={game.name} width={80} height={80} className="game-card__image" />
      <span className="contained-game__name" title={game.name}>
        {game.name}
      </span>
      <span className="contained-game__type">
        <GameTypeSelect gameId={game.id} value={game.type} onChange={updateType} />
      </span>
      {index > 0 && (
        <span className="contained-game__remove">
          <Popconfirm
            title="Are you sure you want to orphan this item?"
            onConfirm={() => removeContainedGame(game)}
          >
            <Button size="small" type="text" danger icon={<CloseCircleFilled />}></Button>
          </Popconfirm>
        </span>
      )}
    </li>
  );
}
