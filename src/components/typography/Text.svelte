<script lang="ts">
    export let extraStyle: boolean = false;
    const extra: string = "font-sans extra";
    export let bold = false;
</script>

<p class={extraStyle ? extra : `font-sans ${bold ? "font-bold" : ""}`}>
    <slot></slot>
</p>

<style>

    .extra {
        padding-right: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
    }

</style>