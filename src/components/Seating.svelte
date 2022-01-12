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

    const lineV = (start: Point, count: number, direction: Direction = h): TableConfig[] => {
        const factor = direction === v ? 3 : 1;
        return Array(count).fill(0).map((_, i) => [start.x, start.y + i * factor, direction]);
    }

    const lineH = (start: Point, count: number, direction: Direction = v): TableConfig[] => {
        const factor = direction === v ? 1 : 3;
        return Array(count).fill(0).map((_, i) => [start.x + i * factor, start.y, direction]);
    }

    // Creates two vertically aligned double tables with spacing in between.
    const doubleWithSpace = (start: Point, direction: Direction): TableConfig[] => {
        const isVert = direction === v;
        const line = isVert ? lineV : lineH;
        return [
            ...line(start, 2),
            ...line({ x: start.x + (isVert ? 0 : 4), y: start.y + (isVert ? 4 : 0) }, 2)
        ]
    }

    const tableData: TableConfig[] = [
        // === Inside ===

        // top line
        ...lineH({ x: 2, y: 1}, 4, h),

        // left line
        ...lineV({ x: 1, y: 4}, 3, v),

        // middle top line
        ...doubleWithSpace({ x: 6, y: 6}, h),
        ...doubleWithSpace({ x: 12, y: 6}, h),
        
        // middle bottom line
        ...doubleWithSpace({ x: 6, y: 9}, h),
        ...doubleWithSpace({ x: 12, y: 9}, h),
        
        // bottom line
        ...lineH({ x: 7, y: 12 }, 4, h),
        
        // left
        ...doubleWithSpace({ x: 22, y: 6}, h),
        ...doubleWithSpace({ x: 22, y: 9}, h),
        
        ...lineH({ x: 23, y: 12}, 2, h),
        
        // === Outside ===
        // left line
        ...lineV({ x: 1, y: 16}, 2, v),
        ...lineV({ x: 5, y: 16}, 2, v),
        ...doubleWithSpace({ x: 9, y: 15}, v),
        ...doubleWithSpace({ x: 14, y: 15}, v),
        
        ...lineV({ x: 18, y: 16}, 2, v),
        ...doubleWithSpace({ x: 24, y: 15}, v),
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
