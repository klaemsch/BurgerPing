<script lang="ts">
	import GlobalStyle from "./Style.svelte";
	import Panel from "./components/Panel.svelte";
	import Header from "./components/Header.svelte";
	import SeatingPlan from "./components/Seating.svelte";

	let personCount = 1;
	let dishCount = [0, 0, 0];
	let selected: number[] = [];

</script>

<GlobalStyle />
<main class="flex flex-col h-screen">
	<Header />
	<div class="flex flex-row flex-1">
		<SeatingPlan bind:selected {personCount} />
		<Panel bind:personCount bind:dishCount selectionCount={selected.length} />
	</div>
</main>
