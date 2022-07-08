import { BoxSizeSelect, GameTypeTag } from 'components';
import { useMutateShelfEntry } from 'hooks/useMutateShelfEntry';
import { GameCard } from './GameCard';

type UnclassifiedGameProps = {
  game: ShelfEntry;
};

export function UnclassifiedGame({ game }: UnclassifiedGameProps) {
  const { updateEntry, isMutated, mutatedGame, save, isSaving } = useMutateShelfEntry(game);

  return (
    <GameCard game={game} isMutated={isMutated} save={save} isSaving={isSaving}>
      <div className="game-card-data">
        <p>
          <GameTypeTag containedGames={mutatedGame.contains} /> This is an unclassified game instance. Edit
          box size to convert this into a boxed game or an orphan.
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
