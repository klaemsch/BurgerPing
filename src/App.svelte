<script lang="ts">
	import GlobalStyle from "./Style.svelte";
	import Panel from "./components/Panel.svelte";
	import Header from "./components/Header.svelte";
	import SeatingPlan from "./components/Seating.svelte";

	let personCount = 1;
	let dishCount = 1;
	let selected: number[] = [];

	const handleSelection = (index: number) => {
		const i = selected.findIndex((s) => s === index);
		if(i > -1) {
			// Removes item from selected list if it has already been selected before
			selected = [...selected.slice(0, i), ...selected.slice(i + 1)];
			return;
		}
		// number of tables the visitor is allowed to select based on person count
		const tableCount = Math.ceil(personCount / 2);
		selected = [...selected.slice(selected.length+1-tableCount), index];
	}
</script>

<GlobalStyle />
<main class="flex flex-col h-screen">
	<Header />
	<div class="flex flex-row flex-1">
		<div class="flex flex-1 bg-gray-100 overflow-hidden">
			<SeatingPlan {selected} onSelected={handleSelection} />
		</div>
		<div class="flex flex-1"><Panel bind:personCount={personCount} bind:dishCount={dishCount} /></div>
	</div>
</main>
