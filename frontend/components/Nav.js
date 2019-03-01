import Link from 'next/link';

const Nav = () => (
  <div>
    <Link href="/">
      <a>Home</a>
    </Link>
    <Link href="/sell">
      <a>Sell you Items</a>
    </Link>
  </div>
);

export default Nav;
