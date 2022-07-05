import { Menu as AntMenu } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { CloudSyncOutlined, HomeOutlined, TableOutlined } from '@ant-design/icons';

export function Menu() {
  const navigate = useNavigate();
  const location = useLocation();

  const items: MenuProps['items'] = [
    {
      label: 'Home',
      key: 'home',
      icon: <HomeOutlined />,
    },
    {
      label: 'Shelves',
      key: 'shelves',
      icon: <TableOutlined />,
    },
    {
      label: 'Sync',
      key: 'sync',
      icon: <CloudSyncOutlined />,
    },
  ];

  const onClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <AntMenu
      onClick={onClick}
      mode="horizontal"
      selectedKeys={[location.pathname.substring(1)]}
      items={items}
      theme="dark"
      className="header-menu"
    />
  );
}
