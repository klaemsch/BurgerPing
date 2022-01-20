<script lang="ts">
    export let label: string = null;

    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    export let selectedTime = currentHour + ":" + currentMinute;
</script>

<div>
    {#if label}
        <label for="s" class="block text-sm font-medium text-gray-700"
            >{label}</label
        >
    {/if}
    <div class="mt-1 relative rounded-md shadow-sm">
        <input
            type="time"
            name="a"
            id="a"
            class="font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300"
            bind:value={selectedTime}
        />
    </div>
</div>
