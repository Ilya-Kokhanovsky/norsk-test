import {
  animateCorrectOption,
  animateFeedbackReveal,
  animatePillPulse,
  animateProgressTo,
  animateQuestionIn,
  animateResultIntro,
  animateScreenReveal,
  animateStreakReveal,
  animateWrongOption
} from "../foundation/animations.js";
import { createNode, setDisabled, setText, toggleHidden } from "../foundation/dom.js";
import { t } from "../foundation/i18n.js";
import { iconLabelMarkup, renderIcons, setIcon } from "../foundation/icons.js";
import { buildResultMessage } from "../core/utils/text.js";

const DEFAULT_OPTION_CLASS = [
  "btn-option w-full text-left px-4 py-3.5 rounded-xl",
  "border border-gray-200 bg-white",
  "min-h-[44px] break-words hyphens-auto text-sm font-medium text-gray-700",
  "hover:border-gray-400 hover:bg-gray-50"
].join(" ");

const CORRECT_OPTION_CLASS = [
  "btn-option w-full text-left px-4 py-3.5 rounded-xl",
  "border border-emerald-300 bg-emerald-50",
  "min-h-[44px] break-words hyphens-auto text-sm font-medium text-emerald-700"
].join(" ");

const WRONG_OPTION_CLASS = [
  "btn-option w-full text-left px-4 py-3.5 rounded-xl",
  "border border-red-300 bg-red-50",
  "min-h-[44px] break-words hyphens-auto text-sm font-medium text-red-600"
].join(" ");

