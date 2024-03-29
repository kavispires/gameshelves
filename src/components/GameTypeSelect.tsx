import { Select } from 'antd';
import { GAME_TYPES } from 'utils/constants';
import { CardItem } from './CardItem';

type GameTypeSelectProps = {
  gameId: GameId;
  value: GameType;
  onChange?: GenericFunction;
  disabled?: boolean;
};

export function GameTypeSelect({
  value,
  gameId,
  onChange = () => {},
  disabled = false,
}: GameTypeSelectProps) {
  return (
    <CardItem label="Game Type">
      <Select
        value={value}
        style={{ width: 100 }}
        onSelect={(gameType: string) => onChange(gameId, gameType)}
        size="small"
        disabled={disabled}
      >
        {GAME_TYPES.map((gameType) => (
          <Select.Option key={gameType} value={gameType}>
            {gameType}
          </Select.Option>
        ))}
      </Select>
    </CardItem>
  );
}
