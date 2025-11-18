import type { RecoveryPlan, RecoveryTask } from './types.js';

export class RecoveryPlannerService {
  async generatePlan(
    analysisResults: any,
    options: {
      minConfidence?: number;
    } = {}
  ): Promise<RecoveryPlan> {
    const minConfidence = options.minConfidence ?? 0.7;

    // TODO: Implement sophisticated recovery planning
    const tasks: RecoveryTask[] = [];

    // Example task generation based on analysis
    if (analysisResults.contextSaturation) {
      tasks.push({
        id: 'task_1',
        description: 'Reduce context usage by implementing chunking',
        confidence: 0.85,
        dependencies: [],
        reversible: true,
        steps: [
          'Analyze current context usage patterns',
          'Implement context windowing',
          'Test with reduced context'
        ]
      });
    }

    if (analysisResults.rateLimits) {
      tasks.push({
        id: 'task_2',
        description: 'Implement rate limit backoff strategy',
        confidence: 0.9,
        dependencies: [],
        reversible: true,
        steps: [
          'Add exponential backoff',
          'Implement request queuing',
          'Monitor rate limit headers'
        ]
      });
    }

    // Calculate overall confidence
    const overallConfidence = tasks.length > 0
      ? tasks.reduce((sum, t) => sum + t.confidence, 0) / tasks.length
      : 0;

    return {
      runId: analysisResults.runId || 'unknown',
      tasks,
      confidence: overallConfidence
    };
  }

  async validatePlan(plan: RecoveryPlan): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check for circular dependencies
    const visited = new Set<string>();
    const inProgress = new Set<string>();

    for (const task of plan.tasks) {
      if (this.hasCycle(task.id, plan.tasks, visited, inProgress)) {
        errors.push(`Circular dependency detected in task ${task.id}`);
      }
    }

    // Check for missing dependencies
    const taskIds = new Set(plan.tasks.map(t => t.id));
    for (const task of plan.tasks) {
      for (const dep of task.dependencies) {
        if (!taskIds.has(dep)) {
          errors.push(`Task ${task.id} has missing dependency: ${dep}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private hasCycle(
    taskId: string,
    tasks: RecoveryTask[],
    visited: Set<string>,
    inProgress: Set<string>
  ): boolean {
    if (inProgress.has(taskId)) {
      return true; // Cycle detected
    }

    if (visited.has(taskId)) {
      return false; // Already checked
    }

    inProgress.add(taskId);

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      for (const dep of task.dependencies) {
        if (this.hasCycle(dep, tasks, visited, inProgress)) {
          return true;
        }
      }
    }

    inProgress.delete(taskId);
    visited.add(taskId);

    return false;
  }
}
