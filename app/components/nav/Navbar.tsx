'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const path = pathname === '/' ? '~' : `~${pathname}`;
  return (
    <nav className="nav-terminal">
      <div className="nav-terminal__left">
        <div className="nav-terminal__dots">
          <span /><span /><span />
        </div>
        <Link href="/" className="nav-terminal__brand">
          Commit<span className="accent">Car</span>
        </Link>
        <span className="nav-terminal__path">{path}</span>
      </div>
      <div className="nav-terminal__links">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
        <Link href="/commitcar" className={pathname?.startsWith('/commitcar') ? 'active' : ''}>
          Hall of Commit
        </Link>
      </div>
    </nav>
  );
}
