<script lang="ts">
    import Barstool from "./Barstool.svelte";

    export let x: string;
    export let y: string;
</script>

<svg x={x} y={y}>
    <rect x=160 y=0 width=30 height=60 style="fill: tan;" />
    <rect x=0 y=30 width=190 height=30 style="fill: tan;"/>
    <Barstool x=10 y=60/>
    <Barstool x=40 y=60/>
    <Barstool x=70 y=60/>
    <Barstool x=100 y=60/>
    <Barstool x=130 y=60/>
    <Barstool x=160 y=60/>
</svg>