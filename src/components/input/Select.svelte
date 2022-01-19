<script lang="ts">
    interface Option {
        value: string;
        text: string;
    }
    export let options: Option[] = [];
    export let selected: string = null;
</script>

<div class="flex items-center">
    <!--<label for="select" class="sr-only">{label}</label>-->
    <select
        id="select"
        name="select"
        class="font-sans focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 bg-transparent text-gray-500 text-sm border-gray-300 rounded-md cursor-pointer"
        bind:value={selected}
    >
        {#each options as option}
            <option value={option.value}>
                {option.text}
            </option>
        {/each}
    </select>
</div>
