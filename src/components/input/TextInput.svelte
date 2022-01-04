<script lang="ts">
  export let placeholder: string;
  export let label: string;
  export let number: boolean = false;
  export let value: string;
</script>

<!--<div>
    <input
        bind:value
        type="text"
        class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 stext-sm border-gray-300 rounded-md"
        {placeholder}
    />
</div>-->

<div>
  {#if label}
    <label for={label} class="block text-sm font-medium text-gray-700"
      >{label}</label
    >
  {/if}
  <div class="mt-1 relative rounded-md shadow-sm">
    <input
      type={number ? "number" : "text"}
      name="input"
      id={label}
      class="font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300"
      {placeholder}
      />
    </div>
  </div>