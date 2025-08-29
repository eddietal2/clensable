<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { addToast } from '$lib/stores/toast';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import { page } from '$app/stores';

  interface Campaign {
    id: string;
    name: string;
    description: string;
    targetZip: string;
    radius: number;
    category: string;
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  }

  let campaign: Campaign | null = null;
  let originalCampaign: Campaign | null = null;

  let loading = false;
  let saving = false;
  let errorMsg = '';

  let showConfirm = false;
  const campaignId = $page.params.id;

  // Fetch campaign on mount
  onMount(fetchCampaign);

  async function fetchCampaign() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error('Failed to fetch campaign');
      const data = await res.json();
      campaign = data;
      originalCampaign = { ...data };
    } catch (err) {
      console.error(err);
      errorMsg = 'Could not load campaign';
    } finally {
      loading = false;
    }
  }

  function hasUnsavedChanges() {
    if (!campaign || !originalCampaign) return false;
    return JSON.stringify(campaign) !== JSON.stringify(originalCampaign);
  }

  // Show confirm modal only if unsaved changes exist
  function saveCampaign() {
    if (!campaign) return;
    if (hasUnsavedChanges()) {
      showConfirm = true;
    } else {
      addToast('No changes to save', 'info');
    }
  }

  async function doSave() {
    if (!campaign) return;
    saving = true;
    console.log(campaign);
    
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign)
      });

      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || 'Failed to save campaign', 'error');
        return;
      }

      addToast('Campaign updated successfully!', 'success');
      originalCampaign = { ...campaign };
      goto(`/app/campaigns/${campaignId}`);
    } catch (err) {
      console.error(err);
      addToast('Unexpected error while saving', 'error');
    } finally {
      saving = false;
      showConfirm = false;
    }
  }

  function cancelSave() {
    showConfirm = false;
  }
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6 mt-10">
  <a 
    href="/app/campaigns"
    class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition font-medium"
  >
    <!-- Optional left arrow icon -->
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    Back
  </a>

  {#if loading}
    <p>Loading campaign...</p>
  {:else if errorMsg}
    <p class="text-red-600">{errorMsg}</p>
  {:else if campaign}
    <h1 class="text-2xl font-bold mt-2">Edit Campaign</h1>

    <form class="space-y-4" on:submit|preventDefault={saveCampaign}>
      <div>
        <label class="block text-sm font-semibold mb-1">Name</label>
        <input
          type="text"
          bind:value={campaign.name}
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold mb-1">Description</label>
        <textarea
          bind:value={campaign.description}
          class="w-full border rounded px-3 py-2"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-semibold mb-1">Category</label>
          <input
            type="text"
            bind:value={campaign.category}
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Target ZIP</label>
          <input
            type="text"
            bind:value={campaign.targetZip}
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Radius (miles)</label>
          <input
            type="number"
            bind:value={campaign.radius}
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Status</label>
          <select
            bind:value={campaign.status}
            class="w-full border rounded px-3 py-2"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div class="flex justify-between">
      <button
        type="submit"
        class="bg-gradient-to-b from-[#00CF68] to-[#187967] text-white px-4 py-2 rounded-lg hover:from-[#EAB308] hover:to-[#92400E] transition"
      >
        {#if saving}Saving...{:else}Save Changes{/if}
      </button>
    
      <a
        href="/app/campaigns/{campaignId}"
        class="bg-gradient-to-b from-[#D1D5DB] to-[#374151] text-white px-4 py-2 rounded-lg hover:from-[#EAB308] hover:to-[#92400E] transition"
      >
        Cancel
      </a>
    </div>

    </form>
  {/if}
</div>

<!-- Confirm Modal -->
{#if showConfirm}
  <ConfirmModal
    message="Are you sure you want to save these changes?"
    confirmText="Yes, save"
    cancelText="Cancel"
    loading={saving}
    on:confirm={doSave}
    on:cancel={cancelSave}
  />
{/if}
