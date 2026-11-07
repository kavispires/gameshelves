import { Layout, Typography } from 'antd';
import { SearchBar, ShelvesSVG } from 'components';

import { useQueryShelvedGames } from 'hooks';
import { SHELVES_IDS } from 'utils/constants';

export function FindGame() {
  const { searchOptions, perShelf } = useQueryShelvedGames();

  return (
    <Layout.Content className="p-4">
      <Typography.Title level={1}>Find Game</Typography.Title>
      <SearchBar searchOptions={searchOptions} />

      <ShelvesSVG active={Object.keys(SHELVES_IDS)} perShelf={perShelf} />
    </Layout.Content>
  );
}
