import { AutoComplete } from 'antd';
import { useQueryShelvedGames } from 'hooks';

export function SearchBar() {
  const { searchOptions } = useQueryShelvedGames();

  const onSelect = (e: any) => console.log({ select: e });
  // const onSearch = (e: any) => console.log({ search: e });

  return (
    <AutoComplete
      options={searchOptions}
      style={{ width: '80%', margin: '10vh auto', display: 'block' }}
      onSelect={onSelect}
      // onSearch={onSearch}
      placeholder="Type game name"
      allowClear
      size="large"
      filterOption={(inputValue, option) =>
        option!.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
      }
    />
  );
}
