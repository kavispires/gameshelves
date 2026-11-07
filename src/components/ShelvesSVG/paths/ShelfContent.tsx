import type { ShelfRegion } from '../shelfRegions';

type ShelfContentProps = {
  perShelf: Record<ShelfId, ShelfEntry[]>;
  regions: readonly ShelfRegion[];
};

const colors = ['#264653', '#e76f51', '#f4a261', '#8ab17d', '#e9c46a', '#2a9d8f'];

export function ShelfContent({ perShelf, regions }: ShelfContentProps) {
  return (
    <g className="shelf-content">
      {regions
        .filter((region) => region.id !== 'unshelved')
        .map((region) => {
          const entries = perShelf[region.id]?.filter((entry) => entry.box !== 'none') ?? [];
          const quantity = entries.length;
          const visible = Math.min(quantity, 12);
          const { x, y, width, height } = region.bounds;
          const padding = Math.min(width, height) * 0.06;
          const gap = width * 0.01;
          const boxWidth = Math.min(width * 0.1, (width - 2 * padding - 11 * gap) / 12);
          return (
            <g key={region.id} data-content-shelf={region.id} data-box-count={quantity}>
              {Array.from({ length: visible }, (_, index) => {
                const boxHeight = (height - padding * 2) * (0.65 + (index % 4) * 0.1);
                return (
                  <rect
                    key={entries[index].id}
                    x={x + padding + index * (boxWidth + gap)}
                    y={y + height - padding - boxHeight}
                    width={boxWidth}
                    height={boxHeight}
                    fill={colors[index % colors.length]}
                  />
                );
              })}
            </g>
          );
        })}
    </g>
  );
}
