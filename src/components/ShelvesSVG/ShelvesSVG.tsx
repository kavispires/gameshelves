import { Select } from 'antd';
import clsx from 'clsx';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { SHELVES_IDS } from 'utils/constants';
import { ActiveShelves } from './paths/ActiveShelves';
import { BoardGameBags, BoardGameBagsDetails } from './paths/BoardGameBags';
import { ClickableAreas } from './paths/ClickableAreas';
import { EastShelf } from './paths/EastShelf';
import { GarageContainer, GarageContainerDetails } from './paths/GarageContainer';
import { ShelfContent } from './paths/ShelfContent';
import { TvShelf, TvShelfDoors } from './paths/TvShelf';
import { UnshelvedGames } from './paths/UnshelvedGames';
import { WestShelf } from './paths/WestShelf';
import { Window } from './paths/Window';
import { type ShelfSectionId, shelfRegions, TV_SHELF_DIMENSIONS } from './shelfRegions';

type ShelvesSVGProps = {
  active?: ShelfId[];
  perShelf?: Record<ShelfId, ShelfEntry[]>;
  className?: string;
  onSelectShelf?: (id: ShelfId) => void;
  shelfId?: ShelfId;
};

const sections: Record<
  ShelfSectionId,
  { label: string; viewBox: string; artwork?: ReactNode; foreground?: ReactNode }
> = {
  east: { label: 'East shelf', viewBox: '-3 10 242 310', artwork: <EastShelf /> },
  west: {
    label: 'West shelf',
    viewBox: '252 10 520 310',
    artwork: (
      <>
        <Window />
        <WestShelf />
      </>
    ),
  },
  tv: {
    label: 'TV shelf',
    viewBox: `-5 -5 ${TV_SHELF_DIMENSIONS.width + 10} ${TV_SHELF_DIMENSIONS.height + 10}`,
    artwork: <TvShelf />,
    foreground: <TvShelfDoors />,
  },
  garage: {
    label: 'Garage container',
    viewBox: `-12 -12 ${SHELVES_IDS['garage-container'].dimensions.width + 24} ${SHELVES_IDS['garage-container'].dimensions.height + 24}`,
    artwork: <GarageContainer />,
    foreground: <GarageContainerDetails />,
  },
  bags: {
    label: 'Board game bags',
    viewBox: `-12 -12 ${SHELVES_IDS['board-game-bags'].dimensions.width + 24} ${SHELVES_IDS['board-game-bags'].dimensions.height + 24}`,
    artwork: <BoardGameBags />,
    foreground: <BoardGameBagsDetails />,
  },
  unshelved: { label: 'Unshelved games', viewBox: '210 274 95 74' },
};

const desktopOrder: ShelfSectionId[] = ['east', 'tv', 'west', 'unshelved', 'garage', 'bags'];
const stackedOrder: ShelfSectionId[] = ['east', 'west', 'tv', 'unshelved', 'garage', 'bags'];

export function ShelvesSVG({
  active = [],
  perShelf = {},
  className,
  onSelectShelf,
  shelfId,
}: ShelvesSVGProps) {
  const container = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = shelfId ? 'single' : width >= 1200 ? 'wide' : width >= 600 ? 'tablet' : 'phone';
  const order = layout === 'wide' ? desktopOrder : stackedOrder;
  const visibleSections = shelfId
    ? order.filter((section) => shelfRegions[section].some((region) => region.id === shelfId))
    : order;
  const unshelvedCount = perShelf.unshelved?.filter((entry) => entry.box !== 'none').length ?? 0;
  return (
    <section
      ref={container}
      aria-label="Board game shelves"
      className={clsx('shelves-layout', className)}
      data-layout={layout}
    >
      {visibleSections.map((id) => {
        const section = sections[id];
        const regions = shelfRegions[id];
        const location = regions.length === 1 ? SHELVES_IDS[regions[0].id] : undefined;
        return (
          <figure key={id} className="shelf-section" data-shelf-section={id}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox={section.viewBox}
              role={onSelectShelf ? 'group' : 'img'}
              aria-label={section.label}
              className="shelves-svg"
              style={
                location && (id === 'garage' || id === 'bags')
                  ? { maxWidth: `${(location.dimensions.width / TV_SHELF_DIMENSIONS.width) * 100}%` }
                  : undefined
              }
            >
              {section.artwork}
              <ActiveShelves active={active} regions={regions} />
              {id === 'unshelved' ? (
                <UnshelvedGames quantity={unshelvedCount} />
              ) : (
                <ShelfContent regions={regions} perShelf={perShelf} />
              )}
              {section.foreground}
              {onSelectShelf && (
                <ClickableAreas active={active} regions={regions} onSelectShelf={onSelectShelf} />
              )}
            </svg>
            <figcaption className="mt-2 text-center font-medium">
              {section.label}
              {id === 'unshelved' && ` (${unshelvedCount} ${unshelvedCount === 1 ? 'box' : 'boxes'})`}
              {location?.dimensionsEstimated && (
                <span className="mt-1 block text-xs font-normal text-muted">
                  Estimated {location.dimensions.width / 10} x {location.dimensions.height / 10} x{' '}
                  {location.dimensions.depth / 10} cm (W x H x D)
                </span>
              )}
            </figcaption>
            {onSelectShelf && (
              <Select
                className="shelf-location-picker mt-2 w-full"
                aria-label={`${section.label} location`}
                placeholder="Choose a location"
                size="large"
                style={{ minHeight: 44 }}
                showSearch
                optionFilterProp="label"
                value={regions.find((region) => active.includes(region.id))?.id}
                onChange={onSelectShelf}
                options={regions.map((region) => ({
                  value: region.id,
                  label: SHELVES_IDS[region.id].description,
                }))}
              />
            )}
          </figure>
        );
      })}
    </section>
  );
}
