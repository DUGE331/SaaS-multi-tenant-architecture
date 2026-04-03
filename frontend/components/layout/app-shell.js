import Link from 'next/link';
import { useRouter } from 'next/router';

import { branding } from '../../config/branding';
import { navigation } from '../../config/navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

export function AppShell({ currentNav = 'dashboard', title, description, session, onSignOut, children }) {
  const router = useRouter();
  const currentPath = router.asPath || router.pathname || '/';
  const activeHashItem = navigation.find((item) => item.href.includes('#') && currentPath.endsWith(item.href.split('#')[1] ? `#${item.href.split('#')[1]}` : ''));
  const activeNavKey =
    activeHashItem?.key ||
    navigation.find((item) => !item.href.includes('#') && item.href === router.pathname)?.key ||
    currentNav;

  return (
    <div className="app-page flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="border-b border-border px-5 py-5">
          <p className="text-[15px] font-semibold text-foreground">{branding.appName}</p>
          <p className="mt-1 text-[12px] text-muted">{branding.appTagline}</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                activeNavKey === item.key
                  ? 'bg-[#eef2ff] text-primary-700'
                  : 'text-muted-foreground hover:bg-subtle hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {session ? (
          <div className="border-t border-border p-4">
            <div className="space-y-1">
              <p className="text-[13px] font-medium text-foreground">{session.user.fullName}</p>
              <p className="text-[12px] text-muted">{session.user.email}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant="primary">{session.role}</Badge>
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex w-full max-w-app items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0 space-y-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{branding.appName}</p>
              <div>
                <h1 className="truncate text-[24px] font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
                {description ? <p className="text-[13px] leading-6 text-muted-foreground">{description}</p> : null}
              </div>
            </div>

            {session ? (
              <div className="hidden items-center gap-3 sm:flex">
                <Badge variant="default">{session.tenant.name}</Badge>
                <Badge variant="info">{session.role}</Badge>
              </div>
            ) : null}
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-app px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
