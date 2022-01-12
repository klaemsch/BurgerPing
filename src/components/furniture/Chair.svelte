<script lang="ts">
    import { CHAIR_WIDTH, CHAIR_HEIGHT } from "../../constant";

    export let x: number;
    export let y: number;
</script>

<rect
    width={CHAIR_WIDTH}
    height={CHAIR_HEIGHT}
    {x}
    {y}
    rx={2}
    ry={2}
    class="chair"
/>
