/**
 * Creates an i18n adapter from a plain translations object.
 *
 * Usage:
 *   import de from '@orpham/seatcharts/locales/de.json';
 *   new SeatCharts(el, { i18n: createI18n(de) });
 */
export function createI18n(translations: Record<string, string>) {
    return {
        t: (key: string) => translations[key] ?? key,
    };
}
