<script lang="ts">
    import AdminPanel from "../components/AdminPanel.svelte";
    import SeatingPlan from "../components/Seating.svelte";
    import type { Reservation } from "../data/reservation";

    let reservations: Reservation[] = [
        {
            name: "Meter Paffay",
            email: "meter.paffay@gmail.com",
            date: new Date("2022-01-28T17:24:00"),
            personCount: 7,
            dishCount: [2, 4, 1],
            selected: [15, 16, 17, 18, 19, 20, 21],
        },
        {
            name: "Gordon Ramsey",
            email: "gordon@ramsey.co.uk",
            date: new Date("2022-01-29T13:26:00"),
            personCount: 1,
            selected: [4],
        },
    ];

    // index of selected reservation
    let selected: number;

    let selectedSeating: number[];
    $: selectedSeating =
        selected !== undefined ? reservations[selected].selected : [];

    /*$: {
        if (selected !== undefined) {
            reservations[selected].selected = selectedSeating;
        }
    }*/

    $: personCount =
        selected !== undefined ? reservations[selected].personCount : 0;
</script>

<div class="flex flex-row flex-1">
    <SeatingPlan bind:selected={selectedSeating} {personCount} editable />
    <AdminPanel bind:selected {reservations} />
</div>
