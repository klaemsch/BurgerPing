<script lang="ts">
	export let onclick;
	export let label;
</script>

<button
	on:click={onclick}
	class="font-sans text-base bg-indigo-500 hover:bg-indigo-700 active:bg-indigo-900 text-white py-2 px-4 rounded-md h-10"
>
	{label}
</button>
