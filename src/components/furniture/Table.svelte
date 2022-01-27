<script lang="ts">
    import { TABLE_SIZE, CHAIR_HEIGHT } from "../../constant";
    import Chair from "./Chair.svelte";

    export let highlighted: boolean = false;
    export let selected: boolean = false;
    export let disabled: boolean = false;
    export let tableID: number;
</script>

<svg width={TABLE_SIZE} height={TABLE_SIZE + 2 * CHAIR_HEIGHT} role="img" aria-label="Tisch {tableID}">
    <title>Tisch {tableID}</title>
    <desc>Tisch, bestehend aus 2 Stühlen und einem kleinen Tisch</desc>
    <Chair x={5} y={0} {highlighted} {selected} {disabled} />
    <rect
        width={TABLE_SIZE}
        height={TABLE_SIZE}
        x={0}
        y={10}
        rx={2}
        ry={2}
        class="fill-orange-300 cursor-pointer"
        class:highlighted
        class:selected
        class:disabled
    />
    <Chair x={5} y={40} {highlighted} {selected} {disabled}/>
</svg>

<style>
    .highlighted, .selected {
        @apply fill-indigo-300;
    }

    .selected {
        @apply fill-indigo-400;
    }

    .disabled {
        @apply fill-gray-300 cursor-not-allowed;
    }
</style>
