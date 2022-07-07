import { AddContainedGameModal } from './AddContainedGameModal';
import { ContainedGame } from './ContainedGame';

type ContainedGamesPanelContentProps = {
  games: ContainedGameEntry[];
  containerName: string;
  onAddContainedGame: GenericFunction;
  removeContainedGame: GenericFunction;
};

export function ContainedGamesPanelContent({
  games,
  containerName,
  onAddContainedGame,
  removeContainedGame,
}: ContainedGamesPanelContentProps) {
  return (
    <ul className="contained-game-list">
      {games.map((game, index) => (
        <ContainedGame
          key={`contained-${game.id}`}
          game={game}
          index={index}
          removeContainedGame={removeContainedGame}
        />
      ))}
      <li className="contained-game contained-game__add-game">
        <AddContainedGameModal name={containerName} onAddContainedGame={onAddContainedGame} />
      </li>
    </ul>
  );
}
