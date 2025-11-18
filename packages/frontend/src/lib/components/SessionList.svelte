<script lang="ts">
  import type { SessionState } from '@delobotomize/shared';
  import { onMount } from 'svelte';

  let sessions: SessionState[] = [];

  onMount(async () => {
    // TODO: Fetch sessions from API
    // const response = await fetch('/api/sessions');
    // sessions = await response.json();
  });

  function getStatusColor(status: SessionState['status']): string {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'idle': return 'text-yellow-400';
      case 'stalled': return 'text-red-400';
      case 'completed': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  }

  function getBadgeClass(status: SessionState['status']): string {
    switch (status) {
      case 'active': return 'badge-success';
      case 'idle': return 'badge-warning';
      case 'stalled': return 'badge-error';
      case 'completed': return 'badge-info';
      default: return 'bg-slate-700 text-slate-300';
    }
  }
</script>

<div class="space-y-3">
  {#if sessions.length === 0}
    <div class="text-center py-8 text-slate-400">
      <p>No active sessions</p>
      <p class="text-sm mt-2">Sessions will appear here when monitoring is active</p>
    </div>
  {:else}
    {#each sessions as session}
      <div class="p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 transition">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="font-mono text-sm text-slate-300">{session.sessionId}</span>
            <span class="badge {getBadgeClass(session.status)}">
              {session.status}
            </span>
          </div>
          <span class="text-xs text-slate-400">{session.lastActivity}</span>
        </div>

        {#if session.phase}
          <div class="text-sm text-slate-400 mb-2">
            Phase: <span class="text-blue-400">{session.phase}</span>
          </div>
        {/if}

        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="text-slate-400">Tokens:</span>
            <span class="font-mono text-slate-200 ml-2">{session.tokenUsage.totalTokens.toLocaleString()}</span>
          </div>
          <div>
            <span class="text-slate-400">Alerts:</span>
            <span class="font-mono text-slate-200 ml-2">{session.alerts.length}</span>
          </div>
          {#if session.tokenUsage.contextRatio !== undefined}
            <div>
              <span class="text-slate-400">Context:</span>
              <span class="font-mono text-slate-200 ml-2">{(session.tokenUsage.contextRatio * 100).toFixed(1)}%</span>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
</div>
