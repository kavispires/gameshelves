import { Select } from 'antd';
import { GAME_TYPES } from 'utils/constants';
import { CardItem } from './CardItem';

type GameTypeSelectProps = {
  gameId: GameId;
  value: GameType;
  onChange?: (gameId: GameId, type: GameType) => void;
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
      <Select<GameType>
        value={value}
        style={{ width: 100 }}
        onSelect={(gameType) => onChange(gameId, gameType)}
        size="small"
        disabled={disabled}
        options={GAME_TYPES.map((type) => ({ value: type, label: type }))}
      />
    </CardItem>
  );
}
