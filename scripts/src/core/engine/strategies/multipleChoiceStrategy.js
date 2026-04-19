import { sampleWithoutReplacement, shuffle } from "../../utils/random.js";
import {
  areNorwegianTextEqual,
  normalizeNorwegianText,
  uniqueNorwegianValues
} from "../../lang/norwegianText.js";

function collectUniqueFieldValues(items, fieldName) {
  const values = [];

  for (const item of items) {
    const value = item?.[fieldName];
    if (typeof value === "string") {
      values.push(value);
    }
  }

  return uniqueNorwegianValues(values, {
    lowerCase: false
  });
}

function hasAnswerValue(values, answer) {
  return values.some((value) => areNorwegianTextEqual(value, answer));
}

function normalizeChoiceValues(rawChoices, answer, optionCount) {
  const deduped = uniqueNorwegianValues(rawChoices, {
    lowerCase: false
  });

  if (!hasAnswerValue(deduped, answer)) {
    deduped.push(answer);
  }

  if (deduped.length <= optionCount) {
    return deduped;
  }

  const firstSlice = deduped.slice(0, optionCount);
  if (hasAnswerValue(firstSlice, answer)) {
    return firstSlice;
  }

  const withoutAnswer = deduped.filter((value) => !areNorwegianTextEqual(value, answer));
  return [answer, ...withoutAnswer.slice(0, Math.max(0, optionCount - 1))];
}

function buildExplanationResolver(item) {
  const map = item?.optionExplanations;

  if (!map || typeof map !== "object" || Array.isArray(map)) {
    return () => null;
  }

  const normalizedLookup = new Map();

  for (const [key, value] of Object.entries(map)) {
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const normalizedKey = normalizeNorwegianText(key, {
      lowerCase: true
    });

    normalizedLookup.set(normalizedKey, value.trim());
  }

  return (optionValue) => {
    if (typeof map?.[optionValue] === "string" && map[optionValue].trim()) {
      return map[optionValue].trim();
    }

    const normalizedOption = normalizeNorwegianText(optionValue, {
      lowerCase: true
    });

    return normalizedLookup.get(normalizedOption) || null;
  };
}

function createOptionEntry(optionValue, prompt, answer, resolveExplanation) {
  const explanation = resolveExplanation(optionValue);

  if (explanation) {
    return {
      value: optionValue,
      label: optionValue,
      explanation
    };
  }

  if (areNorwegianTextEqual(optionValue, answer)) {
    return {
      value: optionValue,
      label: optionValue,
      explanation: `Correct: \"${optionValue}\" matches the prompt \"${prompt}\".`
    };
  }

  return {
    value: optionValue,
    label: optionValue,
    explanation: `Incorrect: \"${optionValue}\" does not match the prompt \"${prompt}\".`
  };
}

function buildOptions(item, items, config, prompt, answer) {
  const sourceChoices = config.choicesField ? item?.[config.choicesField] : null;
  const optionCount = Number.isInteger(config.optionCount) ? config.optionCount : 4;
  const resolveExplanation = buildExplanationResolver(item);

  if (Array.isArray(sourceChoices) && sourceChoices.length >= 2) {
    const normalizedChoices = normalizeChoiceValues(sourceChoices, answer, optionCount);
    const shuffledChoices = shuffle(normalizedChoices);

    return shuffledChoices.map((value) => createOptionEntry(value, prompt, answer, resolveExplanation));
  }

  const optionPool = collectUniqueFieldValues(items, config.optionSourceField)
    .filter((value) => !areNorwegianTextEqual(value, answer));

  const distractors = sampleWithoutReplacement(optionPool, optionCount - 1);
  let options = [answer, ...distractors];

  if (options.length < optionCount) {
    const fallbackPool = collectUniqueFieldValues(items, config.answerField)
      .filter((value) => !options.some((option) => areNorwegianTextEqual(option, value)));

    options = [...options, ...sampleWithoutReplacement(fallbackPool, optionCount - options.length)];
  }

  if (!hasAnswerValue(options, answer) && options.length) {
    options[0] = answer;
  }

  return shuffle(options).map((value) => createOptionEntry(value, prompt, answer, resolveExplanation));
}

function toSelectedValue(selected) {
  if (typeof selected === "string") {
    return selected;
  }

  if (selected && typeof selected === "object") {
    if (typeof selected.value === "string") {
      return selected.value;
    }

    if (typeof selected.label === "string") {
      return selected.label;
    }
  }

  return "";
}

export function createMultipleChoiceStrategy(context) {
  const { config, items } = context;

  function createQuestion(item) {
    const prompt = normalizeNorwegianText(item?.[config.promptField], {
      lowerCase: false
    });

    const answer = normalizeNorwegianText(item?.[config.answerField], {
      lowerCase: false
    });

    if (!prompt) {
      throw new Error(`Question item ${item?.id ?? "unknown"} has empty prompt`);
    }

    if (!answer) {
      throw new Error(`Question item ${item?.id ?? "unknown"} has empty answer`);
    }

    return {
      id: item?.id,
      prompt,
      answer,
      options: buildOptions(item, items, config, prompt, answer)
    };
  }

  function evaluateAnswer(question, selected) {
    const selectedValue = normalizeNorwegianText(toSelectedValue(selected), {
      lowerCase: false
    });

    if (!selectedValue) {
      return null;
    }

    const isCorrect = areNorwegianTextEqual(selectedValue, question.answer);

    return {
      isCorrect,
      selectedValue,
      correctAnswer: question.answer,
      optionFeedback: question.options.map((option) => ({
        ...option,
        isCorrectOption: areNorwegianTextEqual(option.value, question.answer),
        isSelected: areNorwegianTextEqual(option.value, selectedValue)
      }))
    };
  }

  function getMeta() {
    const uniqueAnswers = collectUniqueFieldValues(items, config.answerField);

    return {
      questionCount: items.length,
      entityCount: uniqueAnswers.length,
      optionCount: config.optionCount
    };
  }

  return {
    createQuestion,
    evaluateAnswer,
    getMeta
  };
}
