<script lang="ts">
    import Chair from "./Chair.svelte";

    export const long = 50;
    export const short = 30;
    export const table = 30;
    export let x: number;
    export let y: number;
</script>

<svg {x} {y}>
    <Chair x={5} y={0} />
    <rect width={table} height={table} x={0} y={10} rx={2} ry={2} class="table" />
    <Chair x={5} y={40} />
</svg>
