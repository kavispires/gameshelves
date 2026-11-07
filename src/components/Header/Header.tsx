import { Image, Layout } from 'antd';
import logo from 'assets/logo.svg';
import { Menu } from './Menu';

export function Header() {
  return (
    <Layout.Header className="grid grid-cols-2 bg-ink">
      <div className="inline-flex">
        <Image src={logo} alt="Game Shelves" height={32} preview={false} className="w-8" />{' '}
        <h1 className="ml-4 text-white">Game Shelves</h1>
      </div>

      <Menu />
    </Layout.Header>
  );
}
