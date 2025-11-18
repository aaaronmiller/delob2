<script lang="ts">
  import type { RunManifest } from '@delobotomize/shared';
  import { onMount } from 'svelte';

  let runs: RunManifest[] = [];
  let selectedRun: RunManifest | null = null;

  onMount(async () => {
    // TODO: Fetch runs from API
  });

  function getStatusColor(status: RunManifest['status']): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-warning';
      case 'failed': return 'badge-error';
      default: return 'bg-slate-700 text-slate-300';
    }
  }

  function selectRun(run: RunManifest) {
    selectedRun = selectedRun?.runId === run.runId ? null : run;
  }
</script>

<div class="space-y-4">
  {#if runs.length === 0}
    <div class="text-center py-8 text-slate-400">
      <p>No runs found</p>
      <p class="text-sm mt-2">Run history will appear here</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each runs as run}
        <div class="border border-slate-700 rounded-lg overflow-hidden">
          <button
            class="w-full p-4 bg-slate-700/50 hover:bg-slate-700 transition text-left"
            on:click={() => selectRun(run)}
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="font-mono text-sm text-slate-300">{run.runId}</span>
                <span class="badge {getStatusColor(run.status)}">{run.status}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-xs text-slate-400">{run.timestamp}</span>
                <svg
                  class="w-4 h-4 text-slate-400 transition-transform"
                  class:rotate-180={selectedRun?.runId === run.runId}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>

            <div class="grid grid-cols-4 gap-4 mt-3 text-sm">
              <div>
                <span class="text-slate-400">Phases:</span>
                <span class="text-slate-200 ml-2">{run.phases.length}</span>
              </div>
              <div>
                <span class="text-slate-400">Tokens:</span>
                <span class="text-slate-200 ml-2">{run.metrics.totalTokens.toLocaleString()}</span>
              </div>
              <div>
                <span class="text-slate-400">Alerts:</span>
                <span class="text-slate-200 ml-2">{run.metrics.totalAlerts}</span>
              </div>
              {#if run.metrics.estimatedCost}
                <div>
                  <span class="text-slate-400">Cost:</span>
                  <span class="text-slate-200 ml-2">${run.metrics.estimatedCost.toFixed(4)}</span>
                </div>
              {/if}
            </div>
          </button>

          {#if selectedRun?.runId === run.runId}
            <div class="p-4 bg-slate-800/50 border-t border-slate-700">
              <h4 class="text-sm font-semibold mb-3 text-slate-300">Phases</h4>
              <div class="space-y-2">
                {#each run.phases as phase}
                  <div class="p-3 bg-slate-700/50 rounded">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-slate-200">{phase.name}</span>
                      <span class="badge {getStatusColor({ status: phase.status } as any)}">
                        {phase.status}
                      </span>
                    </div>
                    {#if phase.duration}
                      <div class="text-xs text-slate-400">
                        Duration: {(phase.duration / 1000).toFixed(2)}s
                      </div>
                    {/if}
                    {#if phase.artifacts.length > 0}
                      <div class="text-xs text-slate-400 mt-1">
                        Artifacts: {phase.artifacts.join(', ')}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
