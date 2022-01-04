<script lang="ts">
	import GlobalStyle from "./Style.svelte";
	import Text from "./components/typography/Text.svelte";
	import Panel from "./components/Panel.svelte";
	import Header from "./components/Header.svelte";
</script>

<GlobalStyle />
<main class="flex flex-col h-screen">
	<Header />
	<div class="flex flex-row">
		<div class="flex flex-1 bg-red-200"><Text>Sitzplätze</Text></div>
		<div class="flex flex-1"><Panel /></div>
	</div>
</main>
