import { Layout } from 'antd';
import { SearchBar } from 'components/SearchBar/SearchBar';

export function Home() {
  return (
    <>
      <Layout.Content className="content">
        <SearchBar />
      </Layout.Content>
    </>
  );
}
