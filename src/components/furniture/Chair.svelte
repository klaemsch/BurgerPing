<script lang="ts">
    import { CHAIR_WIDTH, CHAIR_HEIGHT } from "../../constant";

    export let x: number;
    export let y: number;
    export let highlighted: boolean = false;
    export let disabled: boolean = false;
</script>

<rect
    width={CHAIR_WIDTH}
    height={CHAIR_HEIGHT}
    {x}
    {y}
    rx={2}
    ry={2}
    class="chair"
    class:highlighted
    class:disabled
/>

<style>
    .highlighted {
        @apply fill-indigo-500 cursor-pointer;
    }

    .disabled {
        @apply fill-gray-400 cursor-not-allowed;
    }
</style>
