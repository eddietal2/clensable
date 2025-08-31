<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let lead: any;
  export let campaignId: string | undefined;
  export let groupName: string; // The OutreachGroup name passed from parent
  
  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  async function addLeadToGroup() {
    try {
      // 1️⃣ Add lead to OutreachGroup
      dispatch('add', { lead, groupName }); // Parent handles the actual storage

      // 2️⃣ Remove lead from campaign
      dispatch('removeFromCampaign', { leadId: lead.id, campaignId });

      // 3️⃣ Blacklist lead for this org
      dispatch('blacklist', { leadId: lead.id });

      close();
    } catch (err) {
      console.error('Failed to add lead to group', err);
    }
  }
</script>

<div
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  role="dialog"
  aria-modal="true"
  on:keydown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') close(); }}
  tabindex="0"
>
  <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-lg p-6 relative">
    <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700" on:click={close} aria-label="Close modal">✕</button>

    <h2 class="text-xl font-bold mb-4">Add Lead to {groupName}</h2>
    <p class="mb-4">Lead: <span class="font-semibold">{lead.name}</span></p>
    <p class="mb-4">Campaign ID: <span class="font-semibold">{campaignId}</span></p>

    <div class="flex justify-end gap-3">
      <button class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" on:click={close}>Cancel</button>
      <button class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" on:click={addLeadToGroup}>
        Add to Outreach
      </button>
    </div>
  </div>
</div>
