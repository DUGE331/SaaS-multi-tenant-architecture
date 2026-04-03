import { cn } from '../../utils/cn';

const variants = {
  default: 'border-border bg-subtle text-foreground',
  error: 'border-[#fecaca] bg-[#fef2f2] text-error',
  warning: 'border-[#fed7aa] bg-[#fff7ed] text-warning',
  info: 'border-[#bfdbfe] bg-[#eff6ff] text-info',
  success: 'border-[#bbf7d0] bg-[#f0fdf4] text-success',
};

export function Alert({ className, variant = 'default', ...props }) {
  return <div className={cn('rounded-lg border px-4 py-3 text-[13px] leading-6 shadow-sm', variants[variant], className)} {...props} />;
}
