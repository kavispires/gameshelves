import { BoxSizeSelect, GameTypeTag } from 'components';
import { useMutateShelfEntry } from 'hooks/useMutateShelfEntry';
import { GameCard } from './GameCard';

type OrphanGameProps = {
  game: ShelfEntry;
};

export function OrphanGame({ game }: OrphanGameProps) {
  const { updateEntry, isMutated, mutatedGame, save, saveResult } = useMutateShelfEntry(game);
  return (
    <GameCard game={game} isMutated={isMutated} save={save} saveResult={saveResult}>
      <div className="game-card-data">
        <p>
          <GameTypeTag containedGames={mutatedGame.contains} /> This is an orphan instance.
        </p>
        <BoxSizeSelect value={mutatedGame.box} onChange={(e) => updateEntry('box', e)} />

        {/* Shelf Id, or Re-shelf or Unshelved */}
      </div>
      <div className="game-card-data">
        {/* Contained Games */}
        {/* Shelf */}
        {/* Related Games */}
      </div>
    </GameCard>
  );
}
