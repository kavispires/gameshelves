import { useLocation } from 'react-router-dom';
import { CloudSyncOutlined, HomeOutlined, TableOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export function Menu() {
  const location = useLocation();
  const currentRoute = location.pathname;
  console.log(currentRoute);

  return (
    <nav className="header-menu">
      <Link
        className={clsx('header-menu__link', currentRoute === '/' && 'header-menu__link--active')}
        to={'/'}
      >
        <HomeOutlined /> Home
      </Link>

      <Link
        className={clsx(
          'header-menu__link',
          currentRoute.startsWith('/shelves') && 'header-menu__link--active'
        )}
        to={'/shelves'}
      >
        <TableOutlined /> Shelves
      </Link>

      <Link
        className={clsx('header-menu__link', currentRoute === '/sync' && 'header-menu__link--active')}
        to={'/sync'}
      >
        <CloudSyncOutlined /> Sync
      </Link>
    </nav>
  );
}
