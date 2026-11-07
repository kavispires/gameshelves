import { SHELVES_IDS } from 'utils/constants';

export type ShelfRegion = {
  id: ShelfId;
  path: string;
  bounds: { x: number; y: number; width: number; height: number };
  activeFill: string;
};

function rectangle(
  id: ShelfId,
  x: number,
  y: number,
  width: number,
  height: number,
  activeFill = '#ee9781',
): ShelfRegion {
  return {
    id,
    path: `M${x} ${y}h${width}v${height}h-${width}z`,
    bounds: { x, y, width, height },
    activeFill,
  };
}

function measuredRegion(id: ShelfId, x: number, y: number): ShelfRegion {
  const { width, height } = SHELVES_IDS[id].dimensions;
  return rectangle(id, x, y, width, height);
}

export const TV_SHELF_DIMENSIONS = { width: 1473.2, height: 838.2, depth: 406.4 };
const garage = SHELVES_IDS['garage-container'].dimensions;
const bags = SHELVES_IDS['board-game-bags'].dimensions;

export const shelfRegions = {
  east: [
    rectangle('ew-cl-0', 8.26, 228.57, 69.9, 26.33, '#ee9781'),
    rectangle('ew-cl-1', 8.26, 257.87, 69.9, 21.7, '#ee9781'),
    rectangle('ew-cl-2', 8.26, 282.6, 69.9, 21.96, '#ee9781'),
    rectangle('ew-cr-0', 156.79, 228.57, 69.9, 26.33, '#ee9781'),
    rectangle('ew-cr-1', 156.79, 257.87, 69.9, 21.7, '#ee9781'),
    rectangle('ew-cr-2', 156.79, 282.6, 69.9, 21.96, '#ee9781'),
    rectangle('ew-dc-0', 82.24, 231.58, 69.9, 16.45, '#ee9781'),
    rectangle('ew-dc-1', 82.24, 250.5, 69.9, 16.45, '#ee9781'),
    rectangle('ew-dc-2', 82.24, 269.23, 69.9, 16.45, '#ee9781'),
    rectangle('ew-dc-3', 82.24, 287.74, 69.9, 16.45, '#ee9781'),
    rectangle('ew-sl-0', 7.67, 25.1, 70.49, 32.51, '#ee9781'),
    rectangle('ew-sl-1', 7.67, 60.37, 70.49, 31.25, '#ee9781'),
    rectangle('ew-sl-2', 7.67, 93.77, 70.49, 31.02, '#ee9781'),
    rectangle('ew-sl-3', 7.67, 126.62, 70.49, 31.02, '#ee9781'),
    rectangle('ew-sl-4', 7.67, 159.79, 70.49, 31.92, '#ee9781'),
    rectangle('ew-sl-5', 7.67, 193.54, 70.49, 30.58, '#ee9781'),
    rectangle('ew-sc-0', 81.94, 25.1, 70.49, 32.51, '#ee9781'),
    rectangle('ew-sc-1', 81.94, 60.37, 70.49, 31.25, '#ee9781'),
    rectangle('ew-sc-2', 81.94, 93.77, 70.49, 31.02, '#ee9781'),
    rectangle('ew-sc-3', 81.94, 126.62, 70.49, 31.02, '#ee9781'),
    rectangle('ew-sc-4', 81.94, 159.79, 70.49, 31.92, '#ee9781'),
    rectangle('ew-sc-5', 81.94, 193.54, 70.49, 30.58, '#ee9781'),
    rectangle('ew-sr-0', 156.24, 25.1, 70.49, 32.51, '#ee9781'),
    rectangle('ew-sr-1', 156.24, 60.37, 70.49, 31.25, '#ee9781'),
    rectangle('ew-sr-2', 156.24, 93.77, 70.49, 31.02, '#ee9781'),
    rectangle('ew-sr-3', 156.24, 126.62, 70.49, 31.02, '#ee9781'),
    rectangle('ew-sr-4', 156.24, 159.79, 70.49, 31.92, '#ee9781'),
    rectangle('ew-sr-5', 156.24, 193.54, 70.49, 30.58, '#ee9781'),
  ],
  west: [
    rectangle('ww-sl-0', 262, 25.61, 50.77, 38.35, '#f7931e'),
    rectangle('ww-sl-1', 262, 66.52, 50.77, 35.98, '#0f0'),
    rectangle('ww-sl-2', 262, 105.07, 50.77, 37.06, '#0ff'),
    rectangle('ww-sl-3', 262, 144.66, 50.77, 36.59, '#00f'),
    rectangle('ww-sl-4', 316.82, 25.61, 51.19, 38.35, '#f7931e'),
    rectangle('ww-sl-5', 316.82, 66.52, 51.19, 35.98, '#0f0'),
    rectangle('ww-sl-6', 316.82, 105.07, 51.19, 37.06, '#0ff'),
    rectangle('ww-sl-7', 316.82, 144.66, 51.19, 36.59, '#00f'),
    rectangle('ww-sl-8', 262, 183.48, 106.01, 44.94, '#1b1464'),
    rectangle('ww-cl-0', 262, 234.69, 50.77, 23.11, '#22b573'),
    rectangle('ww-cl-1', 262, 260.02, 50.77, 21.31, '#29abe2'),
    rectangle('ww-cl-2', 262, 283.63, 50.77, 21.31, '#ee9781'),
    rectangle('ww-cl-3', 316.77, 234.69, 50.66, 23.11, '#22b573'),
    rectangle('ww-cl-4', 316.77, 260.02, 50.66, 21.31, '#29abe2'),
    rectangle('ww-cl-5', 316.77, 283.63, 50.66, 21.31, '#ee9781'),
    rectangle('ww-dc-0', 372.38, 273.14, 68.97, 31.61, '#2e3192'),
    rectangle('ww-dc-1', 445.97, 273.14, 68.97, 31.61, '#29abe2'),
    rectangle('ww-dc-2', 519.56, 273.14, 68.97, 31.61, '#ff0'),
    rectangle('ww-dc-3', 593.13, 273.14, 68.97, 31.61, '#006837'),
    rectangle('ww-sr-0', 666.44, 25.49, 45.93, 38.46, '#f7931e'),
    rectangle('ww-sr-1', 666.44, 66.41, 45.93, 36.29, '#2e3192'),
    rectangle('ww-sr-2', 666.44, 105.24, 45.93, 37.04, '#a67c52'),
    rectangle('ww-sr-3', 666.44, 144.81, 45.93, 36.43, '#c69c6d'),
    rectangle('ww-sr-4', 716.59, 25.49, 45.68, 38.46, '#f7931e'),
    rectangle('ww-sr-5', 716.59, 66.41, 45.68, 36.29, '#2e3192'),
    rectangle('ww-sr-6', 716.59, 105.24, 45.68, 37.04, '#a67c52'),
    rectangle('ww-sr-7', 716.59, 144.81, 45.68, 36.43, '#c69c6d'),
    rectangle('ww-sr-8', 666.44, 183.51, 95.83, 45.05, '#662d91'),
    rectangle('ww-cr-0', 666.34, 234.69, 46.07, 23.03, '#2e3192'),
    rectangle('ww-cr-1', 666.34, 260.06, 46.07, 21.18, '#297873'),
    rectangle('ww-cr-2', 666.34, 283.57, 46.07, 21.18, '#00a99d'),
    rectangle('ww-cr-3', 716.39, 234.69, 46.07, 23.03, '#2e3192'),
    rectangle('ww-cr-4', 716.39, 260.06, 46.07, 21.18, '#297873'),
    rectangle('ww-cr-5', 716.39, 283.57, 46.07, 21.18, '#00a99d'),
  ],
  tv: [
    measuredRegion('tv-cl-0', 121.6, 245),
    measuredRegion('tv-cl-1', 121.6, 443),
    measuredRegion('tv-cr-0', 751.6, 245),
    measuredRegion('tv-cr-1', 751.6, 443),
  ],
  garage: [
    {
      ...measuredRegion('garage-container', 0, 0),
      bounds: { x: 50, y: 110, width: garage.width - 100, height: garage.height - 160 },
      activeFill: '#8ab17d',
    },
  ],
  bags: [
    {
      ...measuredRegion('board-game-bags', 0, 0),
      bounds: { x: 30, y: 115, width: bags.width - 60, height: bags.height - 140 },
    },
  ],
  unshelved: [
    {
      id: 'unshelved',
      path: 'M298.81 331.89L282.86 316l-4 4-7.22-28.56-13.21 3.35.47 1.85h-3.37v-7.63h-2.21v-7.62h-22.53v7.62h-5v7.63h-8.88v13.62h5.44v1.63h-1.71v7.62h-2.95v7.63h-2.33v13.62h53.41v-5.18l1.63 6.42 13.21-3.34-.9-3.58 6.47 6.47zm-32.37-4.82v-.75l.19.75z',
      bounds: { x: 214, y: 278, width: 86, height: 66 },
      activeFill: '#ee9781',
    },
  ],
};

export type ShelfSectionId = keyof typeof shelfRegions;
