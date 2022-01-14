<script lang="ts">
    import Button from "./input/Button.svelte";
    import Title from "./typography/Title.svelte";
</script>

<header
    class="flex flex-row gap-3 items-center border-b-2 border-gray-100 p-4 justify-between"
>
    <img src="./burger.png" alt="BurgerPing Logo" width={50} class="rounded" />
    <Title>Reservierung</Title>
    <Button label="Login" onclick={() => {}} />
</header>
