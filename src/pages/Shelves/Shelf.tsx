import { Layout, Select } from 'antd';
import { LoadingPage } from 'components/LoadingPage';
import { useQueryShelvedGames } from 'hooks';
import { useParams } from 'react-router-dom';

import { BoxedGame } from './BoxedGame';
import { OrphanGame } from './OrphanGame';
import { UnclassifiedGame } from './UnclassifiedGame';

export function Shelf() {
  const { id = '' } = useParams();
  const { isLoading, getShelvedGame, isOrphan, isBoxed, isShelved, orphanedGames } = useQueryShelvedGames();

  const shelvedGame = getShelvedGame(id);

  const handleChange = (e: any) => console.log(e);

  if (isLoading) {
    return <LoadingPage />;
  }

  const defaultContainedValues = shelvedGame.contains.map((containedEntry) => {
    return <Select.Option key={containedEntry.id}>{containedEntry.name}</Select.Option>;
  });

  /**
   * If Boxed Game
   */
  if (isBoxed(id)) {
    return (
      <Layout.Content className="content">
        <BoxedGame game={shelvedGame} />
      </Layout.Content>
    );
  }

  if (isOrphan(id)) {
    return (
      <Layout.Content className="content">
        <OrphanGame game={shelvedGame} />
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="content">
      <UnclassifiedGame game={shelvedGame} />
    </Layout.Content>
  );
}
