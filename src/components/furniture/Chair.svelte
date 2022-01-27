<script lang="ts">
    import { CHAIR_WIDTH, CHAIR_HEIGHT } from "../../constant";

    export let x: number;
    export let y: number;
    export let highlighted: boolean = false;
    export let selected: boolean = false;
    export let disabled: boolean = false;
</script>

<rect
    width={CHAIR_WIDTH}
    height={CHAIR_HEIGHT}
    {x}
    {y}
    rx={2}
    ry={2}
    class="fill-orange-400 cursor-pointer"
    class:highlighted
    class:selected
    class:disabled
/>

<style>
    .highlighted, .selected {
        @apply fill-indigo-600;
    }

    .disabled {
        @apply fill-gray-400 cursor-not-allowed;
    }
</style>
