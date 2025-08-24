<!-- src/routes/app/+layout.svelte -->
<script lang="ts">
  import { User } from 'lucide-svelte';
  let { children } = $props();
  
</script>

<svelte:head>
  <title>Clensable Dashboard</title>
</svelte:head>

<div class="min-h-screen flex bg-gray-100">
  <!-- Sidebar -->
  <aside class="w-64 bg-gradient-to-b from-[#00CF68] to-[#187967] text-white flex flex-col">
    <div class="p-6 font-bold text-xl border-b border-white/20">
      <img src="/logos/Complete_Logo_White.png" class="h-6" alt="" srcset="">
    </div>
    <nav class="flex-1 p-4 space-y-2">
      <a href="/app" class="block py-2 px-3 rounded-lg hover:bg-white/10">Dashboard</a>
      <a href="/app/leads" class="block py-2 px-3 rounded-lg hover:bg-white/10">Leads</a>
      <a href="/app/settings" class="block py-2 px-3 rounded-lg hover:bg-white/10">Settings</a>
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
      <h1 class="text-lg font-semibold">Dashboard</h1>
      <!-- <div class="flex items-center space-x-4">
        <span class="text-gray-600">Welcome back!</span>
        <img src="https://via.placeholder.com/40" alt="user avatar" class="h-10 w-10 rounded-full" />
      </div> -->
    </header>

    <!-- Page Content -->
    <main class="flex-1 p-6">
      {@render children?.()}
    </main>
  </div>
</div>
