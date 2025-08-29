<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { addToast } from '$lib/stores/toast';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import { FileText, Mail, User, CheckCircle } from 'lucide-svelte';
  import { currentCampaign } from '$lib/stores/campaign';
  import { onDestroy } from 'svelte';
  import { redGradient, backButton, buttonBase, yellowGradient } from '$lib/styles';

  interface Lead {
    id: string;
    name: string;
    email: string;
    status: 'pending' | 'sent' | 'replied';
  }

  interface Campaign {
    id: string;
    name: string;
    description: string;
    targetZip: string;
    radius: number;
    category: string;
    createdAt: string;
    status: 'Draft' | 'Active' | 'Completed';
    leads: Lead[];
  }

  let campaign: Campaign | null = null;
  let loading = false;
  let errorMsg = '';
  let deletingId: string | null = null;

  // Modal state
  let showConfirm = false;

  function openConfirm() {
    showConfirm = true;
  }

  function cancelDelete() {
    showConfirm = false;
  }

  async function fetchCampaign() {
    loading = true;
    errorMsg = '';
    const campaignId = get(page).params.id;

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || 'Failed to fetch campaign';
        return;
      }

      const data = await res.json();
      campaign = {
        ...data,
        createdAt: new Date(data.createdAt).toLocaleDateString()
      };
      if (campaign) {
        currentCampaign.set({ id: campaignId, name: campaign.name });
      }
    } catch (err) {
      console.error(err);
      errorMsg = 'Unexpected error while fetching campaign';
    } finally {
      loading = false;
    }
  }

  async function deleteCampaign() {
    if (!campaign) return;

    deletingId = campaign.id;

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        addToast(data.error || 'Failed to delete campaign', 'error');
        return;
      }

      addToast('Campaign deleted successfully!', 'success');
      goto('/app/campaigns');
    } catch (err) {
      console.error(err);
      addToast('Unexpected error while deleting campaign', 'error');
    } finally {
      deletingId = null;
      showConfirm = false;
    }
  }

  function goBack() {
    // If there's history, go back; otherwise, fallback to a default page
    if (history.length > 1) {
      history.back();
    } else {
      // fallback URL if no previous page in history
      window.location.href = "/app/dashboard";
    }
  }

  onMount(() => fetchCampaign());
  onDestroy(() => { currentCampaign.set(null) });
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6 mt-10">
  {#if loading}
    <div class="flex justify-center mt-6">
      <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
    </div>
  {:else if errorMsg}
    <p class="text-red-600">{errorMsg}</p>
  {:else if campaign}
    <!-- Header -->
    <div class="flex justify-between items-center">
      <button 
          on:click={goBack}
          class={`${backButton}`}
        >
          <!-- Optional left arrow icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
      </button>
      <div class="flex space-x-2">
          <a 
            href={`/app/campaigns/${campaign.id}/edit`}
            class={`${yellowGradient} ${buttonBase}`}
          >
            Edit
          </a>
          <button
            class={`${redGradient} ${buttonBase}`}
            on:click={openConfirm}
            disabled={deletingId === campaign.id}
          >
            {#if deletingId === campaign.id}Deleting...{:else}Delete{/if}
          </button>
      </div>
    </div>

    <!-- Description & Metadata -->
    <div class="bg-white p-4 rounded-lg space-y-2">
        <h1 class="text-2xl font-bold">
            {campaign.name}
        </h1>
        <p class="text-gray-700">{campaign.description || 'No description provided.'}</p>
        <div class="flex flex-wrap text-sm text-gray-500 space-x-4">
          <span>Category: <strong>{campaign.category}</strong></span>
          <span>Target ZIP: <strong>{campaign.targetZip}</strong></span>
          <span>Radius: <strong>{campaign.radius} miles</strong></span>
          <span>Status: <strong>{campaign.status}</strong></span>
          <span>Created: <strong>{campaign.createdAt}</strong></span>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
        <User class="w-6 h-6 text-blue-500" />
        <div>
          <div class="text-lg font-semibold">{campaign.leads.length}</div>
          <div class="text-sm text-gray-500">Leads</div>
        </div>
      </div>
      <div class="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
        <Mail class="w-6 h-6 text-green-500" />
        <div>
          <div class="text-lg font-semibold">{campaign.leads.filter(l => l.status !== 'pending').length}</div>
          <div class="text-sm text-gray-500">Emails Sent</div>
        </div>
      </div>
      <div class="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
        <CheckCircle class="w-6 h-6 text-purple-500" />
        <div>
          <div class="text-lg font-semibold">{campaign.leads.filter(l => l.status === 'replied').length}</div>
          <div class="text-sm text-gray-500">Replies</div>
        </div>
      </div>
    </div>

    <!-- Leads Table -->
    <section class="bg-white p-6 rounded-lg shadow mt-6">
      <h2 class="text-lg font-semibold mb-4">Leads</h2>
      {#if campaign.leads.length === 0}
        <p class="text-gray-500">No leads added to this campaign yet.</p>
      {:else}
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="px-4 py-2">Name</th>
              <th class="px-4 py-2">Email</th>
              <th class="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each campaign.leads as lead}
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-2">{lead.name}</td>
              <td class="px-4 py-2">{lead.email}</td>
              <td class="px-4 py-2">{lead.status}</td>
            </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
  {/if}
</div>

<!-- Confirm Modal -->
{#if showConfirm}
  <ConfirmModal
    message="Are you sure you want to delete this campaign?"
    confirmText="Delete"
    cancelText="Cancel"
    loading={deletingId !== null}
    on:confirm={deleteCampaign}
    on:cancel={cancelDelete}
  />
{/if}
