import { createGlobalState } from 'react-hooks-global-state';

type InitialState = {
  authenticated: boolean;
};

const initialState: InitialState = {
  authenticated: false,
};

const { useGlobalState, setGlobalState, getGlobalState } = createGlobalState(initialState);

export { setGlobalState, getGlobalState, useGlobalState };
