import { AutoComplete } from 'antd';
import { useNavigate } from 'react-router-dom';

type SearchBarProps = {
  searchOptions: SearchOption[];
};

export function SearchBar({ searchOptions }: SearchBarProps) {
  // const searchOptions = [{ label: 'a', value: 'b' }];
  const navigate = useNavigate();

  const onSelect = (entryId: string) => navigate(`/shelves/${entryId}`);
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
