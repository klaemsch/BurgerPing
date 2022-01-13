<script lang="ts">
	export let onclick;
	export let label;
</script>

<button
	on:click={onclick}
	class="bg-indigo-500 hover:bg-indigo-700 active:bg-indigo-900 text-white font-bold py-2 px-4 rounded h-10"
>
	{label}
</button>