export function createQuizView(documentRef) {
  const screens = {
    start: documentRef.getElementById("screen-start"),
    test: documentRef.getElementById("screen-test"),
    result: documentRef.getElementById("screen-result")
  };

  const refs = {
    title: documentRef.getElementById("start-title"),
    subtitle: documentRef.getElementById("start-subtitle"),
    description: documentRef.getElementById("start-description"),
    statQuestions: documentRef.getElementById("start-stat-questions"),
    statEntities: documentRef.getElementById("start-stat-entities"),
    statOptions: documentRef.getElementById("start-stat-options"),
    testSelector: documentRef.getElementById("test-selector"),
    questionLabel: documentRef.getElementById("question-label"),
    questionWrap: documentRef.getElementById("question-wrap"),
    questionText: documentRef.getElementById("question-text"),
    optionsGrid: documentRef.getElementById("options-grid"),
    answerFeedback: documentRef.getElementById("answer-feedback"),
    answerFeedbackTitle: documentRef.getElementById("answer-feedback-title"),
    answerFeedbackList: documentRef.getElementById("answer-feedback-list"),
    nextQuestionButton: documentRef.getElementById("btn-next-question"),
    streakBadge: documentRef.getElementById("streak-badge"),
    scoreCorrect: documentRef.getElementById("score-correct"),
    scoreWrong: documentRef.getElementById("score-wrong"),
    scoreTotal: documentRef.getElementById("score-total"),
    progressLine: documentRef.getElementById("progress-line"),
    pillCorrect: documentRef.getElementById("pill-correct"),
    pillWrong: documentRef.getElementById("pill-wrong"),
    resultIconWrap: documentRef.getElementById("result-icon-wrap"),
    resultIcon: documentRef.getElementById("result-icon"),
    resultSubtitle: documentRef.getElementById("result-subtitle"),
    resultTotal: documentRef.getElementById("result-total"),
    resultCorrect: documentRef.getElementById("result-correct"),
    resultWrong: documentRef.getElementById("result-wrong"),
    resultPctLabel: documentRef.getElementById("result-pct-label"),
    resultBar: documentRef.getElementById("result-bar"),
    resultMsg: documentRef.getElementById("result-msg"),
    startButton: documentRef.getElementById("btn-start"),
    finishButton: documentRef.getElementById("btn-finish"),
    restartButton: documentRef.getElementById("btn-restart"),
    homeButton: documentRef.getElementById("btn-home")
  };

  let lastAnswerButtons = [];
  let lastCounts = {
    correct: 0,
    wrong: 0,
    total: 0
  };
  let lastFeedbackResult = null;
  let lastResultSummary = null;
  let lastStreakCount = 0;

  renderIcons();

  function showScreen(name) {
    Object.keys(screens).forEach((key) => {
      toggleHidden(screens[key], key !== name);
    });

    animateScreenReveal(screens[name]);
    renderIcons();
  }

  function setStartInfo(testConfig, meta) {
    setText(refs.title, testConfig.title);
    setText(refs.subtitle, testConfig.subtitle);
    setText(refs.description, testConfig.description);
    setText(refs.statQuestions, String(meta.questionCount));
    setText(refs.statEntities, String(meta.entityCount));
    setText(refs.statOptions, String(meta.optionCount));
  }

  function populateTestSelector(tests, selectedId) {
    if (!refs.testSelector) {
      return;
    }

    refs.testSelector.innerHTML = "";

    for (const test of tests) {
      const option = createNode(documentRef, "option", {
        attrs: {
          value: test.id
        },
        text: `${test.title} · ${test.subtitle}`
      });
      refs.testSelector.appendChild(option);
    }

    refs.testSelector.value = selectedId;
  }

  function getSelectedTestId() {
    if (!refs.testSelector) {
      return null;
    }

    return refs.testSelector.value;
  }

  function setQuestionLabel(label) {
    setText(refs.questionLabel, label);
  }

  function updateScore(counts) {
    lastCounts = {
      correct: counts.correct,
      wrong: counts.wrong,
      total: counts.total
    };

    setText(refs.scoreCorrect, String(counts.correct));
    setText(refs.scoreWrong, String(counts.wrong));
    setText(refs.scoreTotal, t("quiz.scoreTotal", {
      count: counts.total,
      defaultValue: String(counts.total)
    }));

    const percent = counts.total ? (counts.correct / counts.total) * 100 : 0;
    refs.progressLine.style.width = `${percent}%`;
  }

  function feedbackStateForOption(optionFeedback) {
    if (optionFeedback.isCorrectOption && optionFeedback.isSelected) {
      return {
        icon: "circle-check",
        title: t("quiz.feedback.selectedCorrect", {
          defaultValue: "Your answer: correct"
        }),
        className: "border-emerald-200 bg-emerald-50"
      };
    }

    if (optionFeedback.isCorrectOption) {
      return {
        icon: "badge-check",
        title: t("quiz.feedback.correctOption", {
          defaultValue: "Correct option"
        }),
        className: "border-emerald-200 bg-emerald-50"
      };
    }

    if (optionFeedback.isSelected) {
      return {
        icon: "circle-x",
        title: t("quiz.feedback.selectedWrong", {
          defaultValue: "Your answer: incorrect"
        }),
        className: "border-red-200 bg-red-50"
      };
    }

    return {
      icon: "circle",
      title: t("quiz.feedback.wrongOption", {
        defaultValue: "Incorrect option"
      }),
      className: "border-slate-200 bg-white"
    };
  }

  function renderAnswerFeedback(result, options = {}) {
    lastFeedbackResult = result;
    refs.answerFeedbackList.innerHTML = "";

    const title = result.isCorrect
      ? t("quiz.feedback.titleCorrect", {
        defaultValue: "Great! Why this answer is correct:"
      })
      : t("quiz.feedback.titleWrong", {
        defaultValue: "Answer review: why the selected option is incorrect"
      });

    setText(refs.answerFeedbackTitle, title);

    const feedbackNodes = [];

    for (const optionFeedback of result.optionFeedback) {
      const state = feedbackStateForOption(optionFeedback);
      const row = createNode(documentRef, "article", {
        className: `min-w-0 rounded-xl border p-3 ${state.className}`
      });

      const rowWrap = createNode(documentRef, "div", {
        className: "flex min-w-0 items-start gap-2.5"
      });

      const iconNode = createNode(documentRef, "i", {
        className: "mt-0.5 h-4 w-4 text-slate-600",
        attrs: {
          "data-lucide": state.icon,
          "aria-hidden": "true"
        }
      });

      const textWrap = createNode(documentRef, "div", {
        className: "min-w-0 flex-1"
      });

      const titleNode = createNode(documentRef, "p", {
        className: "quiz-copy text-sm font-semibold text-slate-700",
        text: `${optionFeedback.label} · ${state.title}`
      });

      const explanationNode = createNode(documentRef, "p", {
        className: "quiz-copy mt-1 text-xs leading-relaxed text-slate-500",
        text: optionFeedback.explanation
      });

      textWrap.appendChild(titleNode);
      textWrap.appendChild(explanationNode);
      rowWrap.appendChild(iconNode);
      rowWrap.appendChild(textWrap);
      row.appendChild(rowWrap);

      refs.answerFeedbackList.appendChild(row);
      feedbackNodes.push(row);
    }

    toggleHidden(refs.answerFeedback, false);
    refs.nextQuestionButton.disabled = false;
    refs.nextQuestionButton.classList.remove("opacity-50", "cursor-not-allowed");
    renderIcons();

    if (options.animate !== false) {
      animateFeedbackReveal(feedbackNodes, refs.nextQuestionButton);
    }
  }

  function renderQuestion(question, onSelect) {
    lastFeedbackResult = null;
    lastStreakCount = 0;

    setQuestionLabel(question.questionLabel);
    setText(refs.questionText, question.prompt);
    refs.optionsGrid.innerHTML = "";
    refs.answerFeedbackList.innerHTML = "";
    toggleHidden(refs.streakBadge, true);
    toggleHidden(refs.answerFeedback, true);
    refs.nextQuestionButton.disabled = true;
    refs.nextQuestionButton.classList.add("opacity-50", "cursor-not-allowed");

    const buttons = [];

    for (const option of question.options) {
      const button = createNode(documentRef, "button", {
        className: DEFAULT_OPTION_CLASS,
        text: option.label,
        dataset: {
          optionValue: option.value
        }
      });
      button.addEventListener("click", () => onSelect(option, button), { once: true });
      refs.optionsGrid.appendChild(button);
      buttons.push(button);
    }

    lastAnswerButtons = buttons;
    animateQuestionIn(refs.questionText, buttons);
  }

  function showAnswerFeedback(result, clickedButton) {
    setDisabled(lastAnswerButtons, true);

    if (result.isCorrect) {
      clickedButton.className = CORRECT_OPTION_CLASS;
      animatePillPulse(refs.pillCorrect);
      animateCorrectOption(clickedButton);
    } else {
      clickedButton.className = WRONG_OPTION_CLASS;
      animateWrongOption(clickedButton);
      animatePillPulse(refs.pillWrong);

      for (const button of lastAnswerButtons) {
        if (button.dataset.optionValue === result.correctAnswer) {
          button.className = CORRECT_OPTION_CLASS;
        }
      }
    }

    if (result.shouldShowStreak) {
      lastStreakCount = result.streakCount;
      refs.streakBadge.innerHTML = iconLabelMarkup("flame", t("quiz.streak", {
        count: result.streakCount,
        defaultValue: `${result.streakCount}`
      }));
      toggleHidden(refs.streakBadge, false);
      renderIcons();
      animateStreakReveal(refs.streakBadge);
    } else {
      lastStreakCount = 0;
    }

    renderAnswerFeedback(result);
  }

  function renderResult(summary, options = {}) {
    lastResultSummary = summary;

    setText(refs.resultTotal, String(summary.total));
    setText(refs.resultCorrect, String(summary.correct));
    setText(refs.resultWrong, String(summary.wrong));
    setText(refs.resultSubtitle, t("result.subtitle", {
      count: summary.total,
      defaultValue: String(summary.total)
    }));
    setText(refs.resultPctLabel, `${summary.accuracyPercent}%`);

    const tone = buildResultMessage(summary.accuracyPercent, summary.total);
    setIcon(refs.resultIcon, tone.icon);
    refs.resultIconWrap.className = `mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 ${tone.iconClass}`;
    renderIcons();
    setText(refs.resultMsg, t(tone.messageKey, {
      defaultValue: tone.messageKey
    }));
    refs.resultBar.className = tone.barClass;
    refs.resultBar.style.width = "0%";

    if (options.animate !== false) {
      animateProgressTo(refs.resultBar, summary.accuracyPercent);
      animateResultIntro([refs.resultIconWrap, refs.resultSubtitle, refs.resultMsg]);
    } else {
      refs.resultBar.style.width = `${summary.accuracyPercent}%`;
    }
  }

  function refreshI18n() {
    updateScore(lastCounts);

    if (!refs.streakBadge.classList.contains("hidden") && lastStreakCount > 0) {
      refs.streakBadge.innerHTML = iconLabelMarkup("flame", t("quiz.streak", {
        count: lastStreakCount,
        defaultValue: `${lastStreakCount}`
      }));
      renderIcons();
    }

    if (lastFeedbackResult && !refs.answerFeedback.classList.contains("hidden")) {
      renderAnswerFeedback(lastFeedbackResult, {
        animate: false
      });
    }

    if (lastResultSummary) {
      renderResult(lastResultSummary, {
        animate: false
      });
    }
  }

  function showFatalError(message) {
    setText(refs.description, message);
    refs.startButton.disabled = true;
    refs.startButton.classList.add("opacity-50", "cursor-not-allowed");
  }

  function onStart(handler) {
    refs.startButton.addEventListener("click", handler);
  }

  function onFinish(handler) {
    refs.finishButton.addEventListener("click", handler);
  }

  function onRestart(handler) {
    refs.restartButton.addEventListener("click", handler);
  }

  function onHome(handler) {
    refs.homeButton.addEventListener("click", handler);
  }

  function onTestChange(handler) {
    if (!refs.testSelector) {
      return;
    }

    refs.testSelector.addEventListener("change", handler);
  }

  function onNextQuestion(handler) {
    refs.nextQuestionButton.addEventListener("click", handler);
  }

  return {
    showScreen,
    setStartInfo,
    populateTestSelector,
    getSelectedTestId,
    updateScore,
    renderQuestion,
    showAnswerFeedback,
    renderResult,
    refreshI18n,
    showFatalError,
    onStart,
    onFinish,
    onRestart,
    onHome,
    onTestChange,
    onNextQuestion
  };
}
