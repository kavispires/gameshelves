import { EastShelf } from './paths/EastShelf';
import { ActiveShelves } from './paths/ActiveShelves';
import { UnshelvedGames } from './paths/UnshelvedGames';
import { WestShelf } from './paths/WestShelf';
import { Window } from './paths/Window';
import clsx from 'clsx';
import { ClickableAreas } from './paths/ClickableAreas';
import { ShelfContent } from './paths/ShelfContent';

type ShelvesSVGProps = {
  active?: ShelfId[];
  perShelf?: Record<ShelfId, ShelfEntry[]>;
  className?: string;
  onClick?: GenericFunction;
};

export function ShelvesSVG({ active, perShelf, className, onClick, ...rest }: ShelvesSVGProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 768 360"
      className={clsx('shelves-svg', className)}
      {...rest}
    >
      <Window />
      <WestShelf />
      <EastShelf />
      <UnshelvedGames quantity={100} />
      <ActiveShelves active={active ?? []} />
      <ShelfContent perShelf={perShelf ?? {}} />
      {Boolean(onClick) && <ClickableAreas onClick={onClick || (() => {})} />}
    </svg>
  );
}
