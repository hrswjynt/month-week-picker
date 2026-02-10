/**
 * Picker registry — maps input types to their Svelte picker components.
 * To add a new input type, import its component and add a single entry here.
 */
import MonthPicker from './MonthPicker.svelte';
import WeekPicker from './WeekPicker.svelte';

export const pickerRegistry = {
    month: MonthPicker,
    week: WeekPicker,
    // Future: just add new entries here
    // date: DatePicker,
    // time: TimePicker,
};
