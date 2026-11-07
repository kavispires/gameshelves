import { SHELVES_IDS } from 'utils/constants';
import type { ShelfRegion } from '../shelfRegions';

type ClickableAreasProps = {
  regions: readonly ShelfRegion[];
  active: ShelfId[];
  onSelectShelf: (id: ShelfId) => void;
};

export function ClickableAreas({ regions, active, onSelectShelf }: ClickableAreasProps) {
  return (
    <g>
      {regions.map((region) => (
        <path
          key={region.id}
          data-shelf-id={region.id}
          role="button"
          tabIndex={0}
          aria-label={`Select shelf ${region.id}`}
          aria-description={SHELVES_IDS[region.id].description}
          aria-pressed={active.includes(region.id)}
          className="clickable-path"
          d={region.path}
          onClick={() => onSelectShelf(region.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelectShelf(region.id);
            }
          }}
        />
      ))}
    </g>
  );
}
