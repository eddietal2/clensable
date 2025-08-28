<!-- src/routes/campaigns/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { FileText } from 'lucide-svelte';

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

  onMount(() => {
    fetchCampaigns();
  });
</script>

<div class="space-y-6 p-6 mt-10">
  <!-- Header / Quick Actions -->
  <div class="flex justify-between items-center">
    <a href="/app/campaigns/create">
      <button 
        class="bg-gradient-to-r from-[#00CF68] to-[#187967] 
               text-white px-4 py-2 rounded-lg font-semibold 
               hover:from-[#00b55c] hover:to-[#145c55] 
               transition flex items-center space-x-2">
        <FileText class="w-5 h-5" />
        <span>New Campaign</span>
      </button>
    </a>
  </div>

  <!-- Campaigns Table -->
  <section class="bg-white p-6 rounded-lg shadow">
    {#if loading}
      <!-- Spinner -->
      <div class="mt-6 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
      </div>
    {:else if errorMsg}
      <p class="text-red-600">{errorMsg}</p>
    {:else}
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-gray-200">
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
              <button class="text-xs text-green-600 hover:underline">View</button>
              <button class="text-xs text-yellow-600 hover:underline">Edit</button>
              <button class="text-xs text-red-600 hover:underline">Delete</button>
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
