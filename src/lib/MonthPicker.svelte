<script>
  import { MONTH_NAMES, MONTH_NAMES_FULL } from "./utils.js";

  /** @type {{ value: { year: number, month: number } | null, currentYear: number, currentMonth: number, onselect: (year: number, month: number) => void }} */
  let { value = null, currentYear, currentMonth, onselect } = $props();

  let displayYear = $state(value?.year ?? currentYear);

  const YEAR_RANGE = 10;
  let minYear = $derived(currentYear - YEAR_RANGE);
  let maxYear = $derived(currentYear + YEAR_RANGE);

  function prevYear() {
    if (displayYear > minYear) displayYear--;
  }

  function nextYear() {
    if (displayYear < maxYear) displayYear++;
  }

  function selectMonth(month) {
    onselect(displayYear, month);
  }

  function isSelected(month) {
    return value?.year === displayYear && value?.month === month;
  }

  function isCurrent(month) {
    return displayYear === currentYear && month === currentMonth;
  }

  function handleKeydown(e) {
    if (e.key === "ArrowLeft") {
      prevYear();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      nextYear();
      e.preventDefault();
    }
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
  class="nsi-picker-content"
  role="dialog"
  aria-label="Month picker"
  tabindex="-1"
  onkeydown={handleKeydown}
>
  <!-- Year Navigation -->
  <div class="nsi-nav">
    <button
      class="nsi-nav-btn"
      onclick={prevYear}
      disabled={displayYear <= minYear}
      aria-label="Previous year"
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
    <span class="nsi-nav-label">{displayYear}</span>
    <button
      class="nsi-nav-btn"
      onclick={nextYear}
      disabled={displayYear >= maxYear}
      aria-label="Next year"
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

  <!-- Month Grid -->
  <div class="nsi-grid nsi-grid-month" role="grid" aria-label="Months">
    {#each MONTH_NAMES as name, i}
      {@const month = i + 1}
      <button
        class="nsi-cell"
        class:nsi-selected={isSelected(month)}
        class:nsi-current={isCurrent(month)}
        onclick={() => selectMonth(month)}
        aria-label={MONTH_NAMES_FULL[i] + " " + displayYear}
        aria-selected={isSelected(month)}
        role="gridcell"
        type="button"
      >
        {name}
      </button>
    {/each}
  </div>
</div>
