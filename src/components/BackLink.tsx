import { useBackNavigation } from 'hooks/useBackNavigation';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackLink({ fallback, className }: { fallback: string; className?: string }) {
  const back = useBackNavigation(fallback);
  return (
    <Link
      to={fallback}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        back();
      }}
    >
      <span className="icon-label">
        <ArrowLeft /> Back
      </span>
    </Link>
  );
}
