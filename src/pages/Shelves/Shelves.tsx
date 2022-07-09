import { Layout, Select } from 'antd';
import { ShelvesSVG } from 'components';
import { LoadingPage } from 'components/LoadingPage';
import { useQueryShelvedGames } from 'hooks';
import { useParams } from 'react-router-dom';

import { BoxedGame } from './BoxedGame';
import { OrphanGame } from './OrphanGame';
import { UnclassifiedGame } from './UnclassifiedGame';

export function Shelves() {
  const { isLoading, boxedGames, perShelf } = useQueryShelvedGames();

  const handleChange = (e: any) => console.log(e.target.id);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <Layout.Content className="content">
      <p>Shelves</p>
      <ShelvesSVG onClick={handleChange} />
    </Layout.Content>
  );
}
