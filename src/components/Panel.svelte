<script lang="ts">

    import Text from './typography/Text.svelte';
    import TextInput from './input/TextInput.svelte';
    import TimePicker from './input/TimePicker.svelte';
    import DatePicker from './input/DatePicker.svelte'
    import NumberInput from './input/NumberInput.svelte';
    import Button from './input/Button.svelte';
    export let personCount: number;
	
	function clickHandler() {
	    alert("Deine Reservation war erfolgreich!");
	}

</script>

<div class="flex flex-col px-20 py-10 gap-5">
    <DatePicker label="Datum"/>
    <TimePicker label="Uhrzeit"/>
    <NumberInput label="Personen" bind:value={personCount} min={1} max={10} placeholder="1"/>
    <TextInput label="Name" placeholder="Maximilian Erhardt"/>
    <TextInput label="Email" placeholder="maximilian.erhardt@stud.uni-hannover.de"/>
    <Button label="Bestätigen" onclick={clickHandler}/>
</div>