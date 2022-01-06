<style global>
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @import url('https://fonts.googleapis.com/css2?family=Inter&display=swap');

    @layer base {
      body {
        padding: 0;
      }
    }

    @layer components {
      .table {
          @apply fill-orange-300
      }

      .chair {
        @apply fill-orange-800
      }
  }
</style>