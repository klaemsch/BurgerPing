<script lang="ts">
	export let onclick;
	export let label;
	export let disabled = false;
</script>

<button
	on:click={onclick}
	{disabled}
	class="font-sans text-base bg-indigo-500 hover:bg-indigo-700 active:bg-indigo-900 text-white py-2 px-4 rounded-md h-10 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
>
	{label}
</button>
