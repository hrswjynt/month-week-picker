/**
 * ISO-8601 week utilities and shared helpers for picker components.
 */

/** Returns the ISO week number and year for a given date. */
export function getISOWeekData(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    // Set to nearest Thursday (ISO weeks start on Monday)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
}

/** Returns the number of ISO weeks in a given year (52 or 53). */
export function getISOWeeksInYear(year) {
    // A year has 53 weeks if Jan 1 is Thursday, or Dec 31 is Thursday
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    return jan1.getDay() === 4 || dec31.getDay() === 4 ? 53 : 52;
}

/** Returns { year, week } for the current date. */
export function getCurrentISOWeek() {
    return getISOWeekData(new Date());
}

/** Parses "YYYY-MM" → { year, month } or null. */
export function parseMonthValue(str) {
    if (!str) return null;
    const match = str.match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    return { year: parseInt(match[1], 10), month: parseInt(match[2], 10) };
}

/** Parses "YYYY-Www" → { year, week } or null. */
export function parseWeekValue(str) {
    if (!str) return null;
    const match = str.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return null;
    return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) };
}

/** Sets an input's value and dispatches input + change events. */
export function dispatchInputEvents(element, value) {
    // Use native setter to bypass any framework wrappers
    const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
    )?.set;

    if (nativeSetter) {
        nativeSetter.call(element, value);
    } else {
        element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    // Update the display overlay with formatted text
    updateDisplayOverlay(element);
}

/**
 * Locale-aware week label templates.
 * {w} = translated word, {n} = week number, {y} = year.
 */
const WEEK_LOCALES = {
    // Western — "{word} {num}, {year}"
    en: { word: "Week", tpl: "{w} {n}, {y}" },
    id: { word: "Minggu", tpl: "{w} {n}, {y}" },
    de: { word: "Woche", tpl: "{w} {n}, {y}" },
    fr: { word: "Semaine", tpl: "{w} {n}, {y}" },
    es: { word: "Semana", tpl: "{w} {n}, {y}" },
    pt: { word: "Semana", tpl: "{w} {n}, {y}" },
    it: { word: "Settimana", tpl: "{w} {n}, {y}" },
    nl: { word: "Week", tpl: "{w} {n}, {y}" },
    pl: { word: "Tydzień", tpl: "{w} {n}, {y}" },
    tr: { word: "Hafta", tpl: "{w} {n}, {y}" },
    ru: { word: "Неделя", tpl: "{w} {n}, {y}" },

    // CJK — year first
    ja: { word: "週", tpl: "{y}年 第{n}{w}" },
    zh: { word: "周", tpl: "{y}年 第{n}{w}" },
    ko: { word: "주", tpl: "{y}년 제{n}{w}" },

    // RTL — Eastern Arabic numerals
    ar: { word: "أسبوع", tpl: "{w} {n}، {y}", nu: "arab" },
};

/** Formats a week number + year into a locale-aware label. */
function formatWeekLabel(week, year) {
    const lang = (navigator.language || 'en').slice(0, 2);
    const locale = WEEK_LOCALES[lang] || WEEK_LOCALES.en;
    const numOpts = { minimumIntegerDigits: 2 };
    const yearOpts = { useGrouping: false };
    if (locale.nu) {
        numOpts.numberingSystem = locale.nu;
        yearOpts.numberingSystem = locale.nu;
    }
    const numFmt = new Intl.NumberFormat(navigator.language || 'en', numOpts);
    const yearFmt = new Intl.NumberFormat(navigator.language || 'en', yearOpts);
    return locale.tpl
        .replace('{w}', locale.word)
        .replace('{n}', numFmt.format(week))
        .replace('{y}', yearFmt.format(year));
}

/**
 * Formats a raw input value into a human-readable, locale-aware string.
 * "2026-02" → "February 2026" (or localized equivalent)
 * "2026-W07" → "Week 07, 2026" (or localized equivalent)
 */
export function formatDisplayValue(type, rawValue) {
    if (!rawValue) return '';

    if (type === 'month') {
        const parsed = parseMonthValue(rawValue);
        if (!parsed) return rawValue;
        // Use Intl.DateTimeFormat for locale-aware month + year
        const date = new Date(parsed.year, parsed.month - 1, 1);
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'long',
        }).format(date);
    }

    if (type === 'week') {
        const parsed = parseWeekValue(rawValue);
        if (!parsed) return rawValue;
        return formatWeekLabel(parsed.week, parsed.year);
    }

    return rawValue;
}

/**
 * Creates or updates a display overlay on an input to show formatted text.
 * The raw ISO value stays in input.value for form submission.
 */
export function updateDisplayOverlay(input) {
    const type = input.getAttribute('type');
    const rawValue = input.value;
    const formatted = formatDisplayValue(type, rawValue);

    // Ensure overlay element exists
    let overlay = input.parentNode?.querySelector('.nsi-display-overlay');
    if (!overlay) {
        overlay = document.createElement('span');
        overlay.className = 'nsi-display-overlay';
        const cs = getComputedStyle(input);
        overlay.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            right: 28px;
            display: flex;
            align-items: center;
            pointer-events: none;
            padding-left: ${cs.paddingLeft || '8px'};
            font-family: ${cs.fontFamily};
            font-size: ${cs.fontSize};
            font-weight: ${cs.fontWeight};
            font-style: ${cs.fontStyle};
            letter-spacing: ${cs.letterSpacing};
            color: inherit;
            background: inherit;
            border-radius: inherit;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        `;
        input.parentNode.insertBefore(overlay, input.nextSibling);
    }

    if (formatted) {
        // Show formatted value
        overlay.textContent = formatted;
        overlay.style.color = 'inherit';
    } else {
        // Show placeholder if available, otherwise clear
        const placeholder = input.getAttribute('placeholder');
        if (placeholder) {
            overlay.textContent = placeholder;
            overlay.style.color = 'GrayText';
        } else {
            overlay.textContent = '';
        }
    }
}

/** Month names for display. */
export const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Full month names. */
export const MONTH_NAMES_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
