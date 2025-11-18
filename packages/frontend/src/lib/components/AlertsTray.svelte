<script lang="ts">
  import type { Alert } from '@delobotomize/shared';
  import { onMount } from 'svelte';

  let alerts: Alert[] = [];
  let filterType: string = 'all';

  onMount(async () => {
    // TODO: Fetch alerts from API
  });

  function getSeverityColor(severity: Alert['severity']): string {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-500';
      case 'high': return 'text-orange-400 border-orange-500';
      case 'medium': return 'text-yellow-400 border-yellow-500';
      case 'low': return 'text-blue-400 border-blue-500';
      default: return 'text-slate-400 border-slate-500';
    }
  }

  function getSeverityBadge(severity: Alert['severity']): string {
    switch (severity) {
      case 'critical': return 'badge-error';
      case 'high': return 'badge-error';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-info';
      default: return 'bg-slate-700 text-slate-300';
    }
  }

  function getTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').toUpperCase();
  }

  async function acknowledgeAlert(alertId: string) {
    // TODO: Call API to acknowledge alert
    alerts = alerts.filter(a => a.id !== alertId);
  }

  $: filteredAlerts = filterType === 'all'
    ? alerts
    : alerts.filter(a => a.type === filterType);
</script>

<div class="space-y-4">
  <!-- Filter Controls -->
  <div class="flex gap-2 flex-wrap">
    <button
      class="btn {filterType === 'all' ? 'btn-primary' : 'btn-secondary'} text-sm"
      on:click={() => filterType = 'all'}
    >
      All
    </button>
    <button
      class="btn {filterType === 'rate_limit' ? 'btn-primary' : 'btn-secondary'} text-sm"
      on:click={() => filterType = 'rate_limit'}
    >
      Rate Limit
    </button>
    <button
      class="btn {filterType === 'context_saturation' ? 'btn-primary' : 'btn-secondary'} text-sm"
      on:click={() => filterType = 'context_saturation'}
    >
      Context
    </button>
    <button
      class="btn {filterType === 'deadlock' ? 'btn-primary' : 'btn-secondary'} text-sm"
      on:click={() => filterType = 'deadlock'}
    >
      Deadlock
    </button>
    <button
      class="btn {filterType === 'refusal' ? 'btn-primary' : 'btn-secondary'} text-sm"
      on:click={() => filterType = 'refusal'}
    >
      Refusal
    </button>
  </div>

  <!-- Alerts List -->
  <div class="space-y-2">
    {#if filteredAlerts.length === 0}
      <div class="text-center py-8 text-slate-400">
        <p>No alerts</p>
        <p class="text-sm mt-2">System is operating normally</p>
      </div>
    {:else}
      {#each filteredAlerts as alert}
        <div class="p-4 bg-slate-700/50 rounded-lg border-l-4 {getSeverityColor(alert.severity)}">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="badge {getSeverityBadge(alert.severity)}">
                  {alert.severity}
                </span>
                <span class="badge bg-slate-700 text-slate-300">
                  {getTypeLabel(alert.type)}
                </span>
                <span class="text-xs text-slate-400">{alert.timestamp}</span>
              </div>
              <p class="text-sm text-slate-200">{alert.message}</p>
              {#if alert.metadata}
                <details class="mt-2">
                  <summary class="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                    Show details
                  </summary>
                  <pre class="text-xs text-slate-400 mt-2 p-2 bg-slate-900 rounded overflow-x-auto">
{JSON.stringify(alert.metadata, null, 2)}
                  </pre>
                </details>
              {/if}
            </div>
            <button
              class="ml-4 text-slate-400 hover:text-slate-200 transition"
              on:click={() => acknowledgeAlert(alert.id)}
              title="Acknowledge"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
