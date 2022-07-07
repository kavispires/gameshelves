import { Select } from 'antd';
import { GAME_TYPES } from 'utils/constants';
import { CardItem } from './CardItem';

type GameTypeSelectProps = {
  value: GameType;
  onChange?: GenericFunction;
  disabled?: boolean;
};

export function GameTypeSelect({ value, onChange = () => {}, disabled = false }: GameTypeSelectProps) {
  return (
    <CardItem label="Game Type">
      <Select value={value} style={{ width: 100 }} onSelect={onChange} size="small" disabled={disabled}>
        {GAME_TYPES.map((gameType) => (
          <Select.Option value={gameType}>{gameType}</Select.Option>
        ))}
      </Select>
    </CardItem>
  );
}
