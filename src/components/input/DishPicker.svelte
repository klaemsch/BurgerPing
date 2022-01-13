<script lang="ts">
    import NumberInput from "./NumberInput.svelte";
    import Text from "../typography/Text.svelte";

    const dishes = ['LANsagne', 'Cookies', 'RAMen'];
    export let dishCount: number[] = [0, 0, 0];
    const label = "Anzahl";

</script>

<div>
    <label for={label} class="block text-sm font-medium text-gray-700 center">{label}</label>
    {#each dishes as dish}
    <div class="space-between">
        <Text extraStyle>{dish}</Text>
        <NumberInput
                label=""
                bind:value={dishCount[dishes.indexOf(dish)]}
                min={0}
                placeholder="0"
            />
    </div>    
    {/each}
</div>

<style>

.space-between {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0;
}

.center {
    display: flex;
    justify-content: center;
}

</style>