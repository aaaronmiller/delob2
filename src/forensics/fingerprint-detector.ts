import * as fs from 'fs/promises';
import * as path from 'path';

export interface Fingerprint {
    id: string;
    name: string;
    category: string; // hallucination|context_collapse|model_mismatch|saturation|setup|comment
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    line: number;
    snippet: string;
    confidence: number;
}

export interface FileAnalysis {
    path: string;
    fingerprints: Fingerprint[];
    score: number;
}

export class FingerprintDetector {
    private patterns = [
        // Category 1: Hallucination
        {
            id: 'F-HAL-001',
            name: 'Phantom Import',
            regex: /from\s+['"](\.[^'"]+)['"]|require\(['"](\.[^'"]+)['"]\)/g,
            category: 'hallucination',
            severity: 'Critical' as const,
            confidence: 0.95,
            requiresConfigCheck: true
        },
        {
            id: 'F-HAL-002',
            name: 'Fictional API Call',
            regex: /\.(sortBy|capitalize|deepClone|toTitleCase)\(/g,
            category: 'hallucination',
            severity: 'High' as const,
            confidence: 0.9
        },
        {
            id: 'F-HAL-003',
            name: 'Wrong Method Signature',
            regex: /fs\.readFile\([^,)]+\)\s*$/gm, // simplistic check for missing callback/options
            category: 'hallucination',
            severity: 'High' as const,
            confidence: 0.85
        },
        {
            id: 'F-HAL-004',
            name: 'Invented Constant',
            regex: /\b(HTTP_STATUS\.SUCCESS|React\.FRAGMENT_TYPE|HttpStatus\.OK)\b/g,
            category: 'hallucination',
            severity: 'Medium' as const,
            confidence: 0.8
        },

        // Category 2: Context Collapse
        {
            id: 'F-CTX-001',
            name: 'Undefined Variable Usage',
            // Very rough heuristic without AST
            regex: /console\.log\(([^)]+)\)/g,
            category: 'context_collapse',
            severity: 'Critical' as const,
            confidence: 0.4 // low confidence with regex alone
        },
        {
            id: 'F-CTX-004',
            name: 'Contradictory Logic',
            regex: /if\s*\(([^)]+)\)[\s\S]{0,50}if\s*\(!\1\)/g,
            category: 'context_collapse',
            severity: 'Medium' as const,
            confidence: 0.8
        },

        // Category 3: Model Quality Mismatch
        {
            id: 'F-MQL-001',
            name: 'Any-Type Explosion',
            regex: /:\s*any\b|\bas\s+any\b/g,
            category: 'model_mismatch',
            severity: 'Medium' as const,
            confidence: 0.7
        },
        {
            id: 'F-MQL-002',
            name: 'Generic Variable Name',
            regex: /\b(data|result|temp|item|value|obj|x|y|foo|bar|baz)\b/g,
            category: 'model_mismatch',
            severity: 'Low' as const,
            confidence: 0.65
        },
        {
            id: 'F-MQL-004',
            name: 'Over-Engineering',
            regex: /(Abstract|Factory|Builder|Singleton|Proxy|Adapter|Facade)\w+/g,
            category: 'model_mismatch',
            severity: 'Low' as const,
            confidence: 0.5
        },
        {
            id: 'F-MQL-005',
            name: 'Inconsistent Style',
            regex: /'[^']+'[\s\S]+"[^"]+"|"[^"]+"[\s\S]+'[^']+'/g, // crude check for mixed quotes
            category: 'model_mismatch',
            severity: 'Low' as const,
            confidence: 0.4
        },


        // Category 4: Context Saturation
        {
            id: 'F-SAT-003',
            name: 'Stale/Empty Implementation',
            regex: /\/\/\s*TODO:?\s*implement|\{\s*\/\* todo \*\/\s*\}/i,
            category: 'saturation',
            severity: 'Medium' as const,
            confidence: 0.8
        },
        {
            id: 'F-SAT-004',
            name: 'Import Graveyard',
            regex: /^\s*\/\/\s*import\s+.+/gm,
            category: 'saturation',
            severity: 'Low' as const,
            confidence: 0.75
        },
        {
            id: 'F-SAT-005',
            name: 'Redundant Re-implementation',
            regex: /(function|const)\s+(parseDate|formatDate|sleep|wait)\b/g, // common duplicated utilities
            category: 'saturation',
            severity: 'Medium' as const,
            confidence: 0.6
        },


        // Category 6: AI Comment Patterns
        {
            id: 'F-CMT-001',
            name: 'Generic TODO',
            regex: /\/\/\s*TODO:\s*(fix|add|handle)\s/i,
            category: 'comment',
            severity: 'Low' as const,
            confidence: 0.7
        },
        {
            id: 'F-CMT-002',
            name: 'Placeholder Comment',
            regex: /\/\/\s*(Handle|Process|Return|Get|Set)\s+\w+$/gm,
            category: 'comment',
            severity: 'Low' as const,
            confidence: 0.65
        },
        {
            id: 'F-CMT-003',
            name: 'Obvious Comment',
            regex: /\/\/\s*Increment counter|\/\/\s*Import dependencies/i,
            category: 'comment',
            severity: 'Low' as const,
            confidence: 0.6
        }
    ];
    async analyze(filePath: string, content: string): Promise<FileAnalysis> {
        const findings: Fingerprint[] = [];
        const lines = content.split('\n');

        for (const pattern of this.patterns) {
            // Reset lastIndex for global regex
            pattern.regex.lastIndex = 0;

            let match;
            // Using matchAll for cleaner iteration, or loop exec
            while ((match = pattern.regex.exec(content)) !== null) {
                // Calculate line number
                const charIndex = match.index;
                const lineNum = content.substring(0, charIndex).split('\n').length;
                const lineContent = lines[lineNum - 1] || '';

                // For Phantom Import, we'd theoretically check file existence here
                // For efficiency in this "dumb" scan, we just record it as a potential candidate
                // or skip if it's the "requiresConfigCheck" type and implementation is complex.
                // For now, let's include it as a finding to be verified.

                findings.push({
                    id: pattern.id,
                    name: pattern.name,
                    category: pattern.category,
                    severity: pattern.severity,
                    line: lineNum,
                    snippet: lineContent.trim().substring(0, 100),
                    confidence: pattern.confidence
                });

                // Limit findings per pattern per file to avoid noise
                if (findings.filter(f => f.id === pattern.id).length > 5) break;
            }
        }

        const score = findings.reduce((acc, f) => acc + (f.confidence * this.severityWeight(f.severity)), 0);

        return {
            path: filePath,
            fingerprints: findings,
            score
        };
    }

    private severityWeight(severity: string): number {
        switch (severity) {
            case 'Critical': return 10;
            case 'High': return 5;
            case 'Medium': return 3;
            case 'Low': return 1;
            default: return 0;
        }
    }
}
