<script lang="ts">

    import Title from "./typography/Title.svelte";

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

<div class="mt-1 relative rounded-md shadow-sm">
    <div type="button" class="font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300 cursor-pointer" on:click={collapse}>
        <Title>{label}</Title>
    </div>
</div>

<div class="content" bind:this={content} style={visible ? test : "display: none"}>
    <slot></slot>
</div>

<hr />

<style>
    .content {
        padding: 0 18px;
        overflow: hidden;
    }
</style>
