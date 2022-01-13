<script lang="ts">
    import { TABLE_SIZE } from "../constant";
    import TableDouble from "./furniture/Table.svelte";
    import Bar from "./furniture/Bar.svelte";
    import createPanZoom from 'panzoom';
    import { onMount } from "svelte";
    
    export let selected: number[];
    export let onSelected: (index: number) => void;
    
    const randomlyDisable = () => Math.random() > 0.9;
    
    // Does the svg align chairs on top and bottom of table? (false = horizontal = left and right)
    const SVG_IS_VERTICAL = true;
    
    enum Direction {
        HORIZONTAL, VERTICAL
    }
    // x, y, dir, disabled
    type TableConfig = [number, number, Direction, boolean?];
    
    type Point = {
        x: number;
        y: number;
    };
    type Dimension = {
        width: number;
        height: number;
    };

    const h = Direction.HORIZONTAL;
    const v = Direction.VERTICAL;
    
    // Creates vertical line of tables. The indivual tables are aligned based on `direction`.
    // The upper-most table (marked as `Y` in drawing below) will be placed at the specified starting point
    // If direction is vertical, one free space is added between each table
    // 
    // (count: 4, direction: horitonal):
    //  oYo
    //  oXo
    //  oXo
    //  oXo
    //
    // (count: 2, direction: vertical):
    //  o
    //  Y
    //  o
    //
    //  o
    //  X
    //  o
    //
    const lineV = (start: Point, count: number, direction: Direction = h): TableConfig[] => {
        const factor = direction === v ? 3 : 1;
        return Array(count).fill(0).map((_, i) => [start.x, start.y + i * factor, direction, randomlyDisable()]);
    }
    
    // Creates horizontal line of tables. The indivual tables are aligned based on `direction`
    // The left-most table (marked as `Y` in drawing below) will be placed at the specified starting point
    // If direction is horizontal, one free space is added between each table.
    //
    // (count: 4, direction: vertical):
    //  o o o o 
    //  Y|X|X|X
    //  o o o o
    //
    // (count: 4, direction: horizontal):
    //  oYo | oXo | oXo | oXo
    //
    const lineH = (start: Point, count: number, direction: Direction = v): TableConfig[] => {
        const factor = direction === v ? 1 : 3;
        return Array(count).fill(0).map((_, i) => [start.x + i * factor, start.y, direction, randomlyDisable()]);
    }

    // Creates two double tables (á 2 spaces) with 2 free spaces in between (6x3 spaces total).
    // The left-most table (marked as `Y` in drawing below) will be placed at the specified starting point
    //
    //  o o     o o  1
    //  Y|X| | |X|X  2
    //  o o     o o  3
    //
    //  1 2 3 4 5 6
    // 
    // If direction is set to VERTICAL, the same description applies with x and y being flipped
    // and the top-most table being placed at the starting point
    //
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

        // top
        ...lineH({ x: 2, y: 1}, 4, h),

        // left
        ...lineV({ x: 1, y: 4}, 3, v),

        // middle top
        ...doubleWithSpace({ x: 6, y: 6}, h),
        ...doubleWithSpace({ x: 12, y: 6}, h),
        
        // middle bottom
        ...doubleWithSpace({ x: 6, y: 9}, h),
        ...doubleWithSpace({ x: 12, y: 9}, h),
        
        // bottom
        ...lineH({ x: 7, y: 12 }, 4, h),
        
        // right
        ...doubleWithSpace({ x: 22, y: 6}, h),
        ...doubleWithSpace({ x: 22, y: 9}, h),
        
        ...lineH({ x: 23, y: 12}, 2, h),
        
        // === Outside ===

        // left
        ...lineV({ x: 1, y: 16}, 2, v),
        ...lineV({ x: 5, y: 16}, 2, v),

        // center
        ...doubleWithSpace({ x: 9, y: 15}, v),
        ...doubleWithSpace({ x: 14, y: 15}, v),
        
        // right
        ...lineV({ x: 18, y: 16}, 2, v),
        ...doubleWithSpace({ x: 24, y: 15}, v),
    ];
    

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

    let hoverIndex = null;

    const hover = (index: number) => () => {
        hoverIndex = index;
    }

    const unhover = (index: number) => () => {
        if (index === hoverIndex) {
            hoverIndex = null;
        }
    }

    let container;
    onMount(() => {
        const handle = createPanZoom(container);
    });

</script>

<div class="grid items-center p-3" id="grid-container" style="--cell-size: {TABLE_SIZE}px" bind:this={container}>
    {#each tables as table, i}
        <div class="flex justify-center" style={computeGridProperties(table.start, table.span)}>
            <div class:rotated={table.rotate} on:mouseenter={hover(i)} on:mouseleave={unhover(i)} on:click={() => onSelected(i)}>
                <TableDouble highlighted={hoverIndex === i} selected={selected.findIndex((s) => s === i) > -1} disabled={table.disabled} />
            </div>
        </div>
    {/each}
</div>

<style>
    #grid-container {
        width: 1000px;
        height: 1000px;

        grid-template-columns: repeat(auto-fill, var(--cell-size));
        grid-template-rows: repeat(auto-fill, var(--cell-size));
    }

    .rotated {
        transform: rotate(90deg);
    }
</style>
