import { Alert, Button, Result } from 'antd';
import { useLibrary } from 'hooks/useLibrary';
import { CircleAlert, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoadingPage } from './LoadingPage';

export function DataQueryWrapper({ children }: { children: ReactNode }) {
  const query = useLibrary();
  if (query.isPending) return <LoadingPage />;
  if (query.isError) {
    return (
      <Result
        icon={<CircleAlert size={64} className="text-error" />}
        status="500"
        title="Unable to load the library"
        subTitle={query.error.message}
        extra={
          <Button icon={<RefreshCw />} onClick={() => void query.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  return (
    <>
      {query.data.legacy && (
        <Alert
          showIcon
          type="info"
          title="Library migration pending"
          description={
            <span>
              Your existing library is read-only.{' '}
              <Link to="/settings">Import your complete BGG CSV in Settings</Link> to migrate it safely.
            </span>
          }
          className="m-4"
        />
      )}
      {children}
    </>
  );
}
