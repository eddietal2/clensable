<script lang="ts">
  import { User, Mail, FileText, CheckCircle, X } from 'lucide-svelte';
  import { greenGradient, blueGradient, buttonBase, greenText } from '$lib/styles';
    import { fly } from 'svelte/transition';
  
  // Props from server load
  export let data: {
    org: {
      id: string;
      name: string;
      zip?: string;
      serviceType?: string;
      stripeCustomerId?: string;
      users: { id: string; firstName: string; lastName: string; email: string }[];
      campaigns: { id: string; name: string }[];
    } | null;
  };

  let showIntroCard = true;

  const org = data.org;

  // Metrics
  const campaignsCount = org?.campaigns.length ?? 0;
  const leadsCount = 120;
  const emailsSent = 250;
  const emailsPending = 40;
  const emailsReplied = 75;

  const recentActivities = [
    { title: "Lead added: Acme Co", time: "2h ago" },
    { title: "Campaign launched: Q4 Detroit Outreach", time: "1d ago" },
    { title: "Lead scored: Beta LLC", time: "3d ago" }
  ];
</script>

<div class="p-6 mt-6 w-4xl mx-auto space-y-4">
  {#if showIntroCard}
    <div class="relative shadow mt-2 bg-gradient-to-b from-[#FACC1510] to-[#B59F0020] p-4 max-w-4xl rounded-lg border-l-4 border-yellow-500"
         transition:fly={{ x: 20, duration: 150 }}>
      <button class="absolute top-2 right-2 p-1 rounded hover:bg-yellow-100 transition"
              on:click={() => (showIntroCard = false)}
              aria-label="Close">
        <X class="h-5 w-5 text-gray-600" />
      </button>
  
      <h2 class="text-2xl font-bold mb-2 jura">Welcome to Clensable 👋</h2>
      <p class="text-gray-700">
        A campaign is a targeted outreach effort to potential clients for your cleaning services. 
        It allows you to define the market segment, geographic area, and messaging for your outreach. 
        Each campaign will track leads, emails sent, replies, and overall effectiveness so you can focus 
        on the most promising prospects.
      </p>
    </div>
  {/if}
  <!-- Row 1: Org Info + Campaigns/Outreach -->
  <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">

    <!-- Org Info Card -->
    {#if org}
      <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col justify-between h-full">
        <div>
          <h2 class={`${greenText}`}>{org.name}</h2>
          <p class="text-gray-500 text-sm">ZIP: {org.zip ?? 'N/A'}</p>
          <p class="text-gray-500 text-sm">Users: {org.users.length}</p>
          <div class="mt-1 space-y-0.5">
            {#each org.users as user}
              <p class="text-gray-500 text-xs">{user.firstName} {user.lastName} ({user.email})</p>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Campaigns + Outreach + Actions Card -->
    <div class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <!-- Campaigns -->
      <div class="flex items-center space-x-3">
        <FileText class="w-6 h-6 text-green-600" />
        <div>
          <h3 class="text-gray-500 text-sm font-semibold">Campaigns</h3>
          <span class="text-xl font-bold">{campaignsCount}</span>
        </div>
      </div>

      <!-- Outreach Metrics -->
      <div class="flex flex-col space-y-1 mt-2">
        <h3 class="text-gray-500 text-sm font-semibold flex items-center space-x-1">
          <Mail class="w-4 h-4 text-yellow-600" />
          <span>Outreach</span>
        </h3>
        <div class="text-gray-500 text-xs flex justify-between">
          <span>Sent: {emailsSent}</span>
          <span>Pending: {emailsPending}</span>
          <span>Replied: {emailsReplied}</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-col sm:flex-row sm:space-x-2 mt-3 space-y-1 sm:space-y-0">
        <a href="/app/campaigns/create" class={`${greenGradient} ${buttonBase} flex items-center justify-center text-sm py-1 transition-transform hover:scale-105`}>
          <FileText class="w-4 h-4 mr-1" />
          <span>Create Campaign</span>
        </a>
        <a href="/app/leads" class={`${blueGradient} ${buttonBase} flex items-center justify-center text-sm py-1 transition-transform hover:scale-105`}>
          <User class="w-4 h-4 mr-1" />
          <span>Add Leads</span>
        </a>
      </div>
    </div>

  </section>

  <!-- Row 2: Recent Activity -->
  <section class="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
    <h2 class="text-md font-semibold mb-2 flex items-center space-x-2">
      <CheckCircle class="w-4 h-4 text-green-600" />
      <span>Recent Activity</span>
    </h2>
    <ul class="space-y-1 text-gray-500 text-sm">
      {#each recentActivities as activity}
        <li>{activity.time} — {activity.title}</li>
      {/each}
    </ul>
  </section>

</div>




