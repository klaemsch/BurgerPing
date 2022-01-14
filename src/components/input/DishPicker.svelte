<script lang="ts">
    import NumberInput from "./NumberInput.svelte";
    import Text from "../typography/Text.svelte";

    const dishes = ["LANsagne", "Cookies", "RAMen"];
    export let dishCount: number[] = [0, 0, 0];
    const label = "Anzahl";
</script>

<div class="flex flex-col gap-4">
    <label for={label} class="block text-sm font-medium text-gray-700 self-end"
        >{label}</label
    >
    {#each dishes as dish}
        <div class="flex justify-between w-full p-0 items-center">
            <Text>{dish}</Text>
            <NumberInput
                label=""
                bind:value={dishCount[dishes.indexOf(dish)]}
                min={0}
                placeholder="0"
            />
        </div>
    {/each}
</div>
