import { cn } from '../../utils/cn';

const variants = {
  default:
    'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500 disabled:bg-primary-500/70',
  secondary:
    'border border-border-strong bg-surface text-foreground hover:bg-subtle focus-visible:ring-primary-500 disabled:text-muted',
  ghost:
    'bg-transparent text-muted-foreground hover:bg-subtle hover:text-foreground focus-visible:ring-primary-500',
  destructive:
    'bg-error text-white hover:bg-[#b91c1c] focus-visible:ring-error disabled:bg-error/70',
};

const sizes = {
  default: 'h-10 px-4 py-2 text-[14px]',
  sm: 'h-9 px-3 py-2 text-[13px]',
  icon: 'h-10 w-10 justify-center p-0',
};

export function Button({
  as: Component = 'button',
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}) {
  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      type={Component === 'button' ? type : undefined}
      {...props}
    />
  );
}
