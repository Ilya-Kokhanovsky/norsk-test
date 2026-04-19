const DEFAULT_LOCALE = "nb-NO";
const ZERO_WIDTH_CHARACTERS_REGEX = /[\u200B-\u200D\u2060\uFEFF]/g;
const NON_STANDARD_SPACES_REGEX = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
const EDGE_PUNCTUATION_REGEX = /^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu;

function safeNormalize(value, form) {
  try {
    return value.normalize(form);
  } catch {
    return value;
  }
}

export function normalizeNorwegianText(value, options = {}) {
  const {
    form = "NFC",
    trim = true,
    normalizeSpaces = true,
    stripInvisible = true,
    collapseWhitespace = true,
    lowerCase = false,
    locale = DEFAULT_LOCALE
  } = options;

  let normalized = value == null ? "" : String(value);
  normalized = safeNormalize(normalized, form);

  if (stripInvisible) {
    normalized = normalized.replace(ZERO_WIDTH_CHARACTERS_REGEX, "");
  }

  if (normalizeSpaces) {
    normalized = normalized.replace(NON_STANDARD_SPACES_REGEX, " ");
  }

  if (collapseWhitespace) {
    normalized = normalized.replace(/\s+/g, " ");
  }

  if (trim) {
    normalized = normalized.trim();
  }

  if (lowerCase) {
    normalized = normalized.toLocaleLowerCase(locale);
  }

  return normalized;
}

export function normalizeNorwegianToken(value, options = {}) {
  const {
    stripEdgePunctuation = false,
    ...textOptions
  } = options;

  let normalized = normalizeNorwegianText(value, textOptions);

  if (stripEdgePunctuation) {
    normalized = normalized.replace(EDGE_PUNCTUATION_REGEX, "");
  }

  return normalized;
}

export function areNorwegianTextEqual(left, right, options = {}) {
  const compareOptions = {
    lowerCase: true,
    ...options
  };

  return normalizeNorwegianText(left, compareOptions) === normalizeNorwegianText(right, compareOptions);
}

export function uniqueNorwegianValues(values, options = {}) {
  if (!Array.isArray(values)) {
    return [];
  }

  const keyOptions = {
    lowerCase: true,
    ...options
  };

  const seen = new Set();
  const unique = [];

  for (const rawValue of values) {
    const displayValue = normalizeNorwegianText(rawValue, {
      ...options,
      lowerCase: false
    });

    if (!displayValue) {
      continue;
    }

    const key = normalizeNorwegianText(rawValue, keyOptions);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(displayValue);
  }

  return unique;
}

export function normalizeNorwegianWordList(words, options = {}) {
  if (!Array.isArray(words)) {
    return [];
  }

  return words
    .map((word) => normalizeNorwegianToken(word, options))
    .filter((word) => Boolean(word));
}

export function areNorwegianWordArraysEqual(leftWords, rightWords, options = {}) {
  const left = normalizeNorwegianWordList(leftWords, {
    lowerCase: true,
    ...options
  });

  const right = normalizeNorwegianWordList(rightWords, {
    lowerCase: true,
    ...options
  });

  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

export function findNorwegianTokenIndex(tokens, token, options = {}) {
  const normalizedTokens = normalizeNorwegianWordList(tokens, {
    lowerCase: true,
    ...options
  });

  const normalizedToken = normalizeNorwegianToken(token, {
    lowerCase: true,
    ...options
  });

  return normalizedTokens.findIndex((value) => value === normalizedToken);
}
