import {
  CalendarOutlined,
  MenuOutlined,
  SearchOutlined,
  SettingOutlined,
  TableOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import clsx from 'clsx';
import { useState } from 'react';
import { matchPath, NavLink, useLocation } from 'react-router-dom';

const items = [
  { to: '/', label: 'Find Game', icon: <SearchOutlined /> },
  { to: '/game-night', label: 'Game Night', icon: <CalendarOutlined /> },
  { to: '/shelves', label: 'Shelves', icon: <TableOutlined /> },
  { to: '/friends', label: 'Friends', icon: <TeamOutlined /> },
  { to: '/settings', label: 'Settings', icon: <SettingOutlined /> },
];

export function Menu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const activeItem = items.find(({ to }) => matchPath({ path: to, end: to === '/' }, pathname));

  return (
    <nav aria-label="Main" className="flex h-full min-w-0 flex-1 items-center justify-end">
      <div className="hidden h-full items-center gap-6 lg:flex">
        {items.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'box-border inline-flex h-full items-center gap-2 whitespace-nowrap border-0 border-b-2 border-solid border-transparent px-1 text-sm leading-normal hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-paper',
                isActive ? 'border-b-paper text-paper' : 'text-slate-300',
              )
            }
          >
            <span aria-hidden="true">{icon}</span> {label}
          </NavLink>
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
              <NavLink to={to} end={to === '/'}>
                {label}
              </NavLink>
            ),
          })),
        }}
      >
        <Button
          type="text"
          htmlType="button"
          icon={<MenuOutlined aria-hidden="true" />}
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
