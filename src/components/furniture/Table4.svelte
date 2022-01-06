<script lang="ts">
    import Table2 from "./Table2.svelte";

    export const long = 60;
    export const short = 50;
    export let x: number;
    export let y: number;
</script>

<svg {x} {y}>
    <Table2 x={0} y={0} />
    <Table2 x={30} y={0} />
</svg>
