import { shelfRegions, TV_SHELF_DIMENSIONS } from '../shelfRegions';

export function TvShelf() {
  const { width, height } = TV_SHELF_DIMENSIONS;
  return (
    <g stroke="#787878" strokeWidth="2">
      <path fill="#d0d5d4" d={`M35 42h${width - 70}v${height - 75}H35z`} />
      <path fill="#e4e4e3" d={`M0 12L35 0h${width - 70}l35 12v23H0z`} />
      <path fill="#dbdbda" d={`M0 35h${width}v18H0z`} />
      <path fill="#dbdbda" d={`M20 780h${width - 40}v${height - 780}H20z`} />
      {[121.6, 751.6].map((x) => (
        <g key={x}>
          <rect x={x} y="65" width="600" height="160" fill="#bac4c1" />
          <path fill="#e9e8e8" d={`M${x - 12} 225h624v20h-624z`} />
        </g>
      ))}
      {shelfRegions.tv.map((region) => (
        <path key={region.id} d={region.path} fill="#e6efee" />
      ))}
      <path fill="#e9e8e8" d="M721.6 53h30v727h-30z" />
      {[121.6, 751.6].map((x) => (
        <path key={x} fill="#dbdbda" d={`M${x} 425h600v18h-600z`} />
      ))}
    </g>
  );
}

export function TvShelfDoors() {
  return (
    <g fill="none" stroke="#e4e4e3" strokeWidth="13" pointerEvents="none">
      {[121.6, 751.6].map((x) => (
        <g key={x}>
          {[0, 300].map((offset) => (
            <g key={offset}>
              <rect x={x + offset} y="245" width="300" height="508" />
              <path
                strokeWidth="7"
                d={`M${x + offset + 40} 245v508m220-508v508M${x + offset} 340h300m-300 180h300m-300 130h300`}
              />
            </g>
          ))}
          <path stroke="#303b39" strokeWidth="7" strokeLinecap="round" d={`M${x + 282} 460v80m36-80v80`} />
        </g>
      ))}
    </g>
  );
}
