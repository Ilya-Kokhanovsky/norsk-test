import { loadCatalog } from "./core/catalog/loadCatalog.js";
import { loadJson } from "./core/data/loadJson.js";
import { createNode, setText } from "./foundation/dom.js";
import { initI18n, onLanguageChanged, t } from "./foundation/i18n.js";
import { renderIcons } from "./foundation/icons.js";

const CATALOG_PATH = document.body.dataset.catalogPath || "data/tests/catalog.json";

const refs = {
  list: document.getElementById("catalog-list"),
  state: document.getElementById("catalog-state")
};

let activeCatalog = null;
let isLanguageListenerBound = false;

function resolveTestPagePath(testConfig) {
  if (typeof testConfig.pagePath === "string" && testConfig.pagePath.trim()) {
    return testConfig.pagePath;
  }
  return `tests/${testConfig.id}/index.html`;
}

function buildStatPill(questionCount) {
  const statLabel = Number.isInteger(questionCount)
    ? t("catalog.questionsCount", {
      count: questionCount,
      defaultValue: `${questionCount}`
    })
    : t("catalog.questionsLoading", {
      defaultValue: "Loading questions"
    });

  const pill = createNode(document, "span", {
    className: "inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500"
  });

  const icon = createNode(document, "i", {
    className: "h-3.5 w-3.5",
    attrs: {
      "data-lucide": "list-checks",
      "aria-hidden": "true"
    }
  });

  const text = createNode(document, "span", {
    className: "min-w-0 break-words hyphens-auto",
    text: statLabel
  });

  pill.appendChild(icon);
  pill.appendChild(text);

  return pill;
}

function createTestCard(testConfig, questionCount) {
  const article = createNode(document, "article", {
    className: "rounded-3xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur sm:p-6"
  });

  const title = createNode(document, "h2", {
    className: "quiz-copy text-lg font-bold text-slate-900 sm:text-xl",
    text: `${testConfig.title} · ${testConfig.subtitle}`
  });

  const description = createNode(document, "p", {
    className: "quiz-copy mt-2 text-sm leading-relaxed text-slate-500",
    text: testConfig.description
  });

  const controls = createNode(document, "div", {
    className: "mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
  });

  const stat = buildStatPill(questionCount);

  const action = createNode(document, "a", {
    className: "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 active:bg-slate-950 sm:w-auto",
    attrs: {
      href: resolveTestPagePath(testConfig)
    }
  });

  const actionIcon = createNode(document, "i", {
    className: "h-4 w-4",
    attrs: {
      "data-lucide": "play",
      "aria-hidden": "true"
    }
  });

  const actionLabel = createNode(document, "span", {
    text: t("catalog.openTest", {
      defaultValue: "Open test"
    })
  });

  action.appendChild(actionIcon);
  action.appendChild(actionLabel);

  controls.appendChild(stat);
  controls.appendChild(action);

  article.appendChild(title);
  article.appendChild(description);
  article.appendChild(controls);

  return article;
}

async function getQuestionCount(testConfig) {
  const dataset = await loadJson(testConfig.datasetPath);
  return Array.isArray(dataset?.items) ? dataset.items.length : null;
}

async function renderCatalog(catalog) {
  refs.list.innerHTML = "";

  const cards = await Promise.all(
    catalog.tests.map(async (testConfig) => {
      const questionCount = await getQuestionCount(testConfig);
      return createTestCard(testConfig, questionCount);
    })
  );

  for (const card of cards) {
    refs.list.appendChild(card);
  }

  renderIcons();
}

async function bootstrapCatalog() {
  if (!refs.list || !refs.state) {
    return;
  }

  try {
    await initI18n();
    activeCatalog = await loadCatalog(CATALOG_PATH);

    await renderCatalog(activeCatalog);
    setText(refs.state, t("catalog.ready", {
      defaultValue: "Select a test to start"
    }));

    if (!isLanguageListenerBound) {
      isLanguageListenerBound = true;

      onLanguageChanged(async () => {
        if (!activeCatalog) {
          return;
        }

        try {
          await renderCatalog(activeCatalog);
          setText(refs.state, t("catalog.ready", {
            defaultValue: "Select a test to start"
          }));
        } catch {
          setText(refs.state, t("catalog.error", {
            defaultValue: "Failed to load test catalog"
          }));
        }
      });
    }
  } catch {
    setText(refs.state, t("catalog.error", {
      defaultValue: "Failed to load test catalog"
    }));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bootstrapCatalog();
  });
} else {
  bootstrapCatalog();
}
