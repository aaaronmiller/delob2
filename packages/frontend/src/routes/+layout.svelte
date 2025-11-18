<script lang="ts">
  import '../app.css';
</script>

<div class="min-h-screen bg-slate-900">
  <header class="bg-slate-800 border-b border-slate-700">
    <div class="container mx-auto px-4 py-4">
      <h1 class="text-2xl font-bold text-blue-400">Delobotomize Dashboard</h1>
      <p class="text-slate-400 text-sm">Claude Code Monitoring & Recovery</p>
    </div>
  </header>

  <main class="container mx-auto px-4 py-8">
    <slot />
  </main>

  <footer class="bg-slate-800 border-t border-slate-700 mt-auto">
    <div class="container mx-auto px-4 py-4 text-center text-slate-400 text-sm">
      Delobotomize v1.0.0
    </div>
  </footer>
</div>
