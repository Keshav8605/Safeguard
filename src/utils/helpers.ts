export function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: Date | number, locale: string = 'en-US') {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.toLocaleString(locale)
}

