import { Collapse } from 'antd';
import { BoxSizeSelect, ContainedGamesPanelContent, GameTypeTag, ShelvesSVG } from 'components';
import { ShelfAction } from 'components/ShelfAction';
import { useMutateShelfEntry } from 'hooks/useMutateShelfEntry';
import { useState } from 'react';
import { GameCard } from './GameCard';

type BoxedGameProps = {
  game: ShelfEntry;
};

export function BoxedGame({ game }: BoxedGameProps) {
  const { updateEntry, isMutated, mutatedGame, updateEntriesToBeOrphan, save } = useMutateShelfEntry(game);
  const [activeCollapse, setActiveCollapse] = useState('contained-games');

  return (
    <GameCard game={game} isMutated={isMutated} save={save}>
      <div className="game-card-data">
        <p>
          <GameTypeTag containedGames={mutatedGame.contains} />
        </p>
        <p>This is a boxed game instance.</p>
        <div className="game-card-data-details">
          <BoxSizeSelect value={mutatedGame.box} onChange={(e) => updateEntry('box', e)} />

          {/* TODO: Add way to click on shelf and shelve game */}
          <ShelfAction
            shelfId={mutatedGame.shelfId}
            isShelved={mutatedGame.shelfId !== 'unshelved'}
            isBoxed={true}
          />
        </div>
      </div>
      <div className="game-card-data">
        <Collapse defaultActiveKey={['contained-games']}>
          {/* TODO: Add way to add and remove contained games, except [0] */}
          <Collapse.Panel key="contained-games" header="Items in this box">
            <ContainedGamesPanelContent
              games={mutatedGame.contains}
              containerName={mutatedGame.name}
              onAddContainedGame={(list: ContainedGameEntry[]) => updateEntry('contains', list)}
              removeContainedGame={updateEntriesToBeOrphan}
            />
          </Collapse.Panel>
          <Collapse.Panel key="shelves" header="Game location in shelves">
            <ShelvesSVG active={[game.shelfId]} />
          </Collapse.Panel>
        </Collapse>

        {/* Related Games */}
      </div>
    </GameCard>
  );
}
