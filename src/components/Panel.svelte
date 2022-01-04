<script lang="ts">

    import Text from './typography/Text.svelte';
    import TextInput from './input/TextInput.svelte';
    import TimePicker from './input/TimePicker.svelte';
    import DatePicker from './input/DatePicker.svelte'

</script>

<div class="flex flex-col px-20 py-10 gap-5">
    <DatePicker label="Datum"/>
    <TimePicker label="Uhrzeit"/>
    <TextInput number label="Personen" value="1" placeholder="1"/>
    <TextInput label="Name" placeholder="Maximilian Erhardt"/>
    <TextInput label="Email" placeholder="maximilian.erhardt@stud.uni-hannover.de"/>
</div>