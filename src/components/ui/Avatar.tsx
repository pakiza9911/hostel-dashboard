import { cn, initials, avatarColor } from '../../lib/utils';

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full text-white font-semibold flex items-center justify-center shrink-0',
        avatarColor(name),
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
