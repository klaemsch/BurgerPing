<script lang="ts">
    import Table2 from "./furniture/Table2.svelte";
    import Table4 from "./furniture/Table4.svelte";
    import Bar from "./furniture/Bar.svelte";

    const cols = [[50, 4]];

    const plan = [
        { x: 0, y: 0, item: Table2 },
    ]

</script>

<div class="grid-container">
    {#each Array(16*16) as _, i}
        <div class="grid-item">{i}</div>
	{/each}
    <div class="item1"><Table2 x={0} y={0} /></div>
    <div class="item2"><Table2 x={0} y={0} /></div>
</div>

<style>
    .grid-container {
        display: grid;
        grid-template-columns: repeat(16, min-content);
        grid-template-rows: repeat(16, min-content);
        padding: 10px;
    }
    .grid-item {
        border: 1px dashed rgba(0, 0, 0, 0.8);
        margin: 1px;
        width: 50px;
        height: 50px;
        
    }
    .item2 {
        grid-column: 5 / span 1;
        grid-row: 5 / span 1;
        border: 1px dashed rgba(0, 0, 0, 0.8);
        margin: 1px;
        margin: 1px;
        width: 50px;
        height: 50px;
        padding-left: 10px;
        padding-right: 10px;
    }
    .item1 {
        grid-column: 5 / span 1;
        grid-row: 10 / span 1;
        border: 1px dashed rgba(0, 0, 0, 0.8);
        margin: 1px;
        margin: 1px;
        width: 50px;
        height: 50px;
        padding-left: 10px;
        padding-right: 10px;
    }
</style>
