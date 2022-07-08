import { Select } from 'antd';
import { BOX_SIZES } from 'utils/constants';
import { CardItem } from './CardItem';

type BoxSizeSelectProps = {
  value: BoxSize;
  onChange?: GenericFunction;
  disabled?: boolean;
};

export function BoxSizeSelect({ value, onChange = () => {}, disabled = false }: BoxSizeSelectProps) {
  return (
    <CardItem label="Box Size">
      <Select value={value} style={{ width: 120 }} onSelect={onChange} size="small" disabled={disabled}>
        {BOX_SIZES.map((size) => (
          <Select.Option key={size} value={size}>
            {size}
          </Select.Option>
        ))}
      </Select>
    </CardItem>
  );
}
