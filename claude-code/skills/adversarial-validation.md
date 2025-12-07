# Adversarial Validation Skill

<purpose>
Multi-persona debate technique for stress-testing decisions, designs, and outputs before finalization. Simulates diverse perspectives to identify blind spots.
</purpose>

## When to Use

<triggers>
- Critical design decisions
- Recovery plan approval
- Agent definition updates
- Low-confidence findings (< 70%)
- Conflicting requirements
</triggers>

## Council Composition

<council>
| Persona | Role | Challenge Focus |
|---------|------|-----------------|
| **Skeptic** | Questions assumptions | "What evidence supports this?" |
| **Optimist** | Identifies potential | "What opportunities are we missing?" |
| **Pragmatist** | Focuses on feasibility | "Can we actually build this?" |
| **Security Analyst** | Privacy/risk concerns | "What could go wrong?" |
| **UX Designer** | User experience focus | "Is this intuitive?" |
| **Devil's Advocate** | Contrarian view | "What's the strongest counter-argument?" |
| **Domain Expert** | Technical accuracy | "Does this match industry standards?" |
| **End User** | Practical application | "Would I actually use this?" |
</council>

## Protocol

<protocol>
### Round Structure
Each validation session consists of 3 rounds:

**Round 1: Initial Positions**
- Each persona states their perspective
- Focus on independent assessment
- No cross-persona debate yet

**Round 2: Challenges**
- Personas respond to each other
- Devil's Advocate challenges strongest consensus
- Skeptic identifies remaining assumptions

**Round 3: Resolution**
- Synthesize positions into consensus
- Document unresolved conflicts
- Assign final confidence score
</protocol>

## Grounding Requirement

<grounding>
Before each validation session:
1. **Pre-Session Search**: Query relevant best practices
2. **Between Rounds**: Verify claims against external sources
3. **Post-Session**: Confirm consensus aligns with industry standards

This prevents echo chamber effects and ensures external validation.
</grounding>

## Output Format

<output>
```json
{
  "session_id": "uuid",
  "topic": "string",
  "rounds": [
    {
      "round": 1,
      "positions": [
        {"persona": "Skeptic", "position": "..."},
        {"persona": "Pragmatist", "position": "..."}
      ]
    }
  ],
  "consensus": "string",
  "unresolved_conflicts": ["string"],
  "confidence_score": 0.0-1.0,
  "grounding_sources": ["url1", "url2"]
}
```
</output>

## Integration Points

<integration>
- **Audit Phase**: Validate root cause inferences
- **Analysis Phase**: Confirm issue prioritization
- **Recovery Phase**: Stress-test proposed fixes
- **Iterate Phase**: Validate pattern extractions
</integration>

## Quick Validation (Abbreviated)

<quick_validation>
For minor decisions, use abbreviated 3-way validation:

| Persona | Question |
|---------|----------|
| **Skeptic** | "What could be wrong here?" |
| **Pragmatist** | "Is this the simplest solution?" |
| **Devil's Advocate** | "What's the alternative?" |

Single round, no grounding required. Use for decisions with reversible consequences.
</quick_validation>
