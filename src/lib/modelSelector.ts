/**
 * Intelligent model selection for AI operations
 * Escalates to advanced models when complexity warrants it
 */

// Guardrails
export const MAX_ESCALATIONS_PER_REQUEST = 1;
export const LOW_CONFIDENCE_THRESHOLD = 0.7;

export type ModelTier = "fast" | "advanced";

export interface ModelSelectionResult {
  tier: ModelTier;
  reason: string;
  anthropicModel: string;
  openaiModel: string;
}

// Response from AI models that includes confidence scoring
export interface AIResponseWithConfidence {
  confidence?: number; // 0-1 scale, optional for backward compatibility
  confidenceReason?: string;
  // ... rest of response fields (todos, isQuery, etc.)
  [key: string]: any;
}

export interface ExtractionComplexityAnalysis {
  textLength: number;
  estimatedTokens: number;
  paragraphCount: number;
  hasComplexDateReferences: boolean;
  hasMultipleConstraints: boolean;
}

export interface QueryComplexityAnalysis {
  textLength: number;
  estimatedTokens: number;
  todoCount: number;
  hasMultipleFilters: boolean;
  isAmbiguous: boolean;
  needsSummarization: boolean;
  hasComplexDateMath: boolean;
}

/**
 * Validate query results for suspicious patterns that indicate low confidence
 */
export function validateQueryResults(result: any, text: string, todos: any[]): { isValid: boolean; reason?: string } {
  // Check if we have matching todo IDs
  const matchingIds = result.matchingTodoIds || [];

  // Suspicious pattern 1: Query clearly asks for todos but got zero matches
  const isQuestionAboutTodos = /what|show|list|find|get|tell me|any|have/i.test(text);
  const hasTodos = todos.length > 0;

  if (isQuestionAboutTodos && hasTodos && matchingIds.length === 0 && result.isQuery) {
    return {
      isValid: false,
      reason: "Query about todos returned zero matches despite having todos available",
    };
  }

  // Suspicious pattern 2: Way too many matches (likely over-broad)
  if (matchingIds.length > 100) {
    return {
      isValid: false,
      reason: "Query returned too many matches (>100), likely needs refinement",
    };
  }

  // Suspicious pattern 3: Matched almost all todos for a specific query
  const matchedPercentage = hasTodos ? matchingIds.length / todos.length : 0;
  const isSpecificQuery = /urgent|high|work|personal|today|tomorrow|this week/i.test(text);

  if (isSpecificQuery && matchedPercentage > 0.9 && todos.length > 10) {
    return {
      isValid: false,
      reason: "Specific query matched >90% of todos, likely too broad",
    };
  }

  return { isValid: true };
}

/**
 * Check if confidence is too low (requires escalation)
 */
export function isLowConfidence(result: AIResponseWithConfidence): {
  isLow: boolean;
  reason?: string;
  confidence?: number;
} {
  // If model provides confidence score, use it
  if (result.confidence !== undefined) {
    if (result.confidence < LOW_CONFIDENCE_THRESHOLD) {
      return {
        isLow: true,
        reason: result.confidenceReason || `Model confidence ${result.confidence.toFixed(2)} below threshold ${LOW_CONFIDENCE_THRESHOLD}`,
        confidence: result.confidence,
      };
    }
  }

  return { isLow: false, confidence: result.confidence };
}

/**
 * Analyze text complexity for extraction tasks
 */
export function analyzeExtractionComplexity(text: string): ExtractionComplexityAnalysis {
  const textLength = text.length;
  const estimatedTokens = Math.ceil(textLength / 4); // Rough estimate: 1 token ≈ 4 chars
  const paragraphCount = text.split(/\n\n+/).filter((p) => p.trim().length > 0).length;

  // Complex date patterns
  const complexDatePatterns = [
    /every\s+(other\s+)?[\w]+/i, // "every other weekday"
    /until\s+[\w\s]+end/i, // "until quarter end"
    /after\s+my\s+[\w]+/i, // "after my trip"
    /weekday|weekend|business\s+day/i,
    /timezone|time\s+zone|PST|EST|GMT/i,
    /quarter|fiscal|semester/i,
  ];

  const hasComplexDateReferences = complexDatePatterns.some((pattern) => pattern.test(text));

  // Multi-constraint indicators
  const constraintKeywords = ["and", "but", "except", "exclude", "also", "plus", "along with"];
  const hasMultipleConstraints = constraintKeywords.filter((kw) => text.toLowerCase().includes(kw)).length >= 2;

  return {
    textLength,
    estimatedTokens,
    paragraphCount,
    hasComplexDateReferences,
    hasMultipleConstraints,
  };
}

