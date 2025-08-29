<script lang="ts">
  import { onMount } from 'svelte';
  import { User, Mail, FileText, CheckCircle } from 'lucide-svelte';
  import { addToast } from '$lib/stores/toast';

  let campaignsCount: number;
  let leadsCount = 120;
  let emailsSent = 250;
  let emailsPending = 40;
  let emailsReplied = 75;

  let recentActivities = [
    { title: "Lead added: Acme Co", time: "2h ago" },
    { title: "Campaign launched: Q4 Detroit Outreach", time: "1d ago" },
    { title: "Lead scored: Beta LLC", time: "3d ago" }
  ];

  // Fetch campaigns count on mount
  onMount(async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      campaignsCount = data.length;
    } catch (err) {
      console.error(err);
      addToast('Failed to load campaigns count', 'error');
    }
  });
</script>


<div class="space-y-6 p-6 mt-14">

  <!-- Key Metrics Cards -->
  <section class="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div class="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
      <FileText class="w-8 h-8 text-green-600" />
      <div>
        <h3 class="text-gray-500 font-semibold">Campaigns</h3>
        <span class="text-2xl font-bold">{campaignsCount}</span>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
      <User class="w-8 h-8 text-blue-600" />
      <div>
        <h3 class="text-gray-500 font-semibold">Leads</h3>
        <span class="text-2xl font-bold">{leadsCount}</span>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow flex flex-col space-y-2">
      <h3 class="text-gray-500 font-semibold flex items-center space-x-2">
        <Mail class="w-5 h-5 mr-1 text-yellow-600" />
        Outreach
      </h3>
      <span class="text-sm text-gray-500">Sent: {emailsSent}</span>
      <span class="text-sm text-gray-500">Pending: {emailsPending}</span>
      <span class="text-sm text-gray-500">Replied: {emailsReplied}</span>
    </div>
  </section>

  <!-- Quick Actions -->
  <section class="bg-white p-6 rounded-lg shadow flex flex-col sm:flex-row sm:space-x-6 space-y-4 sm:space-y-0">
    <a href="/app/campaigns/create"
      class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2">
      <FileText class="w-5 h-5" />
      <span>Create Campaign</span>
    </a>
    <button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2">
      <User class="w-5 h-5" />
      <span>Add Leads</span>
    </button>
  </section>

  <!-- Recent Activity -->
  <section class="bg-white p-6 rounded-lg shadow">
    <h2 class="text-lg font-semibold mb-4 flex items-center space-x-2">
      <CheckCircle class="w-5 h-5 mr-2 text-green-600" />
      Recent Activity
    </h2>
    <ul class="space-y-2">
      {#each recentActivities as activity}
        <li class="text-gray-500">{activity.time} — {activity.title}</li>
      {/each}
    </ul>
  </section>

</div>
