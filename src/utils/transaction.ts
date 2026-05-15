import { addMonths, addYears, addWeeks } from 'date-fns';

export interface BaseTransaction {
  date: string;
  [key: string]: any;
}

export type RecurringFrequency = 'monthly' | 'yearly' | 'weekly' | 'custom';

export function buildInstallmentPayloads<T extends BaseTransaction>(
  base: T,
  count: number,
  startDate: Date
): T[] {
  const payloads: T[] = [];
  for (let i = 0; i < count; i++) {
    const installmentDate = addMonths(startDate, i);
    payloads.push({
      ...base,
      date: installmentDate.toISOString().split('T')[0],
      is_installment: true,
      installment_current: i + 1,
      installment_total: count,
    });
  }
  return payloads;
}

export function buildRecurringPayloads<T extends BaseTransaction>(
  base: T,
  frequency: RecurringFrequency,
  startDate: Date,
  count: number = 12
): T[] {
  const payloads: T[] = [];
  for (let i = 0; i < count; i++) {
    let nextDate: Date;
    switch(frequency) {
        case 'monthly': nextDate = addMonths(startDate, i); break;
        case 'yearly': nextDate = addYears(startDate, i); break;
        case 'weekly': nextDate = addWeeks(startDate, i); break;
        default: nextDate = startDate; 
    }
    payloads.push({
      ...base,
      date: nextDate.toISOString().split('T')[0],
      is_recurring: true,
    });
  }
  return payloads;
}
