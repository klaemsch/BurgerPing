<script lang="ts">
    export let label: string = null;
    export let date: Date;
</script>

<div class="flex flex-col">
    <div class="mt-1 relative rounded-md shadow-sm">
        {#if label}
            <label id="dateLabel" for={label} class="block text-sm font-medium text-gray-700">
                {label}
            </label>
        {/if}
        <input
            type="date"
            value={date.toISOString().slice(0, 10)}
            name={label}
            id={label}
            aria-labelledby="dateLabel"
            class="font-sans focus:ring-indigo-600 focus:border-indigo-600 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300 cursor-pointer"
        />
    </div>
</div>
