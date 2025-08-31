<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let message: string = "Are you sure?";
  export let confirmText: string = "Yes";
  export let cancelText: string = "Cancel";
  export let loading: boolean = false;

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full space-y-4">
    <p class="text-gray-800">{@html message}</p>
    <div class="flex justify-end space-x-2">
      <button 
        class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        on:click={handleCancel}
        disabled={loading}
      >
        {cancelText}
      </button>
      <button 
        class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center justify-center"
        on:click={handleConfirm}
        disabled={loading}
      >
        {#if loading}
          <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Deleting...
        {:else}
          {confirmText}
        {/if}
      </button>
    </div>
  </div>
</div>
