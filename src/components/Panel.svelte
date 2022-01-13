<script lang="ts">

    import Text from './typography/Text.svelte';
    import TextInput from './input/TextInput.svelte';
    import TimePicker from './input/TimePicker.svelte';
    import DatePicker from './input/DatePicker.svelte'
    import NumberInput from './input/NumberInput.svelte';
    import DishPicker from './input/DishPicker.svelte';

    export let personCount: number;
    export let dishCount: number;
    let dish: string = '';

</script>

<div class="flex flex-col px-20 py-10 gap-5">
    <DatePicker label="Datum"/>
    <TimePicker label="Uhrzeit"/>
    <NumberInput label="Personen" bind:value={personCount} min={1} max={10} placeholder="1"/>
    <TextInput label="Name" placeholder="Maximilian Erhardt"/>
    <TextInput label="Email" placeholder="maximilian.erhardt@stud.uni-hannover.de"/>
    <Text>Essensauswahl (optional)</Text>
    <div class="flex gap-5">
        <DishPicker label="Menü" />
        <NumberInput label="Anzahl" bind:value={dishCount} min={1} max={10} placeholder="1"/>
    </div>
</div>