<script lang="ts">
    export let label: string = null;

    const today = new Date().toISOString().slice(0, 10);

</script>

<div class="flex flex-col">
    {#if label}
        <label for="{label}" class="block text-sm font-medium text-gray-700"
            >{label}</label
        >
    {/if}
    <div class="mt-1 relative rounded-md shadow-sm">
        <input type="date" value={today} id="label" class="font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300"/>
    </div>
</div>
