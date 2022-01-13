<script>
    export let bold = false;
</script>

<p class="font-sans {bold ? "font-bold" : ""}">
    <slot></slot>
</p>
