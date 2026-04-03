import { branding } from '../../config/branding';
import { cn } from '../../utils/cn';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  asideTitle,
  asideBody,
  hideAside = false,
  compact = false,
}) {
  return (
    <main className={cn('auth-grid', hideAside && 'grid-cols-1')}>
      <section
        className={cn(
          'flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10',
          hideAside && 'min-h-screen py-12',
          compact && 'py-3 sm:py-4'
        )}
      >
        <div className={cn('w-full max-w-auth', hideAside && 'max-w-[440px]')}>
          <div className={cn('surface-card p-8 sm:p-10', compact && 'p-6 sm:p-7')}>
            <div className={cn('mb-8 space-y-3', compact && 'mb-5 space-y-2')}>
              <p className="eyebrow">{eyebrow || branding.appName}</p>
              <div className="space-y-2">
                <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
                {description ? <p className="text-[16px] leading-7 text-muted-foreground">{description}</p> : null}
              </div>
            </div>
            {children}
            {footer ? <div className={cn('mt-6 border-t border-border pt-5', compact && 'mt-4 pt-4')}>{footer}</div> : null}
          </div>
        </div>
      </section>

      {!hideAside ? (
        <aside className="hidden border-l border-border bg-subtle px-10 py-12 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-10">
            <div className="space-y-2">
              <p className="text-[14px] font-semibold text-foreground">{branding.appName}</p>
              <p className="text-[13px] leading-6 text-muted-foreground">{branding.appTagline}</p>
            </div>

            <div className="surface-card p-6">
              <div className="space-y-3">
                <p className="eyebrow">Workspace Access</p>
                <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-foreground">
                  {asideTitle || 'Structured access for modern client workspaces'}
                </h2>
                <p className="text-[14px] leading-7 text-muted-foreground">
                  {asideBody ||
                    'Tenant-aware authentication, role-based access, and invitation flows live in one restrained interface that can be adapted across SaaS niches.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-[12px] text-muted">
            <p>Professional B2B shell</p>
            <p>Configurable branding, layout, and module labels</p>
          </div>
        </aside>
      ) : null}
    </main>
  );
}
