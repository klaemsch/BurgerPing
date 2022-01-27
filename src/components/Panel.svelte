<script lang="ts">
    import TextInput from "./input/TextInput.svelte";
    import TimePicker from "./input/TimePicker.svelte";
    import DatePicker from "./input/DatePicker.svelte";
    import NumberInput from "./input/NumberInput.svelte";
    import EmailInput from "./input/EmailInput.svelte";
    import DishPicker from "./input/DishPicker.svelte";
    import Button from "./input/Button.svelte";
    import Annotation from "./typography/Annotation.svelte";
    import Collapsable from "./Collapsable.svelte";

    export let personCount: number;
    export let dishCount: number[] = [0, 0, 0];
    export let selectionCount: number;
    let date = new Date();
    let time: string;

    let name: string;
    let email: string;

    const showConfirmation = () => {
        alert("Deine Reservation war erfolgreich!");
    };

    let currentIndex: number = 1;

    const clickCallback = (index: number) => {
        if (currentIndex === index) {
            currentIndex = 0;
            return;
        }
        currentIndex = index;
    };

    $: dateSectionIsValid =
        date !== null && time !== null && personCount > 0 && personCount < 11;

    $: contactSectionIsValid = name !== "" && email !== "";

    $: menuSectionIsValid = dishCount.reduce((a, b) => a + b, 0) > 0;
</script>

<div class="flex flex-col justify-between p-10 border-l-2 border-gray-100">
    <div class="flex flex-col gap-5 items-stretch" style="width: 600px">
        <Collapsable
            label="Termin"
            visible={currentIndex === 1}
            valid={dateSectionIsValid}
            {clickCallback}
            index={1}
        >
            <div class="flex flex-col gap-4">
                <DatePicker label="Datum" bind:date />
                <TimePicker label="Uhrzeit" bind:selectedTime={time} />
                <NumberInput
                    label="Personen"
                    bind:value={personCount}
                    min={1}
                    max={10}
                    placeholder="1"
                />
                <Annotation colored
                    >{selectionCount}/{Math.ceil(personCount / 2)} Tische ausgewählt
                    (optional)</Annotation
                >
            </div>
        </Collapsable>

        <Collapsable
            label="Kontakt"
            visible={currentIndex === 3}
            valid={contactSectionIsValid}
            {clickCallback}
            index={3}
        >
            <div class="flex flex-col gap-4">
                <TextInput
                    label="Name"
                    placeholder="Maximilian Erhardt"
                    bind:value={name}
                />
                <EmailInput
                    label="Email"
                    placeholder="maximilian.erhardt@stud.uni-hannover.de"
                    bind:value={email}
                />
            </div>
        </Collapsable>

        <Collapsable
            label="Essensauswahl"
            optional
            visible={currentIndex === 2}
            valid={menuSectionIsValid}
            {clickCallback}
            index={2}
        >
            <DishPicker bind:dishCount />
        </Collapsable>
    </div>
    <div class="flex flex-col gap-3">
        <Button
            label="Bestätigen"
            onclick={showConfirmation}
            disabled={!dateSectionIsValid || !contactSectionIsValid}
        />
        <div class="flex flex-col items-center">
            <p class="text-sm text-gray-400">
                Bei Fragen: Schreiben Sie uns eine <a
                    href="mailto:burgerpingreservation@stud.uni-hannover.de?subject=Reservierung"
                    class="underline">Email</a
                >
            </p>
        </div>
    </div>
</div>
