export const DEFAULT_BOX_DIMENSIONS: Record<string, BoxPresets> = {
  Unknown: {
    width: 0,
    height: 0,
    depth: 0,
    box: 'unknown',
  },
  'Ticket To Ride': {
    width: 300,
    height: 300,
    depth: 80,
    box: 'regular',
  },
  'Queen Big Box': {
    width: 400,
    height: 320,
    depth: 100,
    box: 'big-box',
  },
  Codenames: {
    width: 235,
    height: 165,
    depth: 50,
    box: 'small',
  },
};
