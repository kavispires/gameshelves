import { Image, Layout } from 'antd';
import logo from 'assets/logo.svg';
import { Menu } from './Menu';

export function Header() {
  return (
    <Layout.Header className="header">
      <div className="header-logo">
        <Image src={logo} height={32} preview={false} /> <h1 className="header-logo-title">Game Shelves</h1>
      </div>

      <Menu />
    </Layout.Header>
  );
}
