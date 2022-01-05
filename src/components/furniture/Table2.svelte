<script lang="ts">
    import Chair from "./Chair.svelte";

    export const long = "50";
    export const short = "30";
    export const table = "30";
    export let vertical = false;
    export let x: string | number;
    export let y: string | number;
</script>

<svg width={vertical ? short : long } height={vertical ? long : short} x={x} y={y}>
    <Chair x={vertical ? "5" : "0"} y={vertical ? "0" : "5"} vertical={!vertical} />
    <rect width={table} height={table} x={vertical ? "0" : "10"} y={vertical ? "10" : "0"} style="fill: tan;"/>
    <Chair x={vertical ? "5" : "40"} y={vertical ? "40" : "5"} vertical={!vertical} />
</svg>