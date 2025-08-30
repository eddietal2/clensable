<script lang="ts">
  import { onMount } from 'svelte';
  import { FileText } from 'lucide-svelte';
  import { addToast } from '$lib/stores/toast';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import { greenGradient, buttonBase } from '$lib/styles';
  import { X } from 'lucide-svelte';
  import { fly } from 'svelte/transition';

  // Show Info Card "What is a Campaign?"
  let showIntroCard = true;

  interface Campaign {
    id: string;
    name: string;
    createdAt: string;
    leadsCount: number;
    emailsSent: number;
    emailsReplied: number;
    status: 'Draft' | 'Active' | 'Completed';
  }

  let campaigns: Campaign[] = [];
  let errorMsg = '';
  let loading = false;
  let deletingId: string | null = null;

  // Modal state
  let showConfirm = false;
  let selectedCampaignId: string | null = null;

  async function fetchCampaigns() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || 'Failed to fetch campaigns';
        return;
      }

      const data = await res.json();
      campaigns = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        createdAt: new Date(c.createdAt).toLocaleDateString(),
        leadsCount: c.leads?.length || 0,
        emailsSent: c.outreach?.filter((o: any) => o.status !== 'pending').length || 0,
        emailsReplied: c.outreach?.filter((o: any) => o.status === 'replied').length || 0,
        status: c.status || 'Draft'
      }));
    } catch (err) {
      console.error(err);
      errorMsg = 'Unexpected error while fetching campaigns';
    } finally {
      loading = false;
    }
  }

  function openConfirm(id: string) {
    selectedCampaignId = id;
    showConfirm = true;
  }

  function cancelDelete() {
    selectedCampaignId = null;
    showConfirm = false;
  }

  async function handleDelete() {
    if (!selectedCampaignId) return;

    deletingId = selectedCampaignId;

    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || 'Failed to delete campaign', 'error');
        return;
      }

      campaigns = campaigns.filter(c => c.id !== selectedCampaignId);
      addToast('Campaign deleted successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Unexpected error while deleting campaign', 'error');
    } finally {
      deletingId = null;
      selectedCampaignId = null;
      showConfirm = false;
    }
  }

  onMount(() => fetchCampaigns());
</script>

<div class="space-y-6 p-6 mt-10 max-w-4xl">
  <!-- Header / Quick Actions -->
  <div class="flex justify-between items-center">
    <a href="/app/campaigns/create">
      <button 
        class={`${greenGradient} ${buttonBase}`}>
        <FileText class="w-5 h-5" />
        <span>New Campaign</span>
      </button>
    </a>
  </div>
  
  {#if showIntroCard}
  <div class="relative shadow mt-2 bg-gradient-to-b from-[#FACC1510] to-[#B59F0020] p-4 max-w-4xl rounded-lg border-l-4 border-yellow-500"
       transition:fly={{ x: 20, duration: 150 }}>
    <!-- Close button -->
    <button 
      class="absolute top-2 right-2 p-1 rounded hover:bg-yellow-100 transition"
      on:click={() => (showIntroCard = false)}
      aria-label="Close"
    >
      <X class="h-5 w-5 text-gray-600" />
    </button>
  
    <h2 class="text-2xl font-bold mb-2 jura">What is a Campaign?</h2>
    <p class="text-gray-700">
      A campaign is a targeted outreach effort to potential clients for your cleaning services. 
      It allows you to define the market segment, geographic area, and messaging for your outreach. 
      Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus 
      on the most promising prospects.
    </p>
  </div>
  {/if}

  <!-- Campaigns Table -->
  <section class="bg-white p-6 rounded-lg shadow max-w-4xl">
    {#if loading}
      <div class="mt-6 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
      </div>
    {:else if errorMsg}
      <p class="text-red-600">{errorMsg}</p>
    {:else}
      <table class="w-full text-left max-w-4xl">
        <thead>
          <tr class="jura border-b border-gray-200">
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Created At</th>
            <th class="px-4 py-2">Leads</th>
            <th class="px-4 py-2">Emails Sent</th>
            <th class="px-4 py-2">Replies</th>
            <th class="px-4 py-2">Status</th>
            <th class="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each campaigns as campaign}
          <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-2">{campaign.name}</td>
            <td class="px-4 py-2">{campaign.createdAt}</td>
            <td class="px-4 py-2">{campaign.leadsCount}</td>
            <td class="px-4 py-2">{campaign.emailsSent}</td>
            <td class="px-4 py-2">{campaign.emailsReplied}</td>
            <td class="px-4 py-2">{campaign.status}</td>
            <td class="px-4 py-2 flex space-x-2">
              <!-- View Campaign -->
              <a 
                href={`/app/campaigns/${campaign.id}`}
                class="text-xs text-green-600 hover:underline"
              >
                View
              </a>
              <!-- Edit -->
              <a 
                href={`/app/campaigns/${campaign.id}/edit`}
                class="text-xs text-yellow-600 hover:underline"
              >
                Edit
              </a>
              <!-- Delete -->
              <button 
                class="text-xs text-red-600 hover:underline flex items-center"
                on:click={() => openConfirm(campaign.id)}
                disabled={deletingId === campaign.id}
              >
                {#if deletingId === campaign.id}
                  <svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Deleting...
                {:else}
                  Delete
                {/if}
              </button>
            </td>
          </tr>
          {/each}
        </tbody>
      </table>

      {#if campaigns.length === 0}
        <p class="text-gray-500 mt-4 ml-4">No campaigns yet. Click "New Campaign" to create one.</p>
      {/if}
    {/if}
  </section>
</div>

<!-- Confirm Modal -->
{#if showConfirm}
  <ConfirmModal
    message="Are you sure you want to delete this campaign?"
    confirmText="Delete"
    cancelText="Cancel"
    loading={deletingId !== null}
    on:confirm={handleDelete}
    on:cancel={cancelDelete}
  />
{/if}
