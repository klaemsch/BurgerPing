<script lang="ts">
    import Select from "./Select.svelte";

    export let label: string = null;

    const dishes = ['-', 'LANsagne', 'Cookies', 'RAMen'];
    let dish: string = '-';
</script>

<div>
    {#if label}
        <label for="s" class="block text-sm font-medium text-gray-700">{label}</label>
    {/if}
    <div class="mt-1 flex justify-left" id="s">
        <Select options={dishes.map((dish) => ({ text: dish, value: dish }))} bind:selected={dish} />
    </div>
</div>