<script lang="ts">
    export let colored: boolean = false;
</script>

<p class="block text-sm font-medium {colored ? 'text-indigo-500' : 'text-black'}">
    <slot />
</p>