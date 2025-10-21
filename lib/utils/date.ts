import { format, formatDistanceToNow, isPast, isFuture, differenceInDays } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import type { Locale } from '@/types';

const localeMap = {
  'he-IL': he,
  'en-US': enUS,
};

export function formatDate(date: Date, locale: Locale = 'he-IL'): string {
  return format(date, 'PPP', { locale: localeMap[locale] });
}

export function formatDateTime(date: Date, locale: Locale = 'he-IL'): string {
  return format(date, 'PPP p', { locale: localeMap[locale] });
}

export function formatRelativeTime(date: Date, locale: Locale = 'he-IL'): string {
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: localeMap[locale],
  });
}

export function canOpenMessage(openDate: Date): boolean {
  return isPast(openDate) || openDate.getTime() === new Date().getTime();
}

export function daysUntil(date: Date): number {
  return differenceInDays(date, new Date());
}

export function isMessageReady(openDate: Date): boolean {
  return canOpenMessage(openDate);
}

export function getTimeStatus(openDate: Date): 'past' | 'today' | 'future' {
  const today = new Date();
  const days = differenceInDays(openDate, today);

  if (days < 0) return 'past';
  if (days === 0) return 'today';
  return 'future';
}
