<script lang="ts">

    import Text from './typography/Text.svelte';
    import TextInput from './input/TextInput.svelte';
    import TimePicker from './input/TimePicker.svelte';
    import DatePicker from './input/DatePicker.svelte'
    import NumberInput from './input/NumberInput.svelte';
    import EmailInput from './input/EmailInput.svelte';
    import DishPicker from './input/DishPicker.svelte';
    import Button from './input/Button.svelte';
    import Annotation from './typography/Annotation.svelte';
    import Collapsable from './Collapsable.svelte';

    export let personCount: number;
    export let dishCount: number[] = [0, 0, 0];
    export let selectionCount: number;
    let dish: string = '';
	
	function clickHandler() {
	    alert("Deine Reservation war erfolgreich!");
	}

    let currentIndex: number = 1;

    function clickCallback(index: number) {
        currentIndex = index;
    }
</script>

<div class="flex flex-col p-10 gap-5 items-stretch border-l-2 border-gray-100" style="width: 600px">
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
        <Annotation>{selectionCount}/{Math.ceil(personCount / 2)} Tische ausgewählt</Annotation>
    </Collapsable>

    <Collapsable
        label="Essensauswahl (optional)"
        visible={currentIndex === 2}
        {clickCallback}
        index={2}
    >
        <DishPicker bind:dishCount={dishCount}/>
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
    <Button label="Bestätigen" onclick={clickHandler} />
</div>
