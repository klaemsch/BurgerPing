<script lang="ts">
    export let bold = false;
    export let extra: string = "";
</script>

<p class="font-sans {bold ? "font-bold" : ""} {extra}">
    <slot></slot>
</p>