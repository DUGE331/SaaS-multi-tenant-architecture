import { cn } from '../../utils/cn';

export function Textarea({ className, hasError = false, ...props }) {
  return (
    <textarea
      className={cn(
        'min-h-[120px] w-full rounded-md border bg-surface px-3 py-2 text-[14px] text-foreground shadow-sm outline-none transition-colors placeholder:text-muted focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/20',
        hasError ? 'border-error focus-visible:border-error focus-visible:ring-error/15' : 'border-border-strong',
        className
      )}
      {...props}
    />
  );
}
