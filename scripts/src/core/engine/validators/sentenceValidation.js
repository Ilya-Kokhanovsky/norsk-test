import {
  areNorwegianWordArraysEqual,
  findNorwegianTokenIndex,
  normalizeNorwegianText
} from "../../lang/norwegianText.js";

const DEFAULT_SENTENCE_LABELS = {
  success: "Correct sentence order.",
  fail: "Not yet. Try a different order.",
  v2Hint: "In Norwegian V2, the finite verb should be in the second position.",
  v2MissingVerb: "Finite verb is missing in your sentence."
};

export function normalizeSentenceValidationResult(result, fallbackMessage) {
  if (!result || typeof result !== "object") {
    return {
      isCorrect: false,
      message: fallbackMessage,
      issues: []
    };
  }

  return {
    isCorrect: Boolean(result.isCorrect),
    message: result.message ? String(result.message) : fallbackMessage,
    issues: Array.isArray(result.issues) ? result.issues : []
  };
}

export function validateFiniteVerbPosition(answerWords, finiteVerb, options = {}) {
  const expectedIndex = Number.isInteger(options.expectedIndex) ? options.expectedIndex : 1;
  const labels = {
    ...DEFAULT_SENTENCE_LABELS,
    ...(options.labels || {})
  };

  const normalizedVerb = normalizeNorwegianText(finiteVerb, {
    lowerCase: false
  });

  if (!normalizedVerb) {
    return {
      isValid: true,
      issues: []
    };
  }

  const tokenIndex = findNorwegianTokenIndex(answerWords, normalizedVerb, {
    stripEdgePunctuation: true,
    ...(options.tokenSearchOptions || {})
  });

  if (tokenIndex < 0) {
    return {
      isValid: false,
      message: labels.v2MissingVerb,
      issues: [
        {
          type: "v2-missing",
          tokenIndex: null,
          message: labels.v2MissingVerb
        }
      ]
    };
  }

  if (tokenIndex !== expectedIndex) {
    return {
      isValid: false,
      message: labels.v2Hint,
      issues: [
        {
          type: "v2",
          tokenIndex,
          message: labels.v2Hint
        }
      ]
    };
  }

  return {
    isValid: true,
    issues: []
  };
}

export function createSentenceOrderValidator(expectedWords, options = {}) {
  const labels = {
    ...DEFAULT_SENTENCE_LABELS,
    ...(options.labels || {})
  };

  const finiteVerb = options.finiteVerb || options.v2Verb || "";
  const expectedVerbIndex = Number.isInteger(options.expectedVerbIndex)
    ? options.expectedVerbIndex
    : 1;

  return (answerWords) => {
    const exactMatch = areNorwegianWordArraysEqual(answerWords, expectedWords);

    const positionValidation = validateFiniteVerbPosition(answerWords, finiteVerb, {
      expectedIndex: expectedVerbIndex,
      labels,
      tokenSearchOptions: options.tokenSearchOptions
    });

    const issues = positionValidation.issues || [];
    const isCorrect = exactMatch && issues.length === 0;

    return {
      isCorrect,
      message: isCorrect ? labels.success : labels.fail,
      issues
    };
  };
}

export function createV2PositionValidator(finiteVerb, options = {}) {
  const expectedIndex = Number.isInteger(options.expectedIndex) ? options.expectedIndex : 1;
  const normalizedVerb = normalizeNorwegianText(finiteVerb, {
    lowerCase: false
  });

  const labels = {
    v2MissingVerb: options.missingMessage || `Verb "${normalizedVerb}" is missing in the sentence`,
    v2Hint: options.misplacedMessage || `Verb "${normalizedVerb}" should be at position ${expectedIndex + 1}`
  };

  return (answerWords) => {
    const positionValidation = validateFiniteVerbPosition(answerWords, normalizedVerb, {
      expectedIndex,
      labels,
      tokenSearchOptions: options.tokenSearchOptions
    });

    if (!positionValidation.isValid) {
      return {
        isCorrect: false,
        message: positionValidation.message,
        issues: positionValidation.issues
      };
    }

    return {
      isCorrect: true,
      message: options.successMessage || "V2 position is valid",
      issues: []
    };
  };
}