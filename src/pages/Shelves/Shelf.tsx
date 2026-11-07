import { Layout } from 'antd';
import { LoadingPage } from 'components/LoadingPage';
import { useQueryShelvedGames } from 'hooks';
import { useParams } from 'react-router-dom';
import { NotFound } from '../NotFound/NotFound';
import { BoxedGame } from './BoxedGame';
import { OrphanGame } from './OrphanGame';
import { UnclassifiedGame } from './UnclassifiedGame';

export function Shelf() {
  const { id = '' } = useParams();
  const { isLoading, getShelvedGame, isOrphan, isBoxed } = useQueryShelvedGames();

  const shelvedGame = getShelvedGame(id);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!shelvedGame) return <NotFound />;

  /**
   * If Boxed Game
   */
  if (isBoxed(id)) {
    return (
      <Layout.Content className="p-4">
        <BoxedGame game={shelvedGame} />
      </Layout.Content>
    );
  }

  if (isOrphan(id)) {
    return (
      <Layout.Content className="p-4">
        <OrphanGame game={shelvedGame} />
      </Layout.Content>
    );
  }

  return (
    <Layout.Content className="p-4">
      <UnclassifiedGame game={shelvedGame} />
    </Layout.Content>
  );
}
