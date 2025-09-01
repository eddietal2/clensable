<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { X, ChevronLeft } from 'lucide-svelte';
  import { buttonBase, greenGradient, blueGradient, greenText } from '$lib/styles';
    import { fly } from 'svelte/transition';

  let showIntroCard = true;

  type LeadData = {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  };

  type OutreachLead = {
    id: string;
    placeId: string;
    leadData: LeadData;
    status: string;
    createdAt: string;
  };

  let campaignId = $page.params.campaignId;
  let leadId = $page.params.leadId;

  let lead: OutreachLead | null = null;
  let loading = true;
  let error: string | null = null;

  // Mock AI message state
  let messageDraft = '';
  let sending = false;

  onMount(async () => {
    try {
      const res = await fetch(`/api/outreach/campaign/${campaignId}/${leadId}`);
      if (!res.ok) throw new Error('Failed to fetch lead data');
      lead = await res.json();
    } catch (err: any) {
      console.error(err);
      error = err.message;
    } finally {
      loading = false;
    }
  });

  function goBack() {
    goto(`/app/outreach/${campaignId}`);
  }

  function sendMessage() {
    if (!messageDraft.trim() || !lead) return;
    sending = true;
    // Here you would call your API to send email/SMS
    setTimeout(() => {
      sending = false;
      messageDraft = '';
      alert('Message sent (mock)');
    }, 1000);
  }

  function markStatus(newStatus: string) {
    if (!lead) return;
    lead.status = newStatus;
    // API call to persist status can go here
  }
</script>

<main class="p-6 w-4xl mx-auto space-y-6">
  {#if showIntroCard}
    <div class="relative shadow mt-8 bg-gradient-to-b from-[#FACC1510] to-[#B59F0020] p-4 max-w-4xl rounded-lg border-l-4 border-yellow-500"
         transition:fly={{ x: 20, duration: 150 }}>
      <button class="absolute top-2 right-2 p-1 rounded hover:bg-yellow-100 transition"
              on:click={() => (showIntroCard = false)}
              aria-label="Close">
        <X class="h-5 w-5 text-gray-600" />
      </button>
  
      <h2 class="text-2xl font-bold mb-2 jura">AI Assitant Outreach & Tracking</h2>
      <p class="text-gray-700">
        A campaign is a targeted outreach effort to potential clients for your cleaning services. 
        It allows you to define the market segment, geographic area, and messaging for your outreach. 
        Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus 
        on the most promising prospects.
      </p>
    </div>
  {/if}
  <div class="h-4"></div>
  {#if loading}
    <p>Loading lead...</p>
  {:else if error}
    <p class="text-red-500">{error}</p>
  {:else if lead}
    <!-- Back Button -->
    <button class="flex items-center px-4 py-1 rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 text-sm mb-4"
            on:click={goBack}>
      <ChevronLeft class="w-4 h-4 mr-1"/>
      Back to Campaign
    </button>

    <!-- Lead Info -->
    <section class="bg-white p-4 rounded-lg shadow space-y-2">
      <h1 class={`${greenText}`}>{lead.leadData.name ?? lead.placeId}</h1>
      {#if lead.leadData.email}<p>Email: {lead.leadData.email}</p>{/if}
      {#if lead.leadData.phone}<p>Phone: {lead.leadData.phone}</p>{/if}
      {#if lead.leadData.address}<p>Address: {lead.leadData.address}</p>{/if}
      <p class="text-sm text-gray-500">Status: <strong>{lead.status}</strong></p>

      <!-- Status Buttons -->
      <div class="flex space-x-2 mt-2">
        <!-- <button class={`${greenGradient} ${buttonBase} text-sm py-1`} on:click={() => markStatus('contacted')}>Mark Contacted</button>
        <button class={`${blueGradient} ${buttonBase} text-sm py-1`} on:click={() => markStatus('replied')}>Mark Replied</button> -->
      </div>
    </section>

    <!-- AI Message Draft -->
    <section class="bg-white p-4 rounded-lg shadow space-y-2">
      <h2 class="font-semibold">Send Message</h2>
      <textarea 
        bind:value={messageDraft} 
        class="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-green-300"
        rows="4"
        placeholder="Compose an email or SMS using AI..."></textarea>
      <div class="flex gap-2">
        <button class={`${blueGradient} ${buttonBase} text-sm py-1 mt-2`} on:click={sendMessage} disabled={sending}>
          Generate Message
        </button>
        <button class={`${greenGradient} ${buttonBase} text-sm py-1 mt-2`} on:click={sendMessage} disabled={sending}>
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </section>

    <!-- Activity / History -->
    <section class="bg-white p-4 rounded-lg shadow space-y-2">
      <h2 class="font-semibold">Lead Activity</h2>
      <!-- Example static list -->
      <ul class="divide-y divide-gray-200 text-sm text-gray-700">
        <li class="py-1">Lead added: 3 days ago</li>
        <li class="py-1">Message sent: 2 days ago</li>
        <li class="py-1">Lead replied: 1 day ago</li>
      </ul>
    </section>
  {/if}
</main>
