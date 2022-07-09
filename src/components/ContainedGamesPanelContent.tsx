import { AddContainedGameModal } from './AddContainedGameModal';
import { ContainedGame } from './ContainedGame';

type ContainedGamesPanelContentProps = {
  games: ContainedGameEntry[];
  containerName: string;
  onAddContainedGame: GenericFunction;
  removeContainedGame: GenericFunction;
  updateType: GenericFunction;
};

export function ContainedGamesPanelContent({
  games,
  containerName,
  onAddContainedGame,
  removeContainedGame,
  updateType,
}: ContainedGamesPanelContentProps) {
  return (
    <ul className="contained-game-list">
      {games.map((game, index) => (
        <ContainedGame
          key={`contained-${game.id}`}
          game={game}
          index={index}
          removeContainedGame={removeContainedGame}
          updateType={updateType}
        />
      ))}
      <li className="contained-game contained-game__add-game">
        <AddContainedGameModal name={containerName} onAddContainedGame={onAddContainedGame} />
      </li>
    </ul>
  );
}
