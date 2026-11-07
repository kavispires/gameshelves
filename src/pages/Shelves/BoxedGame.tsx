import { Alert, Collapse } from 'antd';
import { BoxSizeSelect, ContainedGamesPanelContent, GameTypeTag, ShelvesSVG } from 'components';
import { ShelfAction } from 'components/ShelfAction';
import { useMutateShelfEntry } from 'hooks/useMutateShelfEntry';
import { GameCard } from './GameCard';

type BoxedGameProps = {
  game: ShelfEntry;
};

export function BoxedGame({ game }: BoxedGameProps) {
  const {
    updateEntry,
    addContainedGames,
    isMutated,
    mutatedGame,
    updateEntriesToBeOrphan,
    updateContainedGameType,
    save,
    saveResult,
  } = useMutateShelfEntry(game);

  return (
    <GameCard game={game} isMutated={isMutated} save={save} saveResult={saveResult}>
      <div>
        {saveResult.isError && (
          <Alert type="error" title="Failed to save" description={saveResult.error.message} />
        )}
        <p>
          <GameTypeTag containedGames={mutatedGame.contains} />
        </p>
        <p>This is a boxed game instance.</p>
        <div className="flex gap-4">
          <BoxSizeSelect value={mutatedGame.box} onChange={(e) => updateEntry('box', e)} />

          {/* TODO: Add way to click on shelf and shelve game */}
          <ShelfAction
            shelfId={mutatedGame.shelfId}
            isShelved={mutatedGame.shelfId !== 'unshelved'}
            isBoxed={true}
          />
        </div>
      </div>
      <div>
        <Collapse
          defaultActiveKey={['contained-games']}
          items={[
            {
              key: 'contained-games',
              label: `Items in this box (${mutatedGame.contains.length})`,
              children: (
                <ContainedGamesPanelContent
                  games={mutatedGame.contains}
                  containerName={mutatedGame.name}
                  onAddContainedGame={addContainedGames}
                  removeContainedGame={updateEntriesToBeOrphan}
                  updateType={updateContainedGameType}
                />
              ),
            },
            {
              key: 'shelves',
              label: 'Game location in shelves',
              children: <ShelvesSVG active={[game.shelfId]} />,
            },
          ]}
        />

        {/* Related Games */}
      </div>
    </GameCard>
  );
}
