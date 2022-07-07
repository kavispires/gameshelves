import { useLocation } from 'react-router-dom';
import { CloudSyncOutlined, HomeOutlined, TableOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export function Menu() {
  const location = useLocation();
  const currentRoute = location.pathname;

  return (
    <nav className="header-menu">
      <Link className={clsx('header-menu-link', currentRoute === '/' && 'header-menu-link--active')} to={'/'}>
        <HomeOutlined /> Home
      </Link>

      <Link
        className={clsx('header-menu-link', currentRoute === '/shelves' && 'header-menu-link--active')}
        to={'/shelves'}
      >
        <TableOutlined /> Shelves
      </Link>

      <Link
        className={clsx('header-menu-link', currentRoute === '/sync' && 'header-menu-link--active')}
        to={'/sync'}
      >
        <CloudSyncOutlined /> Sync
      </Link>
    </nav>
  );
}
