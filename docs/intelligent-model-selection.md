# Intelligent Model Selection

## Overview

The app now automatically selects the appropriate AI model tier based on task complexity, optimizing for both cost and quality.

## Model Tiers

### Fast Tier (Cost-Optimized)

- **Anthropic**: `claude-haiku-4-5-20251001`
- **OpenAI**: `o4-mini`
- **Use cases**: Simple, short inputs with single intent

### Advanced Tier (Quality-Optimized)

- **Anthropic**: `claude-sonnet-4-5-20250929`
- **OpenAI**: `gpt-4.1`
- **Use cases**: Complex reasoning, long context, summarization

## Escalation Triggers

### Initial Selection (Pre-request Analysis)

The system analyzes input complexity BEFORE making the first API call:

**Todo Extraction (`/api/ai/extract`)**

- ✅ **Long input**: >1,000 tokens (~4,000 characters)
- ✅ **Multi-paragraph**: >2 paragraphs
- ✅ **Complex dates**: "every other weekday", "until quarter end", "after my trip", timezone references
- ✅ **Multiple constraints**: Input contains 2+ keywords like "and", "but", "except", "exclude"

**Query Detection (`/api/ai/query`)**

- ✅ **Large context**: >1,000 tokens (query + all todos)
- ✅ **Ambiguous**: Multiple questions, "maybe/perhaps", "or" alternatives
- ✅ **Multiple filters**: 2+ constraint keywords ("work AND urgent, exclude meetings")
- ✅ **Summarization needed**: "summarize", "overview", "plan", "focus areas", "suggest"
- ✅ **Complex date math**: "every other weekday", "within 3 weeks", "quarter end"

### Confidence-Based Escalation (Post-response Analysis)

If the fast model is used initially, the system checks the response quality:

**🔍 Low Confidence Detection**

- **Model self-assessment**: AI returns `confidence < 0.7` (on 0-1 scale)
- **Suspicious results**:
  - Zero matches when query clearly asks about existing todos
  - Too many matches (>100 results)
  - > 90% of todos matched for a specific query (e.g., "urgent" matches 90 of 100 todos)

**🚀 Automatic Retry**

When low confidence is detected:

1. Log escalation reason and original confidence score
2. Retry with advanced model (Sonnet 4.5 / GPT-4.1)
3. Return improved result to user
4. **Guardrail**: Maximum 1 escalation per request (prevents runaway costs)

**Examples**:

- ✅ Fast (high confidence): "show urgent" → confidence: 0.95
- ⚠️ Fast → 🚀 Advanced: "show urgent" → confidence: 0.55, "ambiguous intent" → retry with Sonnet
- ⚠️ Fast → 🚀 Advanced: "work tasks?" → 0 matches despite having 50 work todos → retry with Sonnet

## Implementation

### Core Logic (`/src/lib/modelSelector.ts`)

```typescript
import { selectExtractionModel, selectQueryModel } from "@/lib/modelSelector";

// For extraction
const modelSelection = selectExtractionModel(text);
console.log(modelSelection.reason); // "Complex date/time references require advanced reasoning"

// For queries
const modelSelection = selectQueryModel(text, todos);
console.log(modelSelection.tier); // "advanced"
```

### API Endpoints

Both `/api/ai/extract` and `/api/ai/query` automatically:

1. Analyze input complexity
2. Select appropriate model tier
3. Log decision reasoning
4. Track usage with correct model name

### Observability

Check server logs for model selection decisions:

**Initial selection:**

```
Model selection: fast tier - Simple, single-intent query - fast model sufficient
Selected models: Anthropic=claude-haiku-4-5-20251001, OpenAI=o4-mini
```

**Confidence-based escalation:**

```
⚠️ ESCALATION: Model confidence 0.62 below threshold 0.7
   Original confidence: 0.62
Using Anthropic for query detection (claude-sonnet-4-5-20250929)
✅ Escalation complete - used advanced model
```

**Result validation escalation:**

```
⚠️ ESCALATION: Query about todos returned zero matches despite having todos available
Using Anthropic for query detection (claude-sonnet-4-5-20250929)
✅ Escalation complete - used advanced model
```

## Guardrails

### Cost Controls

- **MAX_ESCALATIONS_PER_REQUEST = 1**: Only one retry per request
- **Fast model first**: Always start with cheap model when possible
- **Observability**: All escalations logged with reason for monitoring

### Adaptive Tuning (Future)

After collecting usage data:

- Adjust thresholds based on real performance
- Promote patterns that consistently need escalation
- Demote patterns where fast model succeeds
- Track tokens/latency for cost analysis

## Cost Optimization

- **~80% of requests** use fast models (Haiku/o4-mini) - 10-20x cheaper
- **~15% of complex requests** pre-escalate based on input analysis
- **~5% of requests** escalate after low-confidence response
- **Total**: ~80% fast, ~20% advanced (optimized cost/quality balance)
- **Automatic fallback**: Anthropic → OpenAI if primary fails
- **Guardrails**: Max 1 escalation prevents runaway costs

## Future Enhancements

- [x] ~~Confidence-based escalation: retry with advanced model if fast model returns low confidence~~ ✅ **IMPLEMENTED**
- [ ] A/B testing: track quality differences between tiers
- [ ] User preferences: allow power users to force advanced models (settings UI)
- [ ] Response caching: avoid re-processing identical queries
- [ ] Adaptive thresholds: tune based on weekly performance data
- [ ] Token/latency tracking: detailed cost analysis per model
