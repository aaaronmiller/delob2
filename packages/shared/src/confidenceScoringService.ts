export class ConfidenceScoringService {
  calculateConfidence(
    task: {
      evidence?: any[];
      complexity?: number;
      reversible?: boolean;
      tested?: boolean;
    }
  ): number {
    let score = 0.5; // Base confidence

    // Evidence quality
    if (task.evidence && task.evidence.length > 0) {
      score += 0.2 * Math.min(task.evidence.length / 3, 1);
    }

    // Complexity (lower is better)
    if (task.complexity !== undefined) {
      score += 0.15 * (1 - Math.min(task.complexity, 1));
    }

    // Reversibility
    if (task.reversible) {
      score += 0.1;
    }

    // Testing
    if (task.tested) {
      score += 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  categorizeConfidence(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.85) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  aggregateConfidence(scores: number[]): {
    overall: number;
    high: number;
    medium: number;
    low: number;
  } {
    if (scores.length === 0) {
      return { overall: 0, high: 0, medium: 0, low: 0 };
    }

    const overall = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    const categorized = scores.map(s => this.categorizeConfidence(s));
    const high = categorized.filter(c => c === 'high').length;
    const medium = categorized.filter(c => c === 'medium').length;
    const low = categorized.filter(c => c === 'low').length;

    return { overall, high, medium, low };
  }
}
