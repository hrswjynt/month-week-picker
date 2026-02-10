<script>
    import {
        dispatchInputEvents,
        parseMonthValue,
        parseWeekValue,
        getCurrentISOWeek,
    } from "./utils.js";

    let { inputElement, pickerComponent: PickerComponent, onclose } = $props();

    const inputType = inputElement.getAttribute("type");

    // Parse existing value
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { week: currentWeek } = getCurrentISOWeek();

    let initialValue = $derived.by(() => {
        const raw = inputElement.value;
        if (inputType === "month") return parseMonthValue(raw);
        if (inputType === "week") return parseWeekValue(raw);
        return null;
    });

    // Positioning state
    let popupEl = $state(null);
    let pos = $state({ top: 0, left: 0 });

    $effect(() => {
        if (!popupEl) return;
        const rect = inputElement.getBoundingClientRect();
        const popupRect = popupEl.getBoundingClientRect();

        let top = rect.bottom + 4;
        let left = rect.left;

        // Flip above if not enough space below
        if (top + popupRect.height > window.innerHeight) {
            top = rect.top - popupRect.height - 4;
        }

        // Clamp horizontal
        if (left + popupRect.width > window.innerWidth) {
            left = window.innerWidth - popupRect.width - 8;
        }
        if (left < 8) left = 8;

        pos = { top, left };
    });

    // Click outside detection — uses composedPath to handle Shadow DOM
    function handlePointerDown(e) {
        if (!popupEl) return;
        const path = e.composedPath();
        // If the click path includes our popup or the target input, don't close
        if (path.includes(popupEl) || path.includes(inputElement)) return;
        // Also check if the click is inside the shadow host
        const root = popupEl.getRootNode();
        if (root.host && path.includes(root.host)) return;
        onclose();
    }

    // Escape key
    function handleKeydown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onclose();
        }
    }

    $effect(() => {
        document.addEventListener("pointerdown", handlePointerDown, true);
        document.addEventListener("keydown", handleKeydown, true);

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown,
                true,
            );
            document.removeEventListener("keydown", handleKeydown, true);
        };
    });

    // Focus the popup when mounted
    $effect(() => {
        if (popupEl) {
            const first = popupEl.querySelector("button");
            if (first) first.focus();
        }
    });

    function handleSelect(year, value) {
        let formatted;
        if (inputType === "month") {
            formatted = `${year}-${String(value).padStart(2, "0")}`;
        } else if (inputType === "week") {
            formatted = `${year}-W${String(value).padStart(2, "0")}`;
        }
        if (formatted) {
            dispatchInputEvents(inputElement, formatted);
        }
        onclose();
    }

    function handleClear() {
        dispatchInputEvents(inputElement, "");
        onclose();
    }

    function handleToday() {
        if (inputType === "month") {
            handleSelect(currentYear, currentMonth);
        } else if (inputType === "week") {
            handleSelect(currentYear, currentWeek);
        }
    }

    const todayLabel = inputType === "month" ? "This month" : "This week";
</script>

<div
    class="nsi-host"
    bind:this={popupEl}
    style="position: fixed; top: {pos.top}px; left: {pos.left}px; z-index: 2147483647;"
    role="dialog"
    aria-modal="true"
>
    <div class="nsi-picker">
        {#if inputType === "month"}
            <PickerComponent
                value={initialValue}
                {currentYear}
                {currentMonth}
                onselect={handleSelect}
            />
        {:else if inputType === "week"}
            <PickerComponent
                value={initialValue}
                {currentYear}
                {currentWeek}
                onselect={handleSelect}
            />
        {/if}

        <div class="nsi-picker-footer">
            <button
                type="button"
                class="nsi-footer-btn nsi-footer-clear"
                onclick={handleClear}>Clear</button
            >
            <button
                type="button"
                class="nsi-footer-btn nsi-footer-today"
                onclick={handleToday}>{todayLabel}</button
            >
        </div>
    </div>
</div>
