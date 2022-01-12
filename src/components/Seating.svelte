<script lang="ts">
    import { TABLE_SIZE } from "../constant";
    import TableDouble from "./furniture/Table.svelte";
    import Bar from "./furniture/Bar.svelte";

    // Does the svg align chairs on top and bottom of table? (false = horizontal = left and right)
    const SVG_IS_VERTICAL = true;
    
    enum Direction {
        HORIZONTAL, VERTICAL
    }
    // x, y, dir, disabled
    type TableConfig = [number, number, Direction, boolean?];

    const h = Direction.HORIZONTAL;
    const v = Direction.VERTICAL;
    const tableData: TableConfig[] = [
        // top line
        [2, 1, h],
        [5, 1, h],
        [8, 1, h],
        [11, 1, h],

        // left line
        [1, 4, v],
        [1, 7, v],
        [1, 10, v],
    ];

    type Point = {
        x: number;
        y: number;
    };
    type Dimension = {
        width: number;
        height: number;
    };

    interface Table {
        start: Point;
        span: Dimension;
        // Should svg be rotated 90 degrees?
        rotate: boolean;
        disabled: boolean;
    }

    const tables: Table[] = tableData.map(([x, y, dir, disabled]) => {
        const isVert = (dir === Direction.VERTICAL); 
        return {
            start: {
                x: isVert ? x : x - 1,
                y: isVert ? y - 1 : y,
            },
            span: {
                width: isVert ? 1 : 3,
                height: isVert ? 3 : 1,
            },
            rotate: SVG_IS_VERTICAL !== isVert,
            disabled,
        };
    });

    const computeGridProperties = (start: Point, span: Dimension) => `
        grid-column: ${start.x + 1} / span ${span.width};
        grid-row: ${start.y + 1} / span ${span.height};
    `;
</script>

<div class="flex-1 grid items-center p-3" id="grid-container" style="--cell-size: {TABLE_SIZE}px">
    {#each tables as table}
        <div class="flex justify-center" style={computeGridProperties(table.start, table.span)}>
            <div class:rotated={table.rotate}>
                <TableDouble />
            </div>
        </div>
    {/each}
</div>

<style>
    #grid-container {
        grid-template-columns: repeat(auto-fill, var(--cell-size));
        grid-template-rows: repeat(auto-fill, var(--cell-size));
    }

    .rotated {
        transform: rotate(90deg);
    }
</style>
