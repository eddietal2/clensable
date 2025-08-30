<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';
  import { User, Menu, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { currentCampaign, type CampaignStore } from '$lib/stores/campaign';
  import { onMount } from 'svelte';

  let { children } = $props();

  let campaigns = $state<CampaignStore[]>([]);
  let selectedCampaignId = $state('');
  let isSidebarOpen = $state(true); // ✅ collapsible state

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      campaigns = await res.json();
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  }

  $effect(() => {
    const c = $currentCampaign;
    if (c) selectedCampaignId = c.id;
  });

  $effect(() => {
    const c = campaigns.find(c => c.id === selectedCampaignId);
    if (c) currentCampaign.set(c);
  });

  const isActive = (path: string) => $page.url.pathname === path;

  const staticTitles: Record<string, string> = {
    '/app': 'Home',
    '/app/campaigns': 'Campaigns',
    '/app/campaigns/create': 'Create New Campaign',
    '/app/leads': 'Leads',
    '/app/outreach': 'Outreach',
    '/app/analytics': 'Analytics',
    '/app/team': 'Team',
    '/app/settings': 'Settings',
    '/app/help': 'Help',
    '/app/profile': 'Profile'
  };

  const currentTitle = derived(
    [page, currentCampaign],
    ([$page, $currentCampaign]) => {
      const path = $page.url.pathname;
      if (staticTitles[path]) return staticTitles[path];
      const match = path.match(/^\/app\/campaigns\/([^\/]+)$/);
      if (match) {
        return $currentCampaign ? $currentCampaign.name : `Campaign ${match[1]}`;
      }
      return 'Dashboard';
    }
  );

  onMount(fetchCampaigns);
</script>

<div class="min-h-screen flex bg-gray-100">
  <!-- Sidebar -->
  <aside
    class={`${
      isSidebarOpen ? 'w-64' : 'w-16'
    } fixed top-0 left-0 h-screen bg-gradient-to-b from-[#fff] to-[#fff] text-black flex flex-col transition-all duration-300`}
  >
    <div class="p-4 flex items-center justify-between border-b border-gray-200">
      {#if isSidebarOpen}
        <img src="/logos/Complete_Logo_Green.png" class="h-6" alt="Logo" />
      {/if}
      <button
        class="p-1 rounded hover:bg-gray-200"
        onclick={() => (isSidebarOpen = !isSidebarOpen)}
      >
        {#if isSidebarOpen}
          <ChevronLeft class="h-5 w-5" />
        {:else}
          <ChevronRight class="h-5 w-5" />
        {/if}
      </button>
    </div>

    <nav class="flex-1 p-2 space-y-1 overflow-y-auto jura">
      <a href="/app" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Home' : '🏠'}</span>
      </a>
      <a href="/app/campaigns" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app/campaigns') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Campaigns' : '📊'}</span>
      </a>
      <a href="/app/leads" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app/leads') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Leads' : '👥'}</span>
      </a>
      <a href="/app/outreach" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app/outreach') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Outreach' : '📨'}</span>
      </a>
      <a href="/app/analytics" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app/analytics') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Analytics' : '📈'}</span>
      </a>
      <a href="/app/team" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app/team') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Team' : '👨‍👩‍👧‍👦'}</span>
      </a>
      <a href="/app/settings" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app/settings') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Settings' : '⚙️'}</span>
      </a>
      <a href="/app/help" class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-green-200/10 {isActive('/app/help') ? 'bg-green-300/30 font-semibold' : ''}">
        <span class="truncate">{isSidebarOpen ? 'Help' : '❓'}</span>
      </a>
    </nav>

    <div class="p-4 border-t border-gray-200">
      <a href="/app/profile" class="flex items-center gap-2 hover:text-green-600 jura">
        <User class="h-4 w-4" />
        {#if isSidebarOpen}<span>Profile</span>{/if}
      </a>
    </div>
  </aside>

  <!-- Main content -->
  <div class={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
    <!-- Top bar -->
    <header
      class={`h-16 bg-white/60 backdrop-blur-md shadow flex items-center justify-between px-6 fixed top-0 transition-all duration-300 ${
        isSidebarOpen ? 'left-64' : 'left-16'
      } right-0 z-20`}
    >
      <h1 class="text-2xl font-semibold jura">{$currentTitle}</h1>

      <!-- Campaign Dropdown -->
      <div class="ml-auto flex items-center space-x-2">
        <p class="text-gray-700 text-sm font-medium">Campaign:</p>
        <select
          bind:value={selectedCampaignId}
          class="border rounded px-2 py-1 w-58"
        >
          {#each campaigns as c}
            <option value={c.id}>{c.name}</option>
          {/each}
        </select>
      </div>
    </header>

    <!-- Page Content -->
    <main class="flex-1 p-6 mt-16 overflow-auto">
      {@render children?.()}
    </main>
  </div>
</div>

<Toast />
