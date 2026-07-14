// India-first date display. Bare toLocaleDateString() rendered US-style
// "4/29/2026" on most devices — ambiguous for an India/UAE audience.
// "29 Apr 2026" is unambiguous in every market we serve.
export function formatDate(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
