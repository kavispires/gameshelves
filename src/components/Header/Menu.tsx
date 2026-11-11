import { Button, Dropdown } from 'antd';
import clsx from 'clsx';
import { CalendarDays, Menu as MenuIcon, Search, Settings, Table2, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

const items = [
  { to: '/', label: 'Find Game', icon: <Search /> },
  { to: '/game-night', label: 'Game Night', icon: <CalendarDays /> },
  { to: '/shelves', label: 'Shelves', icon: <Table2 /> },
  { to: '/friends', label: 'Friends', icon: <Users /> },
  { to: '/settings', label: 'Settings', icon: <Settings /> },
];

export function Menu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const navigationPath = pathname.startsWith('/games/')
    ? '/'
    : pathname.startsWith('/boxes/')
      ? '/shelves'
      : pathname;
  const activeItem = items.find(({ to }) => matchPath({ path: to, end: to === '/' }, navigationPath));

  return (
    <nav aria-label="Main" className="flex h-full min-w-0 flex-1 items-center justify-end">
      <div className="hidden h-full items-center gap-6 lg:flex">
        {items.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            aria-current={activeItem?.to === to ? 'page' : undefined}
            className={clsx(
              'box-border inline-flex h-full items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid border-transparent px-1 text-sm leading-normal hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-paper',
              activeItem?.to === to ? 'border-b-paper text-paper' : 'text-slate-300',
            )}
          >
            <span aria-hidden="true">{icon}</span> {label}
          </Link>
        ))}
      </div>
      <Dropdown
        open={open}
        onOpenChange={setOpen}
        trigger={['click']}
        placement="bottomRight"
        menu={{
          selectedKeys: activeItem ? [activeItem.to] : [],
          onClick: () => setOpen(false),
          items: items.map(({ to, label, icon }) => ({
            key: to,
            icon: <span aria-hidden="true">{icon}</span>,
            label: (
              <Link to={to} aria-current={activeItem?.to === to ? 'page' : undefined}>
                {label}
              </Link>
            ),
          })),
        }}
      >
        <Button
          type="text"
          htmlType="button"
          icon={<MenuIcon />}
          aria-label="Open navigation"
          aria-haspopup="menu"
          aria-expanded={open}
          className="h-10 text-paper hover:text-white focus-visible:outline-2 focus-visible:outline-paper lg:hidden"
        >
          Menu
        </Button>
      </Dropdown>
    </nav>
  );
}
