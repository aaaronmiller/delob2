<script lang="ts">
  import SessionList from '$lib/components/SessionList.svelte';
  import MetricsPanel from '$lib/components/MetricsPanel.svelte';
  import AlertsTray from '$lib/components/AlertsTray.svelte';
  import RunsView from '$lib/components/RunsView.svelte';
</script>

<svelte:head>
  <title>Delobotomize Dashboard</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header Section -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card">
      <h2 class="text-xl font-semibold mb-4">Live Sessions</h2>
      <SessionList />
    </div>

    <div class="card">
      <h2 class="text-xl font-semibold mb-4">Metrics</h2>
      <MetricsPanel />
    </div>
  </div>

  <!-- Alerts Section -->
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">Alerts</h2>
    <AlertsTray />
  </div>

  <!-- Runs Section -->
  <div class="card">
    <h2 class="text-xl font-semibold mb-4">Recent Runs</h2>
    <RunsView />
  </div>
</div>
