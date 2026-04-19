const DEFAULT_LOCALE = "nb-NO";

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
    collapseWhitespace = true,
    lowerCase = false,
    locale = DEFAULT_LOCALE
  } = options;

  let normalized = value == null ? "" : String(value);
  normalized = safeNormalize(normalized, form);

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
    .map((word) => normalizeNorwegianText(word, options))
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

  const normalizedToken = normalizeNorwegianText(token, {
    lowerCase: true,
    ...options
  });

  return normalizedTokens.findIndex((value) => value === normalizedToken);
}
