<script lang="ts">
    import Table2 from "./Table2.svelte";

    export const long = "60";
    export const short = "50";
    export let vertical = false;
    export let x: string | number;
    export let y: string | number;
</script>

<svg width={vertical ? long : short } height={vertical ? short : long} x={x} y={y}>
    <Table2 x=0 y=0 vertical={vertical}/>
    <Table2 x={vertical ? 30 : 0} y={vertical ? 0 : 30} vertical={vertical}/>
</svg>