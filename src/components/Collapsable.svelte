<script lang="ts">
    import Text from "./typography/Text.svelte";
    import Label from "./typography/Label.svelte";
    import Plus from "./icons/Plus.svelte";
    import Minus from "./icons/Minus.svelte";
    import Check from "./icons/Check.svelte";

    // button label
    export let label: string;
    export let optional = false;

    // start visibility
    export let visible: boolean = false;

    export let valid: boolean = false;

    // function, gets called when the collapse button is clicked
    export let clickCallback: Function;

    // index, in case of using multiple Collapsables
    export let index: number = 0;

    function collapse() {
        clickCallback(index);
    }
</script>

<div
    class="flex flex-row rounded-md placeholder-gray-300 cursor-pointer justify-between items-center px-5 select-none"
    on:focus={collapse}
    role="button"
    tabindex="0"
>
    <div class="flex flex-row gap-3 items-center">
        <Text bold extra="hover:underline">
            {label}
        </Text>
        {#if optional}
            <Label>Optional</Label>
        {/if}
    </div>
    {#if !visible}
        {#if valid}
            <Check />
        {:else}
            <Plus title="{label} ausklappen" desc="Bereich ausklappen und Informationen anzeigen"/>
        {/if}
    {:else}
        <Minus title="{label} einklappen" desc="Bereich einklappen und Informationen verbergen"/>
    {/if}
</div>

<div class="px-8 py-2" style={visible ? "display: block" : "display: none"}>
    <slot />
</div>

<hr />
