<script lang="ts">
	import GlobalStyle from './Style.svelte';
	export let name: string;
</script>

<GlobalStyle />
<main class="text-center">
	<h1>Hello {name}!</h1>
	<p class="font-bold">Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
</main>