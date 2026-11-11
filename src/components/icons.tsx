import { type ConfigProviderProps, Empty } from 'antd';
import type { ColumnType } from 'antd/es/table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Eye,
  EyeOff,
  Gift,
  Info,
  Layers,
  ListFilter,
  LoaderCircle,
  type LucideIcon,
  PackageOpen,
  Puzzle,
  Save,
  Sparkles,
  TriangleAlert,
  Wrench,
  X,
} from 'lucide-react';
import type { MouseEventHandler } from 'react';

export const clearIcon = <CircleX size={14} />;
export const saveIcon = <Save />;
const loader = <LoaderCircle className="motion-safe:animate-spin" />;

export const iconConfig = {
  button: { loadingIcon: loader },
  spin: { indicator: <LoaderCircle size={32} className="motion-safe:animate-spin" /> },
  modal: {
    closeIcon: <X />,
    okButtonProps: { icon: <Check /> },
    cancelButtonProps: { icon: <X /> },
    infoIcon: <Info />,
    successIcon: <CircleCheck />,
    warningIcon: <TriangleAlert />,
    errorIcon: <CircleAlert />,
  },
  alert: {
    closable: false,
    closeIcon: <X />,
    infoIcon: <Info />,
    successIcon: <CircleCheck />,
    warningIcon: <TriangleAlert />,
    errorIcon: <CircleAlert />,
  },
  notification: { closeIcon: <X /> },
  tag: { closable: false, closeIcon: <X size={12} /> },
  select: {
    suffixIcon: <ChevronDown className="pointer-events-none" />,
    clearIcon,
    removeIcon: <X size={12} />,
    menuItemSelectedIcon: <Check />,
    loadingIcon: loader,
  },
  inputPassword: { iconRender: (visible) => (visible ? <EyeOff /> : <Eye />) },
  empty: { image: <PackageOpen size={48} /> },
  renderEmpty: () => <Empty image={<PackageOpen size={48} />} />,
} satisfies ConfigProviderProps;

const gameTypeIcons: Record<GameType, LucideIcon> = {
  base: Puzzle,
  expansion: Layers,
  'mini-expansion': Sparkles,
  promo: Gift,
  upgrade: Wrench,
  accessory: Wrench,
  'big-box': Box,
  unknown: CircleHelp,
};

export function GameTypeIcon({ type }: { type: GameType }) {
  const Icon = gameTypeIcons[type];
  return <Icon size={14} />;
}

export const tableIcons = {
  // Ant's filter trigger derives its accessible name from this icon.
  filterIcon: <ListFilter size={14} role="img" aria-label="filter" />,
  sortIcon: ({ sortOrder }) =>
    sortOrder === 'ascend' ? (
      <ArrowUp size={14} className="text-info" />
    ) : sortOrder === 'descend' ? (
      <ArrowDown size={14} className="text-info" />
    ) : (
      <ArrowUpDown size={14} />
    ),
} satisfies Pick<ColumnType<unknown>, 'filterIcon' | 'sortIcon'>;

export function boxExpandIcon({
  expanded,
  expandable,
  onClick,
}: {
  expanded: boolean;
  expandable: boolean;
  onClick: MouseEventHandler<HTMLElement>;
}) {
  return expandable ? (
    <button
      type="button"
      className="box-expand-icon"
      aria-label={expanded ? 'Collapse row' : 'Expand row'}
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation();
        onClick(event);
      }}
    >
      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  ) : (
    <span className="box-expand-spacer" aria-hidden="true" />
  );
}
