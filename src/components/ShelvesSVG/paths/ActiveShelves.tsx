type ActiveShelvesProps = {
  active: ShelfId[];
};

export function ActiveShelves({ active }: ActiveShelvesProps) {
  return (
    <g className="shelf-active">
      <g className="ew-cl">
        {active.includes('ew-cl-0') && <path fill="#ee9781" d="M8.26 228.57h69.9v26.33H8.26z"></path>}
        {active.includes('ew-cl-1') && <path fill="#ee9781" d="M8.26 257.87h69.9v21.7H8.26z"></path>}
        {active.includes('ew-cl-2') && <path fill="#ee9781" d="M8.26 282.6h69.9v21.96H8.26z"></path>}
      </g>
      <g className="ew-cr">
        {active.includes('ew-cr-0') && <path fill="#ee9781" d="M156.79 228.57h69.9v26.33h-69.9z"></path>}
        {active.includes('ew-cr-1') && <path fill="#ee9781" d="M156.79 257.87h69.9v21.7h-69.9z"></path>}
        {active.includes('ew-cr-2') && <path fill="#ee9781" d="M156.79 282.6h69.9v21.96h-69.9z"></path>}
      </g>
      <g className="ew-dc">
        {active.includes('ew-dc-0') && <path fill="#ee9781" d="M82.24 231.58h69.9v16.45h-69.9z"></path>}
        {active.includes('ew-dc-1') && <path fill="#ee9781" d="M82.24 250.5h69.9v16.45h-69.9z"></path>}
        {active.includes('ew-dc-2') && <path fill="#ee9781" d="M82.24 269.23h69.9v16.45h-69.9z"></path>}
        {active.includes('ew-dc-3') && <path fill="#ee9781" d="M82.24 287.74h69.9v16.45h-69.9z"></path>}
      </g>

      <g className="ew-sl">
        {active.includes('ew-sl-0') && <path fill="#ee9781" d="M7.67 25.1h70.49v32.51H7.67z"></path>}
        {active.includes('ew-sl-1') && <path fill="#ee9781" d="M7.67 60.37h70.49v31.25H7.67z"></path>}
        {active.includes('ew-sl-2') && <path fill="#ee9781" d="M7.67 93.77h70.49v31.02H7.67z"></path>}
        {active.includes('ew-sl-3') && <path fill="#ee9781" d="M7.67 126.62h70.49v31.02H7.67z"></path>}
        {active.includes('ew-sl-4') && <path fill="#ee9781" d="M7.67 159.79h70.49v31.92H7.67z"></path>}
        {active.includes('ew-sl-5') && <path fill="#ee9781" d="M7.67 193.54h70.49v30.58H7.67z"></path>}
      </g>

      <g className="ew-sc">
        {active.includes('ew-sc-0') && <path fill="#ee9781" d="M81.94 25.1H152.43V57.61H81.94z"></path>}
        {active.includes('ew-sc-1') && <path fill="#ee9781" d="M81.94 60.37H152.43V91.62H81.94z"></path>}
        {active.includes('ew-sc-2') && (
          <path fill="#ee9781" d="M81.94 93.77H152.43V124.78999999999999H81.94z"></path>
        )}
        {active.includes('ew-sc-3') && (
          <path fill="#ee9781" d="M81.94 126.62H152.43V157.64000000000001H81.94z"></path>
        )}
        {active.includes('ew-sc-4') && (
          <path fill="#ee9781" d="M81.94 159.79H152.43V191.70999999999998H81.94z"></path>
        )}
        {active.includes('ew-sc-5') && <path fill="#ee9781" d="M81.94 193.54H152.43V224.12H81.94z"></path>}
      </g>

      <g className="ew-sr">
        {active.includes('ew-sr-0') && (
          <path fill="#ee9781" d="M156.24 25.1H226.73000000000002V57.61H156.24z"></path>
        )}
        {active.includes('ew-sr-1') && (
          <path fill="#ee9781" d="M156.24 60.37H226.73000000000002V91.62H156.24z"></path>
        )}
        {active.includes('ew-sr-2') && (
          <path fill="#ee9781" d="M156.24 93.77H226.73000000000002V124.78999999999999H156.24z"></path>
        )}
        {active.includes('ew-sr-3') && (
          <path fill="#ee9781" d="M156.24 126.62H226.73000000000002V157.64000000000001H156.24z"></path>
        )}
        {active.includes('ew-sr-4') && (
          <path fill="#ee9781" d="M156.24 159.79H226.73000000000002V191.70999999999998H156.24z"></path>
        )}
        {active.includes('ew-sr-5') && (
          <path fill="#ee9781" d="M156.24 193.54H226.73000000000002V224.12H156.24z"></path>
        )}
      </g>

      <g className="ww-sl">
        {active.includes('ww-sl-0') && (
          <path fill="#f7931e" d="M262 25.61h50.77v38.35H262zM316.82 25.61h51.19v38.35h-51.19z"></path>
        )}
        {active.includes('ww-sl-1') && (
          <path fill="#0f0" d="M262 66.52h50.77v35.98H262zM316.82 66.52h51.19v35.98h-51.19z"></path>
        )}
        {active.includes('ww-sl-2') && (
          <path fill="#0ff" d="M262 105.07h50.77v37.06H262zM316.82 105.07h51.19v37.06h-51.19z"></path>
        )}
        {active.includes('ww-sl-3') && <path fill="#00f" d="M262 144.66h50.77v36.59H262z"></path>}
        {active.includes('ww-sl-4') && <path fill="#1b1464" d="M262 183.48h106.01v44.94H262z"></path>}
        {active.includes('ww-sl-5') && <path fill="#00f" d="M316.82 144.66h51.19v36.59h-51.19z"></path>}
      </g>

      <g className="ww-cl">
        {active.includes('ww-cl-0') && (
          <path fill="#22b573" d="M262 234.69h50.77v23.11H262zM316.77 234.69h50.66v23.11h-50.66z"></path>
        )}
        {active.includes('ww-cl-0') && (
          <path fill="#29abe2" d="M262 260.02h50.77v21.31H262zM316.77 260.02h50.66v21.31h-50.66z"></path>
        )}
        {active.includes('ww-cl-0') && (
          <path fill="#ee9781" d="M262 283.63h50.77v21.31H262zM316.77 283.63h50.66v21.31h-50.66z"></path>
        )}
      </g>

      <g className="ww-dc">
        {active.includes('ww-dc-0') && <path fill="#2e3192" d="M372.38 273.14h68.97v31.61h-68.97z"></path>}
        {active.includes('ww-dc-1') && <path fill="#29abe2" d="M445.97 273.14h68.97v31.61h-68.97z"></path>}
        {active.includes('ww-dc-2') && <path fill="#ff0" d="M519.56 273.14h68.97v31.61h-68.97z"></path>}
        {active.includes('ww-dc-3') && <path fill="#006837" d="M593.13 273.14h68.97v31.61h-68.97z"></path>}
      </g>

      <g className="ww-sr">
        {active.includes('ww-sr-0') && (
          <path fill="#f7931e" d="M666.44 25.49h45.93v38.46h-45.93zM716.59 25.49h45.68v38.46h-45.68z"></path>
        )}
        {active.includes('ww-sr-1') && (
          <path fill="#2e3192" d="M666.44 66.41h45.93v36.29h-45.93zM716.59 66.41h45.68v36.29h-45.68z"></path>
        )}
        {active.includes('ww-sr-2') && (
          <path
            fill="#a67c52"
            d="M666.44 105.24h45.93v37.04h-45.93zM716.59 105.24h45.68v37.04h-45.68z"
          ></path>
        )}
        {active.includes('ww-sr-3') && <path fill="red" d="M666.44 144.81h45.93v36.43h-45.93z"></path>}
        {active.includes('ww-sr-4') && <path fill="#662d91" d="M666.44 183.51h95.83v45.05h-95.83z"></path>}
        {active.includes('ww-sr-5') && <path fill="#c69c6d" d="M716.59 144.81h45.68v36.43h-45.68z"></path>}
      </g>

      <g className="ww-cr">
        {active.includes('ww-cr-0') && <path fill="#2e3192" d="M666.34 234.69h96.02v23.03h-96.02z"></path>}
        {active.includes('ww-cr-1') && <path fill="#29abe2" d="M666.34 260.06h96.02v21.18h-96.02z"></path>}
        {active.includes('ww-cr-2') && <path fill="#00a99d" d="M666.34 283.57h96.02v21.18h-96.02z"></path>}
      </g>

      <g className="unshelved">
        {active.includes('unshelved') && (
          <path
            fill="#ee9781"
            d="M298.81 331.89L282.86 316l-4 4-7.22-28.56-13.21 3.35.47 1.85h-3.37v-7.63h-2.21v-7.62h-22.53v7.62h-5v7.63h-8.88v13.62h5.44v1.63h-1.71v7.62h-2.95v7.63h-2.33v13.62h53.41v-5.18l1.63 6.42 13.21-3.34-.9-3.58 6.47 6.47zm-32.37-4.82v-.75l.19.75z"
          ></path>
        )}
      </g>
    </g>
  );
}
