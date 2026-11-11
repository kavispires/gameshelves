import { useNavigate } from 'react-router-dom';
import { isRecord } from 'utils/guards';

export function useBackNavigation(fallback: string) {
  const navigate = useNavigate();
  return () => {
    const state: unknown = window.history.state;
    if (isRecord(state) && typeof state.idx === 'number' && state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}
