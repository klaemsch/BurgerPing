<script lang="ts">
    import Button from "./input/Button.svelte";
    import Title from "./typography/Title.svelte";
    import { Router, navigate } from "svelte-routing";

    let label: string = "Admin";

    const navigator = () => {
        console.log(label)
        if (window.location.pathname == "/admin") {
            navigate("/", { replace: false });
            label = "Admin";
        } else if (window.location.pathname == "/") {
            navigate("/admin", { replace: false });
            label = "Kundenansicht";
        } else {
            console.log("This shouldnt be possible!")
        }
    }

</script>

<header
    class="flex flex-row gap-3 items-center border-b-2 border-gray-100 p-4 justify-between"
>
    <img src="./burger.png" alt="BurgerPing Logo" width={50} class="rounded" />
    <Button label={label} onclick={navigator} />
</header>
