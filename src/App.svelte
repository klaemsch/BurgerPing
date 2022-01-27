<script lang="ts">
	import GlobalStyle from "./Style.svelte";
	import Header from "./components/Header.svelte";
	import Customer from "./pages/Customer.svelte";
	import Admin from "./pages/Admin.svelte";
</script>

<GlobalStyle />
<main class="flex flex-col h-screen">
	<Header />
	<Admin />
</main>
