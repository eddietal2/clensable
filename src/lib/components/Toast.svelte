<script lang="ts">
  import { toasts, type Toast } from '$lib/stores/toast';
  import { fly } from 'svelte/transition';
</script>

<div class="fixed top-4 right-4 space-y-2 z-50">
  {#each $toasts as toast (toast.id)}
    <div
      in:fly={{ x: 200, duration: 300 }}
      out:fly={{ x: 200, duration: 300 }}
      class="px-4 py-2 rounded shadow text-white"
      class:bg-[#187967]={toast.type === 'success'}
      class:bg-red-500={toast.type === 'error'}
      class:bg-blue-500={toast.type === 'info'}
    >
      {toast.message}
    </div>
  {/each}
</div>
