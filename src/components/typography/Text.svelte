<script lang="ts">
    export let extraStyle: boolean = false;
    const extra: string = "font-sans extra";
</script>

<p class={extraStyle ? extra : "font-sans"}>
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