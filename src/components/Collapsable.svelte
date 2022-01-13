<script lang="ts">

    import Text from "./typography/Text.svelte";

    // button label
    export let label: string;

    // start visibility
    export let visible: boolean = false;

    // function, gets called when the collapse button is clicked
    export let clickCallback: Function;

    // index, in case of using multiple Collapsables
    export let index: number = 0;

    let content;
    let test = "display: block"

    function collapse() {
        this.classList.toggle("active");
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
        clickCallback(index);
    }

</script>

<div class="flex flex-row rounded-md placeholder-gray-300 cursor-pointer hover:text-gray-500 justify-between items-center px-5" on:click={collapse}>
    <Text bold>
        {label}
    </Text>
    <svg width="16" height="16" style="transform: scale(200%);">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
    </svg>
</div>

<div class="content" bind:this={content} style={visible ? test : "display: none"}>
    <slot></slot>
</div>

<hr />

<style>
    .content {
        padding: 0 30px;
        overflow: hidden;
    }
</style>
