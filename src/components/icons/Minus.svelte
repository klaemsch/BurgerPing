<script lang="ts">
    export let title: string;
    export let desc: string;
</script>

<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    role="img"
    aria-label="{title}: {desc}"
>
    <title>{title}</title>
    <desc>{desc}</desc>
    <path fill="#6563ff" d="M19,11H5a1,1,0,0,0,0,2H19a1,1,0,0,0,0-2Z" />
</svg>
