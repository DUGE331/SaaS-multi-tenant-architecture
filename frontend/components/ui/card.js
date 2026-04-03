import { cn } from '../../utils/cn';

export function Card({ className, ...props }) {
  return <div className={cn('surface-card', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('space-y-1.5 p-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-[18px] font-semibold tracking-[-0.01em] text-foreground', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-[13px] leading-6 text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}
