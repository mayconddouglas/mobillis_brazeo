import { format, parse, set } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Parses a "yyyy-MM-dd" date string, assuming noon for localization consistency.
 */
export function parseDateLocal(dateStr: string): Date {
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return set(parsed, { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });
}

/**
 * Formats a Date object as a Portuguese date string.
 */
export function formatDatePtBR(date: Date, formatStr: string = 'dd/MM/yyyy'): string {
  return format(date, formatStr, { locale: ptBR });
}
