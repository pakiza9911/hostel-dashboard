import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('en-PK', opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function avatarColor(seed: string): string {
  const colors = [
    'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500',
    'bg-violet-500', 'bg-fuchsia-500', 'bg-lime-500', 'bg-cyan-500',
    'bg-orange-500', 'bg-indigo-500',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return colors[Math.abs(h) % colors.length];
}
