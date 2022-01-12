<script lang="ts">
    import { TABLE_SIZE, CHAIR_HEIGHT } from "../../constant";
    import Chair from "./Chair.svelte";

    export let highlighted: boolean = false;
    export let selected: boolean = false;
    export let disabled: boolean = false;
</script>

<svg width={TABLE_SIZE} height={TABLE_SIZE + 2 * CHAIR_HEIGHT}>
    <Chair x={5} y={0} {highlighted} {disabled} />
    <rect
        width={TABLE_SIZE}
        height={TABLE_SIZE}
        x={0}
        y={10}
        rx={2}
        ry={2}
        class="table"
        class:highlighted
        class:selected
        class:disabled
    />
    <Chair x={5} y={40} {highlighted} {disabled}/>
</svg>

<style>
    .highlighted {
        @apply fill-indigo-300 cursor-pointer;
    }

    .selected {
        @apply fill-red-500;
    }

    .disabled {
        @apply fill-gray-300 cursor-not-allowed;
    }
</style>
