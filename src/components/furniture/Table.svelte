<script lang="ts">
    import { TABLE_SIZE, CHAIR_HEIGHT } from "../../constant";
    import Chair from "./Chair.svelte";
</script>

<svg width={TABLE_SIZE} height={TABLE_SIZE + 2 * CHAIR_HEIGHT}>
    <Chair x={5} y={0} />
    <rect
        width={TABLE_SIZE}
        height={TABLE_SIZE}
        x={0}
        y={10}
        rx={2}
        ry={2}
        class="table"
    />
    <Chair x={5} y={40} />
</svg>
