<script lang="ts">

    import Text from './typography/Text.svelte';
    import TextInput from './input/TextInput.svelte';
    import TimePicker from './input/TimePicker.svelte';
    import DatePicker from './input/DatePicker.svelte'
    import NumberInput from './input/NumberInput.svelte';
    import DishPicker from './input/DishPicker.svelte';
    import Button from './input/Button.svelte';
    import Annotation from './typography/Annotation.svelte';

    export let personCount: number;
    export let dishCount: number;
    export let selectionCount: number;
    let dish: string = '';
	
	function clickHandler() {
	    alert("Deine Reservation war erfolgreich!");
	}

</script>

<div class="flex flex-col px-20 py-10 gap-5">
    <DatePicker label="Datum"/>
    <TimePicker label="Uhrzeit"/>
    <NumberInput label="Personen" bind:value={personCount} min={1} max={10} placeholder="1"/>
    <Annotation>{selectionCount}/{Math.ceil(personCount / 2)} Tische ausgewählt</Annotation>
    <TextInput label="Name" placeholder="Maximilian Erhardt"/>
    <TextInput label="Email" placeholder="maximilian.erhardt@stud.uni-hannover.de"/>
    <Text>Essensauswahl (optional)</Text>
    <div class="flex gap-5">
        <DishPicker label="Menü" />
        <NumberInput label="Anzahl" bind:value={dishCount} min={1} max={10} placeholder="1"/>
    </div>
    <Button label="Bestätigen" onclick={clickHandler}/>
</div>