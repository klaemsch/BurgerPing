<script lang="ts">
    import Select from "./Select.svelte";

    export let label: string = null;

    const hours = [
        "00",
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
    ];

    const minutes = ["00", "15", "30", "45"];

    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
</script>

<div>
    {#if label}
        <label for="s" class="block text-sm font-medium text-gray-700"
            >{label}</label
        >
    {/if}
    <div class="mt-1 flex justify-left" id="s">
        <Select options={hours.map((hour) => ({ text: hour, value: hour }))} selected={hours[currentHour]} />
        <span class="m-2">:</span>
        <Select
            options={minutes.map((minute) => ({ text: minute, value: minute }))}
        />
    </div>
</div>
