<script lang="ts">
    export const long = "20";
    export const short = "10";
    export let vertical = false;
    export let x: string;
    export let y: string;
</script>

<rect width={vertical ? short : long } height={vertical ? long : short} x={x} y={y} style="fill: saddlebrown;"/>
