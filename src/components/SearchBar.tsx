import { AutoComplete } from 'antd';
import { useNavigate } from 'react-router-dom';

type SearchBarProps = {
  searchOptions: SearchOption[];
};

export function SearchBar({ searchOptions }: SearchBarProps) {
  const navigate = useNavigate();

  const onSelect = (entryId: string) => navigate(`/shelves/${entryId}`);

  return (
    <AutoComplete
      options={searchOptions}
      style={{ width: '80%', margin: '10vh auto', display: 'block' }}
      onSelect={onSelect}
      placeholder="Type game name"
      allowClear
      size="large"
      filterOption={(inputValue, option) =>
        option!.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
      }
    />
  );
}
