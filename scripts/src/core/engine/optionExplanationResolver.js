import { normalizeNorwegianText } from "../lang/norwegianText.js";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createOptionExplanationResolver(optionExplanations, options = {}) {
  const fallback = Object.prototype.hasOwnProperty.call(options, "fallback")
    ? options.fallback
    : null;

  if (!isPlainObject(optionExplanations)) {
    return () => fallback;
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
    if (typeof optionValue !== "string" || !optionValue.trim()) {
      return fallback;
    }

    const directMatch = optionExplanations?.[optionValue];
    if (typeof directMatch === "string" && directMatch.trim()) {
      return directMatch.trim();
    }

    const normalizedOption = normalizeNorwegianText(optionValue, {
      lowerCase: true
    });

    return normalizedLookup.get(normalizedOption) ?? fallback;
  };
}