<script lang="ts">
    import Button from "./input/Button.svelte";
    import Title from "./typography/Title.svelte";
    import { Router, navigate } from "svelte-routing";

    let label: string = "Admin";

    const navigator = () => {
        console.log(`Label: ${label}`)
        console.log(`Path: ${window.location.pathname}`)
        if (window.location.pathname == "/BurgerPing/admin") {
            navigate("/BurgerPing", { replace: false });
            label = "Admin";
            console.log("Navigating to: /BurgerPing")
        } else if (window.location.pathname == "/BurgerPing") {
            navigate("/BurgerPing/admin", { replace: false });
            label = "Kundenansicht";
            console.log("Navigating to: /BurgerPing/admin")
        } else {
            console.log("This shouldnt be possible!")
        }
    }

</script>

<header
    class="flex flex-row gap-3 items-center border-b-2 border-gray-100 p-4 justify-between"
>
    <img src="https://klaemsch.github.io/BurgerPing/burger.png" alt="BurgerPing Logo" width={50} class="rounded" />
    <Button label={label} onclick={navigator} />
</header>
