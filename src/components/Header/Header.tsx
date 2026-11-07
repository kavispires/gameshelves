import { Layout } from 'antd';
import logo from 'assets/logo.svg';
import { Link } from 'react-router-dom';
import { Menu } from './Menu';

export function Header() {
  return (
    <Layout.Header className="box-border flex h-14 shrink-0 items-center gap-4 bg-ink px-4 leading-normal sm:px-6">
      <Link
        to="/"
        aria-label="Game Shelves home"
        className="inline-flex shrink-0 items-center gap-2 text-paper hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        <img src={logo} alt="" aria-hidden="true" width={28} height={28} className="block h-7 w-7" />
        <span className="whitespace-nowrap text-base font-semibold sm:text-lg">Game Shelves</span>
      </Link>
      <Menu />
    </Layout.Header>
  );
}
