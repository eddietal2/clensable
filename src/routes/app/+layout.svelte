<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';
  import { User } from 'lucide-svelte';
  let { children } = $props();

  // Function to check if link is active
  const isActive = (path: string) => $page.url.pathname === path;

  const pageTitles: Record<string, string> = {
    '/app': 'Home',
    '/app/campaigns': 'Campaigns',
    '/app/leads': 'Leads',
    '/app/outreach': 'Outreach',
    '/app/analytics': 'Analytics',
    '/app/team': 'Team',
    '/app/settings': 'Settings',
    '/app/help': 'Help',
    '/app/profile': 'Profile'
  };

  // Use derived store instead of $:
  const currentTitle = derived(page, ($page) => pageTitles[$page.url.pathname] || 'Dashboard');
</script>


<svelte:head>
  <title>Clensable Dashboard</title>
</svelte:head>

<div class="min-h-screen flex bg-gray-100">
  <!-- Sidebar -->
  <aside class="w-64 bg-gradient-to-b from-[#00CF68] to-[#187967] text-white flex flex-col">
    <div class="p-6 font-bold text-xl border-b border-white/20">
      <img src="/logos/Complete_Logo_White.png" class="h-6" alt="" />
    </div>

    <nav class="flex-1 p-4 space-y-2">
      <a href="/app" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app') ? 'bg-white/30 font-semibold' : ''}">Home</a>
      <a href="/app/campaigns" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app/campaigns') ? 'bg-white/30 font-semibold' : ''}">Campaigns</a>
      <a href="/app/leads" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app/leads') ? 'bg-white/30 font-semibold' : ''}">Leads</a>
      <a href="/app/outreach" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app/outreach') ? 'bg-white/30 font-semibold' : ''}">Outreach</a>
      <a href="/app/analytics" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app/analytics') ? 'bg-white/20 font-semibold' : ''}">Analytics</a>
      <a href="/app/team" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app/team') ? 'bg-white/30 font-semibold' : ''}">Team</a>
      <a href="/app/settings" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app/settings') ? 'bg-white/30 font-semibold' : ''}">Settings</a>
      <a href="/app/help" class="block py-2 px-3 rounded-lg hover:bg-white/10 {isActive('/app/help') ? 'bg-white/30 font-semibold' : ''}">Help</a>
    </nav>

    <div class="p-4 border-t border-white/20">
      <a href="/app/profile" class="flex items-center space-x-2 hover:text-yellow-300">
        <User class="h-4 w-4" />
        <span>Profile</span>
      </a>
    </div>
  </aside>

  <!-- Main content -->
  <div class="flex-1 flex flex-col">
    <!-- Top bar -->
    <header class="h-16 bg-white shadow flex items-center justify-between px-6">
      <h1 class="text-lg font-semibold">{$currentTitle}</h1>
    </header>

    <!-- Page Content -->
    <main class="flex-1 p-6">
      {@render children?.()}
    </main>
  </div>
</div>
