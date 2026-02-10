<script>
    import { getISOWeekData } from "./utils.js";

    /** @type {{ value: { year: number, week: number } | null, currentYear: number, currentWeek: number, onselect: (year: number, week: number) => void }} */
    let { value = null, currentYear, currentWeek, onselect } = $props();

    let displayYear = $state(value?.year ?? currentYear);
    let displayMonth = $state(new Date().getMonth()); // 0-indexed

    const YEAR_RANGE = 10;
    let minYear = $derived(currentYear - YEAR_RANGE);
    let maxYear = $derived(currentYear + YEAR_RANGE);

    const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];
    const MONTH_NAMES = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    /** Build calendar rows: each row = { week, isoYear, days[] }
     *  Each day = { day: number, overflow: boolean } */
    let calendarWeeks = $derived.by(() => {
        const firstDay = new Date(displayYear, displayMonth, 1);
        const lastDay = new Date(displayYear, displayMonth + 1, 0);
        const totalDays = lastDay.getDate();

        // Day of week for the 1st (0=Sun, 6=Sat)
        const startDow = firstDay.getDay();

        const allDays = [];

        // Leading overflow from previous month (use negative day trick)
        for (let i = startDow - 1; i >= 0; i--) {
            const d = new Date(displayYear, displayMonth, -i);
            allDays.push({ day: d.getDate(), overflow: true, date: d });
        }

        // Current month days
        for (let day = 1; day <= totalDays; day++) {
            const d = new Date(displayYear, displayMonth, day);
            allDays.push({ day, overflow: false, date: d });
        }

        // Trailing overflow from next month
        let nextDay = 1;
        while (allDays.length % 7 !== 0) {
            const d = new Date(displayYear, displayMonth + 1, nextDay);
            allDays.push({ day: nextDay++, overflow: true, date: d });
        }

        // Split into rows of 7 (Sun-Sat)
        // Use Monday (index 1) for ISO week since ISO weeks start on Monday
        const rows = [];
        for (let i = 0; i < allDays.length; i += 7) {
            const chunk = allDays.slice(i, i + 7);
            const mondayDate = chunk[1].date; // index 1 = Monday
            const { year: isoYear, week } = getISOWeekData(mondayDate);
            rows.push({ week, isoYear, days: chunk });
        }

        return rows;
    });

    function prevMonth() {
        if (displayMonth === 0) {
            if (displayYear > minYear) {
                displayYear--;
                displayMonth = 11;
            }
        } else {
            displayMonth--;
        }
    }

    function nextMonth() {
        if (displayMonth === 11) {
            if (displayYear < maxYear) {
                displayYear++;
                displayMonth = 0;
            }
        } else {
            displayMonth++;
        }
    }

    function selectWeek(isoYear, week) {
        onselect(isoYear, week);
    }

    function isSelected(isoYear, week) {
        return value?.year === isoYear && value?.week === week;
    }

    function isCurrent(isoYear, week) {
        return isoYear === currentYear && week === currentWeek;
    }

    function isToday(d) {
        if (!d || d.overflow) return false;
        const now = new Date();
        return (
            displayYear === now.getFullYear() &&
            displayMonth === now.getMonth() &&
            d.day === now.getDate()
        );
    }

    function handleKeydown(e) {
        if (e.key === "ArrowLeft") {
            prevMonth();
            e.preventDefault();
        } else if (e.key === "ArrowRight") {
            nextMonth();
            e.preventDefault();
        }
    }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
    class="nsi-picker-content nsi-picker-week-cal"
    role="dialog"
    aria-label="Week picker"
    tabindex="-1"
    onkeydown={handleKeydown}
>
    <!-- Month/Year Navigation -->
    <div class="nsi-nav">
        <button
            class="nsi-nav-btn"
            onclick={prevMonth}
            disabled={displayYear <= minYear && displayMonth === 0}
            aria-label="Previous month"
            type="button"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M10 12L6 8L10 4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </button>
        <span class="nsi-nav-label"
            >{MONTH_NAMES[displayMonth]} {displayYear}</span
        >
        <button
            class="nsi-nav-btn"
            onclick={nextMonth}
            disabled={displayYear >= maxYear && displayMonth === 11}
            aria-label="Next month"
            type="button"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </button>
    </div>

    <!-- Calendar -->
    <table class="nsi-cal" role="grid" aria-label="Calendar with weeks">
        <thead>
            <tr>
                <th class="nsi-cal-wk-header"></th>
                {#each DAY_HEADERS as dh}
                    <th class="nsi-cal-day-header">{dh}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each calendarWeeks as row}
                <tr
                    class="nsi-cal-row"
                    class:nsi-selected={isSelected(row.isoYear, row.week)}
                    class:nsi-current={isCurrent(row.isoYear, row.week)}
                >
                    <td class="nsi-cal-wk-num">
                        <button
                            class="nsi-cal-wk-btn"
                            onclick={() => selectWeek(row.isoYear, row.week)}
                            aria-label={"Week " +
                                row.week +
                                " of " +
                                row.isoYear}
                            type="button"
                        >
                            W{String(row.week).padStart(2, "0")}
                        </button>
                    </td>
                    {#each row.days as d}
                        <td
                            class="nsi-cal-day"
                            class:nsi-today={isToday(d)}
                            class:nsi-overflow={d.overflow}
                        >
                            <button
                                class="nsi-cal-day-btn"
                                onclick={() =>
                                    selectWeek(row.isoYear, row.week)}
                                tabindex="-1"
                                type="button"
                            >
                                {d.day}
                            </button>
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>