/**
 * Analyze query complexity for query detection tasks
 */
export function analyzeQueryComplexity(text: string, todos: any[]): QueryComplexityAnalysis {
  const textLength = text.length;
  const estimatedTokens = Math.ceil((textLength + JSON.stringify(todos).length) / 4);
  const todoCount = todos.length;

  // Multiple filter indicators
  const filterKeywords = ["and", "but", "except", "exclude", "not", "without"];
  const hasMultipleFilters = filterKeywords.filter((kw) => text.toLowerCase().includes(kw)).length >= 2;

  // Ambiguity indicators
  const ambiguousPatterns = [
    /\?.*\?/i, // Multiple questions
    /maybe|perhaps|might|could be/i,
    /or\s+/gi, // "this or that"
  ];
  const isAmbiguous = ambiguousPatterns.some((pattern) => pattern.test(text));

  // Summarization indicators
  const summaryKeywords = ["summarize", "overview", "plan", "focus areas", "what should i", "suggest", "prioritize", "week ahead", "coming up"];
  const needsSummarization = summaryKeywords.some((kw) => text.toLowerCase().includes(kw));

  // Complex date math
  const complexDatePatterns = [/every\s+(other\s+)?[\w]+/i, /until\s+[\w\s]+end/i, /after\s+[\w\s]+/i, /quarter|fiscal|semester/i, /within\s+\d+\s+(days|weeks|months)/i];
  const hasComplexDateMath = complexDatePatterns.some((pattern) => pattern.test(text));

  return {
    textLength,
    estimatedTokens,
    todoCount,
    hasMultipleFilters,
    isAmbiguous,
    needsSummarization,
    hasComplexDateMath,
  };
}

/**
 * Select appropriate model tier for extraction tasks
 */
export function selectExtractionModel(text: string): ModelSelectionResult {
  const analysis = analyzeExtractionComplexity(text);

  // Escalate to advanced model if any complexity trigger fires
  if (analysis.estimatedTokens > 1000) {
    return {
      tier: "advanced",
      reason: "Long input (>1k tokens) requires deeper processing",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  if (analysis.paragraphCount > 2) {
    return {
      tier: "advanced",
      reason: "Multi-paragraph input (>2) needs context understanding",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  if (analysis.hasComplexDateReferences) {
    return {
      tier: "advanced",
      reason: "Complex date/time references require advanced reasoning",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  if (analysis.hasMultipleConstraints) {
    return {
      tier: "advanced",
      reason: "Multiple constraints require careful parsing",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  // Default to fast model for simple, short inputs
  return {
    tier: "fast",
    reason: "Simple, short input - fast model sufficient",
    anthropicModel: "claude-haiku-4-5-20251001",
    openaiModel: "o4-mini",
  };
}

/**
 * Select appropriate model tier for query detection tasks
 */
export function selectQueryModel(text: string, todos: any[]): ModelSelectionResult {
  const analysis = analyzeQueryComplexity(text, todos);

  // Escalate to advanced model if any complexity trigger fires
  if (analysis.estimatedTokens > 1000) {
    return {
      tier: "advanced",
      reason: "Large context (>1k tokens) requires advanced processing",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  if (analysis.isAmbiguous) {
    return {
      tier: "advanced",
      reason: "Ambiguous input requires careful interpretation",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  if (analysis.hasMultipleFilters) {
    return {
      tier: "advanced",
      reason: "Multi-constraint query needs complex reasoning",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  if (analysis.needsSummarization) {
    return {
      tier: "advanced",
      reason: "Summarization/planning requires high-quality prose",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  if (analysis.hasComplexDateMath) {
    return {
      tier: "advanced",
      reason: "Complex date calculations require advanced reasoning",
      anthropicModel: "claude-sonnet-4-5-20250929",
      openaiModel: "gpt-4.1",
    };
  }

  // Default to fast model for simple queries
  return {
    tier: "fast",
    reason: "Simple, single-intent query - fast model sufficient",
    anthropicModel: "claude-haiku-4-5-20251001",
    openaiModel: "o4-mini",
  };
}
