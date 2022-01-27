<script lang="ts">
	import GlobalStyle from "./Style.svelte";
	import Header from "./components/Header.svelte";
	import { Router, Link, Route } from "svelte-routing";
	import Customer from "./pages/Customer.svelte";
	import Admin from "./pages/Admin.svelte";
</script>

<GlobalStyle />
<main class="flex flex-col h-screen">
	<Header />
	<Router>
		<Route path="/" component={Customer} />
		<Route path="/admin" component={Admin} />
	</Router>
</main>
