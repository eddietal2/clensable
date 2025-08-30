<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';
  import { User } from 'lucide-svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { currentCampaign, type CampaignStore } from '$lib/stores/campaign';
  import { onMount } from 'svelte';

  let { children } = $props();

  // ✅ campaigns is reactive
  let campaigns = $state<CampaignStore[]>([]);

  // Selected campaign ID
  let selectedCampaignId = $state('');

  // Fetch campaigns from API
  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      campaigns = await res.json();
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  }

  // ✅ Keep local `selectedCampaignId` in sync with global store
  $effect(() => {
    const c = $currentCampaign; // auto-subscription in runes
    if (c) {
      selectedCampaignId = c.id; // update dropdown when +page sets currentCampaign
    }
  });

  // ✅ Update global store when user changes dropdown
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
      if (staticTitles[path]) {
        return staticTitles[path];
      }
      const match = path.match(/^\/app\/campaigns\/([^\/]+)$/);
      if (match) {
        return $currentCampaign ? $currentCampaign.name : `Campaign ${match[1]}`;
      }
      return 'Dashboard';
    }
  );

  onMount(fetchCampaigns);
</script>

<svelte:head>
  <title>Clensable Dashboard</title>
</svelte:head>

<div class="min-h-screen flex bg-gray-100">
  <!-- Sidebar -->
  <aside class="w-64 fixed top-0 left-0 h-screen bg-gradient-to-b from-[#fff] to-[#fff] text-white flex flex-col">
    <div class="p-6 font-bold text-xl border-b border-white/20">
      <img src="/logos/Complete_Logo_Green.png" class="h-6" alt="Logo" />
    </div>

    <nav class="flex-1 p-4 space-y-2 overflow-y-auto jura">
      <a href="/app" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app') ? 'bg-green-300/30 font-semibold' : ''}">Home</a>
      <a href="/app/campaigns" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app/campaigns') ? 'bg-green-300/30 font-semibold' : ''}">Campaigns</a>
      <a href="/app/leads" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app/leads') ? 'bg-green-300/30 font-semibold' : ''}">Leads</a>
      <a href="/app/outreach" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app/outreach') ? 'bg-green-300/30 font-semibold' : ''}">Outreach</a>
      <a href="/app/analytics" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app/analytics') ? 'bg-green-300/30 font-semibold' : ''}">Analytics</a>
      <a href="/app/team" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app/team') ? 'bg-green-300/30 font-semibold' : ''}">Team</a>
      <a href="/app/settings" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app/settings') ? 'bg-green-300/30 font-semibold' : ''}">Settings</a>
      <a href="/app/help" class="block py-2 px-3 text-black rounded-lg hover:bg-green-200/10 {isActive('/app/help') ? 'bg-green-300/30 font-semibold' : ''}">Help</a>
    </nav>

    <div class="p-4 border-t border-white/20">
      <a href="/app/profile" class="flex items-center space-x-2 hover:text-yellow-300 jura">
        <User class="h-4 w-4" />
        <span>Profile</span>
      </a>
    </div>
  </aside>

  <!-- Main content -->
  <div class="flex-1 flex flex-col ml-64">
    <!-- Top bar -->
    <header class="h-16 bg-white/60 backdrop-blur-md shadow flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-20">
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
