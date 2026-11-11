import { AutoComplete } from 'antd';
import { useNavigate } from 'react-router-dom';
import { clearIcon } from './icons';

type SearchBarProps = {
  searchOptions: SearchOption[];
};

export function SearchBar({ searchOptions }: SearchBarProps) {
  const navigate = useNavigate();

  const onSelect = (entryId: string) => navigate(`/games/${encodeURIComponent(entryId)}`);

  return (
    <AutoComplete
      aria-label="Find a game"
      options={searchOptions}
      style={{ width: '80%', margin: '10vh auto', display: 'block' }}
      onSelect={onSelect}
      placeholder="Type game name"
      allowClear={{ clearIcon }}
      size="large"
      filterOption={(inputValue, option) =>
        option?.label.toUpperCase().includes(inputValue.toUpperCase()) ?? false
      }
    />
  );
}
