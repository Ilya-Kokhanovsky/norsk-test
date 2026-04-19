import { createDatasetTemplate, createQuestionTemplate, createTestTemplate } from "./testBlueprints.js";

export function createStarterTestPack(config = {}) {
  const id = config.id || "new-test";
  const title = config.title || "New Test";
  const subtitle = config.subtitle || "Starter";
  const description = config.description || "Описание нового теста";

  const question = createQuestionTemplate({
    id: 1,
    question: config.sampleQuestion || "Пример вопроса",
    answer: config.sampleAnswer || "Правильный ответ",
    options: Array.isArray(config.sampleOptions) ? config.sampleOptions : ["Вариант 1", "Вариант 2", "Правильный ответ", "Вариант 4"]
  });

  const dataset = createDatasetTemplate({
    title,
    subtitle,
    description,
    items: [question]
  });

  const catalogEntry = createTestTemplate({
    id,
    title,
    subtitle,
    description,
    datasetPath: `./${id}.json`,
    questionLabel: config.questionLabel || "Вопрос"
  });

  return {
    catalogEntry,
    dataset
  };
}
