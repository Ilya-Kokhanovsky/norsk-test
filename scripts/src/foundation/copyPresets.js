const DEFAULT_COPY = {
  common: {
    start: "Начать",
    finish: "Завершить",
    retry: "Пройти еще раз",
    backHome: "На главную"
  },
  start: {
    heading: "Новый тест",
    subtitle: "Готово к запуску",
    description: "Выберите режим и начните тренировку"
  },
  labels: {
    question: "Вопрос",
    accuracy: "Точность",
    total: "Всего",
    correct: "Верно",
    wrong: "Ошибок"
  },
  errors: {
    configLoad: "Не удалось загрузить конфигурацию"
  }
};

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(baseObject, overrideObject) {
  const result = { ...baseObject };

  if (!isObject(overrideObject)) {
    return result;
  }

  for (const [key, value] of Object.entries(overrideObject)) {
    if (isObject(value) && isObject(result[key])) {
      result[key] = mergeDeep(result[key], value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

export function createCopy(overrides = {}) {
  return mergeDeep(DEFAULT_COPY, overrides);
}

export { DEFAULT_COPY };
