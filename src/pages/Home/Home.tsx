import { Layout } from 'antd';
import { SearchBar, ShelvesSVG } from 'components';

import { useQueryShelvedGames } from 'hooks';
import { SHELVES_IDS } from 'utils/constants';

export function Home() {
  const { response, searchOptions, perShelf } = useQueryShelvedGames();
  console.log({ response });
  return (
    <>
      <Layout.Content className="content">
        <SearchBar searchOptions={searchOptions} />

        <ShelvesSVG active={Object.keys(SHELVES_IDS)} perShelf={perShelf} />
      </Layout.Content>
    </>
  );
}
