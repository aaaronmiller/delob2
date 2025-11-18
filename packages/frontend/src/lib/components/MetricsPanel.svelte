<script lang="ts">
  import { onMount } from 'svelte';

  let metrics = {
    totalSessions: 0,
    activeSessions: 0,
    totalTokens: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    contextUtilization: 0
  };

  onMount(async () => {
    // TODO: Fetch metrics from API
  });

  function getContextColor(ratio: number): string {
    if (ratio >= 0.9) return 'text-red-400';
    if (ratio >= 0.85) return 'text-yellow-400';
    return 'text-green-400';
  }
</script>

<div class="space-y-4">
  <!-- Token Utilization -->
  <div class="p-4 bg-slate-700/50 rounded-lg">
    <div class="flex justify-between items-center mb-2">
      <span class="text-sm text-slate-400">Context Utilization</span>
      <span class="text-sm font-mono {getContextColor(metrics.contextUtilization)}">
        {(metrics.contextUtilization * 100).toFixed(1)}%
      </span>
    </div>
    <div class="w-full bg-slate-600 rounded-full h-2">
      <div
        class="h-2 rounded-full transition-all duration-300"
        class:bg-green-500={metrics.contextUtilization < 0.85}
        class:bg-yellow-500={metrics.contextUtilization >= 0.85 && metrics.contextUtilization < 0.9}
        class:bg-red-500={metrics.contextUtilization >= 0.9}
        style="width: {metrics.contextUtilization * 100}%"
      ></div>
    </div>
    <div class="flex justify-between text-xs text-slate-500 mt-1">
      <span>0%</span>
      <span class="text-yellow-600">85%</span>
      <span class="text-red-600">90%</span>
      <span>100%</span>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-2 gap-3">
    <div class="p-3 bg-slate-700/50 rounded-lg">
      <div class="text-2xl font-bold text-blue-400">{metrics.activeSessions}</div>
      <div class="text-xs text-slate-400">Active Sessions</div>
    </div>

    <div class="p-3 bg-slate-700/50 rounded-lg">
      <div class="text-2xl font-bold text-purple-400">{metrics.totalTokens.toLocaleString()}</div>
      <div class="text-xs text-slate-400">Total Tokens</div>
    </div>

    <div class="p-3 bg-slate-700/50 rounded-lg">
      <div class="text-2xl font-bold text-yellow-400">{metrics.totalAlerts}</div>
      <div class="text-xs text-slate-400">Total Alerts</div>
    </div>

    <div class="p-3 bg-slate-700/50 rounded-lg">
      <div class="text-2xl font-bold text-red-400">{metrics.criticalAlerts}</div>
      <div class="text-xs text-slate-400">Critical Alerts</div>
    </div>
  </div>
</div>
