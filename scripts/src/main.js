import { loadCatalog } from "./core/catalog/loadCatalog.js";
import { loadJson } from "./core/data/loadJson.js";
import { createSession } from "./core/engine/createSession.js";
import { initI18n, onLanguageChanged, t } from "./foundation/i18n.js";
import { createQuizView } from "./ui/createQuizView.js";

const CATALOG_PATH = document.body.dataset.catalogPath || "data/tests/catalog.json";
const FORCED_TEST_ID = document.body.dataset.testId || null;
const HOME_URL = document.body.dataset.homeUrl || null;

const view = createQuizView(document);

let catalog = null;
let activeTestConfig = null;
let activeSession = null;

function findTestConfigById(testId) {
  return catalog.tests.find((test) => test.id === testId) || null;
}

function resolveCurrentTestId() {
  if (FORCED_TEST_ID) {
    return FORCED_TEST_ID;
  }

  return view.getSelectedTestId() || catalog.defaultTestId;
}

async function setupStartScreen(testId) {
  const testConfig = findTestConfigById(testId);
  if (!testConfig) {
    throw new Error(`Unknown test id: ${testId}`);
  }

  const dataset = await loadJson(testConfig.datasetPath);
  const tempSession = createSession(testConfig, dataset);
  const meta = tempSession.getMeta();

  activeTestConfig = testConfig;
  view.setStartInfo(testConfig, meta);
}

function loadNextQuestion() {
  if (!activeSession) {
    return;
  }

  const question = activeSession.nextQuestion();
  view.renderQuestion(question, handleAnswer);
}

function handleAnswer(selected, buttonElement) {
  const result = activeSession.submitAnswer(selected);
  if (!result) {
    return;
  }

  view.showAnswerFeedback(result, buttonElement);
  view.updateScore(result.counts);
}

async function startActiveTest() {
  const selectedTestId = resolveCurrentTestId();
  await setupStartScreen(selectedTestId);

  const dataset = await loadJson(activeTestConfig.datasetPath);
  activeSession = createSession(activeTestConfig, dataset);

  activeSession.reset();
  view.updateScore(activeSession.getCounts());
  view.showScreen("test");
  loadNextQuestion();
}

function finishActiveTest() {
  if (!activeSession) {
    view.showScreen("start");
    return;
  }

  const counts = activeSession.getCounts();
  if (!counts.total) {
    view.showScreen("start");
    return;
  }

  const summary = activeSession.finish();
  view.renderResult(summary);
  view.showScreen("result");
}

async function bootstrap() {
  try {
    await initI18n();

    catalog = await loadCatalog(CATALOG_PATH);
    const initialTestId = FORCED_TEST_ID || catalog.defaultTestId;

    if (!findTestConfigById(initialTestId)) {
      throw new Error(`Unknown forced test id: ${initialTestId}`);
    }

    if (!FORCED_TEST_ID) {
      view.populateTestSelector(catalog.tests, catalog.defaultTestId);

      view.onTestChange(async () => {
        await setupStartScreen(view.getSelectedTestId());
        view.showScreen("start");
      });
    }

    await setupStartScreen(initialTestId);

    view.onStart(async () => {
      await startActiveTest();
    });

    view.onNextQuestion(() => {
      loadNextQuestion();
    });

    view.onFinish(() => {
      finishActiveTest();
    });

    view.onRestart(async () => {
      await startActiveTest();
    });

    view.onHome(async () => {
      if (HOME_URL) {
        window.location.href = HOME_URL;
        return;
      }

      await setupStartScreen(resolveCurrentTestId());
      view.showScreen("start");
    });

    onLanguageChanged(() => {
      view.refreshI18n();
    });

    view.showScreen("start");
  } catch (error) {
    view.showFatalError(t("errors.loadConfig", {
      defaultValue: "Failed to load test configuration"
    }));
  }
}

bootstrap();
