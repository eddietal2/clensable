<script lang="ts">
  import { FileText, CheckCircle } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  let campaignName = '';
  let description = '';
  let targetZip = '';
  let radius = 10;
  let category = '';

  let errorMsg = '';
  let loading = false;
  let success = false;

  async function createCampaign() {
    errorMsg = '';
    loading = true;
    success = false;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          description,
          targetZip,
          radius,
          category
        })
      });

      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || 'Failed to create campaign';
        return;
      }

      // ✅ Instead of redirecting immediately, show success UI
      success = true;
    } catch (err) {
      console.error(err);
      errorMsg = 'Unexpected error while creating campaign';
    } finally {
      loading = false;
    }
  }

  function goToCampaigns() {
    goto('/app/campaigns');
  }
</script>

<div class="max-w-2xl mx-auto p-6 space-y-6 mt-10">

  <!-- Success Message -->
  {#if success}
    <div class="bg-green-50 border border-green-300 text-green-800 p-6 rounded-lg text-center space-y-4">
      <CheckCircle class="w-10 h-10 mx-auto text-green-600" />
      <h2 class="text-xl font-semibold">Campaign Created Successfully!</h2>
      <p class="text-gray-700">Your campaign <strong>{campaignName}</strong> has been created.</p>
      <button 
        class="bg-gradient-to-r from-[#00CF68] to-[#187967] 
               text-white px-6 py-3 rounded-lg font-semibold 
               hover:from-[#00b55c] hover:to-[#145c55] transition"
        on:click={goToCampaigns}
      >
        Go to Campaigns
      </button>
    </div>
  {:else}
    <!-- Normal Form -->
    <div class="bg-gradient-to-r from-[#CFFFE030] to-[#B2F1D670] p-4 rounded-lg border-l-4 border-green-500">
      <h2 class="text-lg font-semibold mb-2">What is a Campaign?</h2>
      <p class="text-gray-700">
        A campaign is a targeted outreach effort to potential clients for your cleaning services. 
        It allows you to define the market segment, geographic area, and messaging for your outreach. 
        Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus 
        on the most promising prospects.
      </p>
    </div>

    {#if errorMsg}
      <p class="text-red-600">{errorMsg}</p>
    {/if}

    <div class="space-y-4">
      <div>
        <label class="block font-semibold mb-1">Campaign Name</label>
        <input type="text" bind:value={campaignName} class="w-full border rounded px-3 py-2" placeholder="My Summer Campaign" />
      </div>

      <div>
        <label class="block font-semibold mb-1">Description</label>
        <textarea bind:value={description} class="w-full border rounded px-3 py-2" placeholder="Add campaign details" rows="4"></textarea>
      </div>

      <div>
        <label class="block font-semibold mb-1">Target Zip Code</label>
        <input type="text" bind:value={targetZip} class="w-full border rounded px-3 py-2" placeholder="48134" />
      </div>

      <div class="flex space-x-4">
        <div class="flex-1">
          <label class="block font-semibold mb-1">Radius (miles)</label>
          <input type="number" bind:value={radius} min="1" class="w-full border rounded px-3 py-2" />
        </div>

        <div class="flex-1">
          <label class="block font-semibold mb-1">Category</label>
          <input type="text" bind:value={category} class="w-full border rounded px-3 py-2" />
          <label class="block text-xs mt-1">
            Select the primary market segment to target (e.g., Restaurants, Offices, Medical Facilities). Only one category can be chosen per campaign.
          </label>
        </div>
      </div>

      <button 
        class="bg-gradient-to-r from-[#00CF68] to-[#187967] 
               text-white px-6 py-3 rounded-lg font-semibold 
               hover:from-[#00b55c] hover:to-[#145c55] 
               transition flex items-center space-x-2"
        on:click|preventDefault={createCampaign}
        disabled={loading}
      >
        <FileText class="w-5 h-5" />
        <span>{loading ? 'Creating...' : 'Create Campaign'}</span>
      </button>
    </div>
  {/if}
</div>
