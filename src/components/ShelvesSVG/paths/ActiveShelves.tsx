import type { ShelfRegion } from '../shelfRegions';

type ActiveShelvesProps = {
  active: ShelfId[];
  regions: readonly ShelfRegion[];
};

export function ActiveShelves({ active, regions }: ActiveShelvesProps) {
  return (
    <g className="shelf-active">
      {regions
        .filter((region) => active.includes(region.id))
        .map((region) => (
          <path key={region.id} data-active-shelf={region.id} fill={region.activeFill} d={region.path} />
        ))}
    </g>
  );
}
