<script lang="ts">
    import { onMount } from "svelte";
    import createPanZoom, { PanZoom } from "panzoom";

    import { TABLE_SIZE } from "../constant";
    import TableDouble from "./furniture/Table.svelte";
    import Bar from "./furniture/Bar.svelte";
    import Plus from "./icons/Plus.svelte";
    import Minus from "./icons/Minus.svelte";
    import Move from "./icons/Move.svelte";
    import Annotation from "./typography/Annotation.svelte";
    import Reset from "./icons/Reset.svelte";

    export let selected: number[];
    export let personCount: number;

    const handleSelection = (index: number) => {
        const isDisabled = tableData[index][3] === true;
        if (isDisabled) return;

        const i = selected.findIndex((s) => s === index);
        if (i > -1) {
            // Removes item from selected list if it has already been selected before
            selected = [...selected.slice(0, i), ...selected.slice(i + 1)];
            return;
        }

        selected = [...selected, index];
    };

    const resetSelection = () => {
        selected = [];
    };

    // number of tables the visitor is allowed to select based on person count
    $: tableCount = Math.ceil(personCount / 2);

    $: {
        console.log(`tableCount: ${tableCount}`);
        selected = selected.slice(-tableCount);
        console.log(`Selection length: ${selected.length}`);
    }

    const randomlyDisable = () => Math.random() > 0.9;

    // Does the svg align chairs on top and bottom of table? (false = horizontal = left and right)
    const SVG_IS_VERTICAL = true;

    enum Direction {
        HORIZONTAL,
        VERTICAL,
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
    const lineV = (
        start: Point,
        count: number,
        direction: Direction = h
    ): TableConfig[] => {
        const factor = direction === v ? 3 : 1;
        return Array(count)
            .fill(0)
            .map((_, i) => [
                start.x,
                start.y + i * factor,
                direction,
                randomlyDisable(),
            ]);
    };

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
    const lineH = (
        start: Point,
        count: number,
        direction: Direction = v
    ): TableConfig[] => {
        const factor = direction === v ? 1 : 3;
        return Array(count)
            .fill(0)
            .map((_, i) => [
                start.x + i * factor,
                start.y,
                direction,
                randomlyDisable(),
            ]);
    };

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
    const doubleWithSpace = (
        start: Point,
        direction: Direction
    ): TableConfig[] => {
        const isVert = direction === v;
        const line = isVert ? lineV : lineH;
        return [
            ...line(start, 2),
            ...line(
                {
                    x: start.x + (isVert ? 0 : 4),
                    y: start.y + (isVert ? 4 : 0),
                },
                2
            ),
        ];
    };

    const tableData: TableConfig[] = [
        // === Inside ===

        // top line
        ...lineH({ x: 1, y: 1 }, 4, h),

        // left
        ...lineV({ x: 1, y: 4 }, 3, v),

        // middle top
        ...doubleWithSpace({ x: 6, y: 6 }, h),
        ...doubleWithSpace({ x: 12, y: 6 }, h),

        // middle bottom
        ...doubleWithSpace({ x: 6, y: 9 }, h),
        ...doubleWithSpace({ x: 12, y: 9 }, h),

        // bottom
        ...lineH({ x: 7, y: 12 }, 4, h),

        // right
        ...doubleWithSpace({ x: 22, y: 6 }, h),
        ...doubleWithSpace({ x: 22, y: 9 }, h),

        ...lineH({ x: 23, y: 12 }, 2, h),

        // === Outside ===

        // left
        ...lineV({ x: 1, y: 16 }, 2, v),
        ...lineV({ x: 5, y: 16 }, 2, v),

        // center
        ...doubleWithSpace({ x: 9, y: 15 }, v),
        ...doubleWithSpace({ x: 14, y: 15 }, v),

        // right
        ...lineV({ x: 18, y: 16 }, 2, v),
        ...doubleWithSpace({ x: 24, y: 15 }, v),
    ];

    interface Table {
        start: Point;
        span: Dimension;
        // Should svg be rotated 90 degrees?
        rotate: boolean;
        disabled: boolean;
    }

    const tables: Table[] = tableData.map(([x, y, dir, disabled]) => {
        const isVert = dir === Direction.VERTICAL;
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
    };

    const unhover = (index: number) => () => {
        if (index === hoverIndex) {
            hoverIndex = null;
        }
    };

    const cells = Array(31 * 22).fill(0);

    let container;
    let handle: PanZoom;
    onMount(() => {
        handle = createPanZoom(container, {
            minZoom: 0.5,
            maxZoom: 2,
            bounds: true,
            zoomDoubleClickSpeed: 1,
            zoomSpeed: 0.5,
        });
    });

    const zoomIn = () => {
        handle.zoomTo(400, 200, 1.2);
    };
    const zoomOut = () => {
        handle.zoomTo(400, 200, 0.8);
    };
</script>

<div
    class="flex flex-1 bg-gray-50 overflow-hidden inner-shadow outline-none relative"
>
    <div
        class="grid items-center p-3 w-full"
        id="grid-container"
        style="--cell-size: {TABLE_SIZE}px"
        bind:this={container}
    >
        {#each cells as _, i}
            <div
                class="border-l-2 border-t-2 border-indigo-50 self-stretch pointer-events-none"
                style={computeGridProperties(
                    { x: i % 31, y: Math.floor(i / 31) },
                    { width: 1, height: 1 }
                )}
            />
        {/each}
        <div class="wall" style="grid-column: 1 / 32; grid-row: 1 / 14;" />
        <div class="wall" style="grid-column: 1 / 13; grid-row: 1 / 14;" />
        <div class="bar">
            <Bar x={0} y={0} />
        </div>
        <div
            class="door-v"
            style="grid-column: 12 / span 2; grid-row: 4 / span 2;"
        />
        <div
            class="door-h"
            style="grid-column: 4 / span 2; grid-row: 13 / span 2;"
        />
        <div
            class="door-h"
            style="grid-column: 20 / span 2; grid-row: 13 / span 2;"
        />
        {#each tables as table, i}
            <div
                class="flex justify-center"
                style={computeGridProperties(table.start, table.span)}
            >
                <div
                    class:rotated={table.rotate}
                    on:mouseenter={hover(i)}
                    on:mouseleave={unhover(i)}
                    on:click={() => handleSelection(i)}
                >
                    <TableDouble
                        highlighted={hoverIndex === i}
                        selected={selected.findIndex((s) => s === i) > -1}
                        disabled={table.disabled}
                    />
                </div>
            </div>
        {/each}
    </div>
    <div class="flex flex-row gap-3 absolute bottom-5 right-5 items-center">
        <div
            class="flex flex-row gap-3 p-2 bg-white border-2 border-l-0 border-gray-100 rounded-r-md items-center cursor-pointer"
            on:click={() => {}}
        >
            <Move />
            <Annotation>Editieren</Annotation>
        </div>
        <div
            class="flex flex-row gap-3 p-2 bg-white border-2 border-l-0 border-gray-100 rounded-r-md items-center cursor-pointer"
            on:click={resetSelection}
        >
            <Reset />
            <Annotation>Zurücksetzen</Annotation>
        </div>
        <div class="flex flex-row rounded-md shadow-sm cursor-pointer">
            <div
                class="p-2 bg-white border-2 border-gray-100 rounded-l-md"
                on:click={zoomIn}
            >
                <Plus />
            </div>
            <div
                class="p-2 bg-white border-2 border-l-0 border-gray-100 rounded-r-md"
                on:click={zoomOut}
            >
                <Minus />
            </div>
        </div>
    </div>
</div>

<style>
    #grid-container {
        grid-template-columns: repeat(auto-fill, var(--cell-size));
        grid-template-rows: repeat(auto-fill, var(--cell-size));
    }

    .rotated {
        transform: rotate(90deg);
    }

    .bar {
        grid-column: 19 / span 7;
        grid-row: 1 / span 3;
        align-self: stretch;
    }

    .wall {
        border: 2px solid grey;
        align-self: stretch;
    }

    .door-v {
        background-color: gray;
        align-self: stretch;
        justify-self: center;
        width: 10px;
        @apply rounded-sm;
    }
    .door-h {
        background-color: gray;
        align-self: center;
        justify-self: stretch;
        height: 10px;
        @apply rounded-sm;
    }

    .inner-shadow {
        box-shadow: 0px 0px 15px 3px rgba(0, 0, 0, 0.03) inset;
    }
</style>
