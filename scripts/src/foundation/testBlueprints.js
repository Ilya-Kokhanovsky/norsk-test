const DEFAULT_TEST_TEMPLATE = {
  id: "new-test",
  mode: "multiple-choice",
  title: "Untitled Test",
  subtitle: "",
  description: "",
  datasetPath: "./new-test.json",
  promptField: "question",
  answerField: "answer",
  choicesField: "options",
  optionSourceField: "answer",
  optionCount: 4,
  recentWindow: 10,
  questionLabel: "Вопрос",
  autoNext: {
    correctMs: 900,
    wrongMs: 1400
  }
};

export function createTestTemplate(overrides = {}) {
  const merged = {
    ...DEFAULT_TEST_TEMPLATE,
    ...overrides,
    autoNext: {
      ...DEFAULT_TEST_TEMPLATE.autoNext,
      ...(overrides.autoNext || {})
    }
  };

  if (!merged.optionSourceField) {
    merged.optionSourceField = merged.answerField;
  }

  return merged;
}

export function createQuestionTemplate(overrides = {}) {
  return {
    id: overrides.id ?? 1,
    question: overrides.question ?? "",
    answer: overrides.answer ?? "",
    options: Array.isArray(overrides.options) ? [...overrides.options] : []
  };
}

export function createDatasetTemplate(config = {}) {
  return {
    meta: {
      title: config.title ?? "New Dataset",
      subtitle: config.subtitle ?? "",
      description: config.description ?? ""
    },
    items: Array.isArray(config.items) ? [...config.items] : []
  };
}

export { DEFAULT_TEST_TEMPLATE };
