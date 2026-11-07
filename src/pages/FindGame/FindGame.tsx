import { Layout, Typography } from 'antd';
import { SearchBar, ShelvesSVG } from 'components';

import { useQueryShelvedGames } from 'hooks';

export function FindGame() {
  const { searchOptions, perShelf } = useQueryShelvedGames();

  return (
    <Layout.Content className="p-4">
      <Typography.Title level={1}>Find Game</Typography.Title>
      <SearchBar searchOptions={searchOptions} />

      <ShelvesSVG perShelf={perShelf} />
    </Layout.Content>
  );
}
