import { SHELVES_IDS } from 'utils/constants';

const { width, height } = SHELVES_IDS['garage-container'].dimensions;

export function GarageContainer() {
  return (
    <g stroke="#30363a" strokeWidth="6">
      <rect width={width} height={height} rx="28" fill="#42484b" />
      <rect x="30" y="85" width={width - 60} height={height - 110} rx="16" fill="#50575a" />
    </g>
  );
}

export function GarageContainerDetails() {
  return (
    <g stroke="#30363a" strokeWidth="6" pointerEvents="none">
      <rect width={width} height="65" rx="18" fill="#f2c94c" />
      <path d={`M15 45h${width - 30}`} fill="none" />
      {[60, width - 110].map((x) => (
        <rect key={x} x={x} y="42" width="50" height="90" rx="8" fill="#30363a" />
      ))}
      <rect x={width / 2 - 100} y="25" width="200" height="24" rx="8" fill="#30363a" />
      {[1, 2, 3, 4].map((rib) => (
        <path key={rib} d={`M${(width * rib) / 5} 100v${height - 135}`} stroke="#727a7e" />
      ))}
      <path d={`M35 ${height - 25}h${width - 70}`} stroke="#727a7e" />
    </g>
  );
}
