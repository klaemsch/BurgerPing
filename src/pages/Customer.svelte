<script lang="ts">
    import Panel from "../components/Panel.svelte";
    import SeatingPlan from "../components/Seating.svelte";

    let personCount = 1;
    let dishCount = [0, 0, 0];
    let selected: number[] = [];
</script>

<div class="flex flex-row flex-1">
    <SeatingPlan bind:selected {personCount} />
    <Panel bind:personCount bind:dishCount selectionCount={selected.length} />
</div>
