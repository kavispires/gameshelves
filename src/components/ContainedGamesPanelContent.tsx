import { AddContainedGameModal } from './AddContainedGameModal';
import { ContainedGame } from './ContainedGame';

type ContainedGamesPanelContentProps = {
  games: ContainedGameEntry[];
  containerName: string;
  onAddContainedGame: (games: ContainedGameEntry[]) => void;
  removeContainedGame: (game: ContainedGameEntry) => void;
  updateType: (gameId: GameId, type: GameType) => void;
};

export function ContainedGamesPanelContent({
  games,
  containerName,
  onAddContainedGame,
  removeContainedGame,
  updateType,
}: ContainedGamesPanelContentProps) {
  return (
    <ul className="flex flex-wrap">
      {games.map((game, index) => (
        <ContainedGame
          key={`contained-${game.id}`}
          game={game}
          index={index}
          removeContainedGame={removeContainedGame}
          updateType={updateType}
        />
      ))}
      <li className="mr-2 mb-2 flex max-w-[120px] flex-col items-center justify-center bg-paper p-2">
        <AddContainedGameModal name={containerName} onAddContainedGame={onAddContainedGame} />
      </li>
    </ul>
  );
}
