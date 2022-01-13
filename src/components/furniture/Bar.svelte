<script lang="ts">
    import Barstool from "./Barstool.svelte";

    export let x: number;
    export let y: number;
</script>

<svg {x} {y} height=70 width=190>
    <Barstool x={10} y={60} />
    <Barstool x={40} y={60} />
    <Barstool x={70} y={60} />
    <Barstool x={100} y={60} />
    <Barstool x={130} y={60} />
    <Barstool x={160} y={60} />
    <rect x={160} y={0} width={30} height={60} class="fill-orange-300" />
    <rect x={0} y={30} width={190} height={30} class="fill-orange-300" />
</svg>
