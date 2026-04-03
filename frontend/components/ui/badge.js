import { cn } from '../../utils/cn';

const variants = {
  default: 'bg-subtle text-muted-foreground border-border',
  success: 'bg-[#f0fdf4] text-success border-[#bbf7d0]',
  info: 'bg-[#eff6ff] text-info border-[#bfdbfe]',
  warning: 'bg-[#fff7ed] text-warning border-[#fed7aa]',
  destructive: 'bg-[#fef2f2] text-error border-[#fecaca]',
  primary: 'bg-[#eef2ff] text-primary-700 border-[#c7d2fe]',
};

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
