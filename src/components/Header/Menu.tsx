import { CloudSyncOutlined, HomeOutlined, TableOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';

export function Menu() {
  const location = useLocation();
  const currentRoute = location.pathname;
  const linkClass = 'ml-8 border-3 border-solid border-transparent py-4 text-muted hover:text-paper';

  return (
    <nav className="w-full text-right">
      <Link className={clsx(linkClass, currentRoute === '/' && 'border-b-paper')} to={'/'}>
        <HomeOutlined /> Home
      </Link>

      <Link
        className={clsx(linkClass, currentRoute.startsWith('/shelves') && 'border-b-paper')}
        to={'/shelves'}
      >
        <TableOutlined /> Shelves
      </Link>

      <Link className={clsx(linkClass, currentRoute === '/sync' && 'border-b-paper')} to={'/sync'}>
        <CloudSyncOutlined /> Sync
      </Link>
    </nav>
  );
}
