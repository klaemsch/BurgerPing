<script lang="ts">
    import Text from "../components/typography/Text.svelte";
    import type { Reservation } from "../data/reservation";

    // selected reservation
    export let selected: number;
    export let reservations: Reservation[];
</script>

<div class="flex flex-col justify-between p-10 border-l-2 border-gray-100">
    <div class="flex flex-col gap-5 items-stretch" style="width: 600px">
        {#each reservations as reservation, i}
            <div
                on:click={() => {
                    if (selected === i) {
                        selected = undefined;
                        return;
                    }
                    selected = i;
                }}
                class={`${
                    selected === i
                        ? "border-indigo-600 bg-indigo-100"
                        : "border-gray-200"
                } border p-3 rounded-md shadow-sm flex flex-row`}
            >
                <div class="flex flex-col gap-2">
                    <div class="flex flex-row">
                        <Text bold>{reservation.name},&nbsp;</Text>
                        <Text
                            >{reservation.personCount}
                            {reservation.personCount > 1
                                ? "persons"
                                : "person"}</Text
                        >
                    </div>
                    <div class="flex flex-row">
                        <Text>{reservation.date.toLocaleString("de")}</Text>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
