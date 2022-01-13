<script lang="ts">
    import Text from "./typography/Text.svelte";
    import TextInput from "./input/TextInput.svelte";
    import TimePicker from "./input/TimePicker.svelte";
    import DatePicker from "./input/DatePicker.svelte";
    import NumberInput from "./input/NumberInput.svelte";
    import EmailInput from "./input/EmailInput.svelte";
    import Collapsable from "./Collapsable.svelte";

    export let personCount: number;

    let currentIndex: number = 1;

    function clickCallback(index: number) {
        currentIndex = index;
    }
</script>

<div class="flex flex-col px-20 py-10 gap-5 items-stretch">
    <Collapsable
        label="Datum+Uhrzeit+Personen"
        visible={currentIndex === 1}
        {clickCallback}
        index={1}
    >
        <DatePicker label="Datum" />
        <TimePicker label="Uhrzeit" />
        <NumberInput
            label="Personen"
            bind:value={personCount}
            min={1}
            max={10}
            placeholder="1"
        />
    </Collapsable>

    <Collapsable
        label="Essensauswahl"
        visible={currentIndex === 2}
        {clickCallback}
        index={2}
    >
        <h1>LOL</h1>
    </Collapsable>

    <Collapsable
        label="Persönliche Angaben"
        visible={currentIndex === 3}
        {clickCallback}
        index={3}
    >
        <TextInput label="Name" placeholder="Maximilian Erhardt" />
        <EmailInput
            label="Email"
            placeholder="maximilian.erhardt@stud.uni-hannover.de"
        />
    </Collapsable>
</div>
