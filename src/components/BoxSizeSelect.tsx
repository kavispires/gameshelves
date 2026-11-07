import { Select } from 'antd';
import { BOX_SIZES } from 'utils/constants';
import { CardItem } from './CardItem';

type BoxSizeSelectProps = {
  value: BoxSize;
  onChange?: (size: BoxSize) => void;
  disabled?: boolean;
};

export function BoxSizeSelect({ value, onChange = () => {}, disabled = false }: BoxSizeSelectProps) {
  return (
    <CardItem label="Box Size">
      <Select<BoxSize>
        value={value}
        style={{ width: 120 }}
        onSelect={onChange}
        size="small"
        disabled={disabled}
        options={BOX_SIZES.map((size) => ({ value: size, label: size }))}
      />
    </CardItem>
  );
}
