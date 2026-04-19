import {
  areNorwegianTextEqual,
  normalizeNorwegianText,
  uniqueNorwegianValues
} from "../core/lang/norwegianText.js";

const SUPPORTED_MODES = new Set([
  "multiple-choice",
  "sentence-builder",
  "bucket-sort",
  "binary-choice",
  "cloze-choice",
  "matching-tiles",
  "odd-one-out"
]);

const MODE_OPTION_COUNT_REQUIRED = new Set([
  "multiple-choice",
  "cloze-choice",
  "odd-one-out"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createExplanationResolver(optionExplanations) {
  if (!isPlainObject(optionExplanations)) {
    return () => "";
  }

  const normalizedLookup = new Map();

  for (const [key, value] of Object.entries(optionExplanations)) {
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const normalizedKey = normalizeNorwegianText(key, {
      lowerCase: true
    });

    normalizedLookup.set(normalizedKey, value.trim());
  }

  return (optionValue) => {
    const direct = optionExplanations?.[optionValue];
    if (typeof direct === "string" && direct.trim()) {
      return direct.trim();
    }

    const normalizedOption = normalizeNorwegianText(optionValue, {
      lowerCase: true
    });

    return normalizedLookup.get(normalizedOption) || "";
  };
}

export function validateTestConfig(testConfig) {
  const errors = [];

  if (!testConfig || typeof testConfig !== "object") {
    return { valid: false, errors: ["Test config must be an object"] };
  }

  if (!testConfig.id) {
    errors.push("Test config must have a non-empty id");
  }

  if (!testConfig.datasetPath) {
    errors.push("Test config must define datasetPath");
  }

  if (!SUPPORTED_MODES.has(testConfig.mode)) {
    errors.push(`Unsupported mode: ${testConfig.mode}`);
  }

  const needsOptionCount = MODE_OPTION_COUNT_REQUIRED.has(testConfig.mode);
  const hasOptionCount = testConfig.optionCount != null;

  if (needsOptionCount && !hasOptionCount) {
    errors.push(`mode ${testConfig.mode} requires optionCount`);
  }

  if (hasOptionCount && (!Number.isInteger(testConfig.optionCount) || testConfig.optionCount < 2)) {
    errors.push("optionCount must be an integer >= 2");
  }

  if (testConfig.recentWindow != null && (!Number.isInteger(testConfig.recentWindow) || testConfig.recentWindow < 0)) {
    errors.push("recentWindow must be an integer >= 0");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function assertValidTestConfig(testConfig) {
  const result = validateTestConfig(testConfig);
  if (!result.valid) {
    throw new Error(result.errors.join("; "));
  }
}

export function validateDataset(dataset, options = {}) {
  const promptField = options.promptField || "question";
  const answerField = options.answerField || "answer";
  const errors = [];

  if (!dataset || typeof dataset !== "object") {
    return { valid: false, errors: ["Dataset must be an object"] };
  }

  const items = Array.isArray(dataset.items) ? dataset.items : [];
  if (!items.length) {
    errors.push("Dataset must contain items array with at least one entry");
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];

    const prompt = item?.[promptField];
    const answer = item?.[answerField];

    if (typeof prompt !== "string" || !prompt.trim()) {
      errors.push(`Item #${index + 1} has empty ${promptField}`);
    }

    if (typeof answer !== "string" || !answer.trim()) {
      errors.push(`Item #${index + 1} has empty ${answerField}`);
    }

    if (Array.isArray(item?.options) && item.options.length > 0) {
      const uniqueOptions = uniqueNorwegianValues(item.options, {
        lowerCase: false
      });

      if (uniqueOptions.length !== item.options.length) {
        errors.push(`Item #${index + 1} contains duplicate options when normalized for Norwegian text`);
      }

      if (typeof answer === "string" && answer.trim()) {
        const hasAnswerOption = uniqueOptions.some((option) => areNorwegianTextEqual(option, answer));
        if (!hasAnswerOption) {
          errors.push(`Item #${index + 1} options do not contain the answer ${answerField}`);
        }
      }

      if (!isPlainObject(item.optionExplanations)) {
        errors.push(`Item #${index + 1} must contain optionExplanations object`);
        continue;
      }

      const resolveExplanation = createExplanationResolver(item.optionExplanations);

      for (const option of uniqueOptions) {
        const explanation = resolveExplanation(option);
        if (typeof explanation !== "string" || !explanation.trim()) {
          errors.push(`Item #${index + 1} missing explanation for option "${option}"`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function assertValidDataset(dataset, options = {}) {
  const result = validateDataset(dataset, options);
  if (!result.valid) {
    throw new Error(result.errors.join("; "));
  }
}
