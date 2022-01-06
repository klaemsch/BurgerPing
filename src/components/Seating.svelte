<script lang="ts">
    import ZoomSvg from "@svelte-parts/zoom/svg";
    import Table2 from "./furniture/Table2.svelte";
    import Table4 from "./furniture/Table4.svelte";
    import Bar from "./furniture/Bar.svelte";
</script>

<ZoomSvg viewBox="0 0 200 150">
    <Table2 x={0} y={0} />
    <Table4 x={0} y={50} />
    <Bar x={100} y={50} />
</ZoomSvg>
