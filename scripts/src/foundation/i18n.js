import i18next from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

const SUPPORTED_LANGUAGES = ["ru", "uk"];
const FALLBACK_LANGUAGE = "ru";
const LANGUAGE_STORAGE_KEY = "norskLanguage";

let initPromise = null;
const languageChangeSubscribers = new Set();

function getLocalStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
}

function persistLanguage(language) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  const normalizedLanguage = String(language || "").toLowerCase();
  if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
    return;
  }

  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  } catch {
    // Ignore storage errors to keep i18n flow stable.
  }
}

function normalizeBasePath(rawPath) {
  if (typeof rawPath !== "string" || !rawPath.trim()) {
    return "./locales";
  }

  return rawPath.replace(/\/$/, "");
}

function getLocalesBasePath() {
  const fromBody = document.body?.dataset?.i18nPath;
  return normalizeBasePath(fromBody || "./locales");
}

function safeParseOptions(rawValue) {
  if (!rawValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function applyNodeTranslation(node) {
  const key = node.dataset.i18n;
  if (!key) {
    return;
  }

  const options = safeParseOptions(node.dataset.i18nOptions);
  node.textContent = i18next.t(key, options);

  if (node.dataset.i18nPlaceholder) {
    node.setAttribute("placeholder", i18next.t(node.dataset.i18nPlaceholder, options));
  }

  if (node.dataset.i18nTitle) {
    node.setAttribute("title", i18next.t(node.dataset.i18nTitle, options));
  }

  if (node.dataset.i18nAriaLabel) {
    node.setAttribute("aria-label", i18next.t(node.dataset.i18nAriaLabel, options));
  }
}

function updateLanguageSwitcherState(rootNode = document) {
  const switchers = rootNode.querySelectorAll("[data-lang-switcher]");
  const currentLanguage = getCurrentLanguage();

  for (const switcher of switchers) {
    const currentBadge = switcher.querySelector("[data-lang-current]");
    if (currentBadge) {
      currentBadge.textContent = i18next.t(`languages.short.${currentLanguage}`);
    }

    const options = switcher.querySelectorAll("[data-lang-option]");
    for (const option of options) {
      const isActive = option.dataset.langOption === currentLanguage;
      option.classList.toggle("bg-slate-100", isActive);
      option.classList.toggle("text-slate-900", isActive);
      option.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }
}

function bindLanguageSwitchers(rootNode = document) {
  const switchers = rootNode.querySelectorAll("[data-lang-switcher]");

  for (const switcher of switchers) {
    if (switcher.dataset.langBound === "1") {
      continue;
    }

    switcher.dataset.langBound = "1";

    const toggle = switcher.querySelector("[data-lang-toggle]");
    const menu = switcher.querySelector("[data-lang-menu]");

    if (!toggle || !menu) {
      continue;
    }

    const closeMenu = () => {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      menu.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
    };

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();

      if (menu.classList.contains("hidden")) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    menu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lang-option]");
      if (!button) {
        return;
      }

      const language = button.dataset.langOption;
      if (!language) {
        return;
      }

      changeLanguage(language).catch(() => {});
      closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (!switcher.contains(event.target)) {
        closeMenu();
      }
    });

    closeMenu();
  }

  updateLanguageSwitcherState(rootNode);
}

export function t(key, options = {}) {
  if (!i18next.isInitialized) {
    if (Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
      return options.defaultValue;
    }

    return key;
  }

  return i18next.t(key, options);
}

export function getCurrentLanguage() {
  const language = i18next.resolvedLanguage || i18next.language || FALLBACK_LANGUAGE;
  const short = String(language).split("-")[0];

  return SUPPORTED_LANGUAGES.includes(short) ? short : FALLBACK_LANGUAGE;
}

export function applyTranslations(rootNode = document) {
  if (!i18next.isInitialized) {
    return;
  }

  const nodes = rootNode.querySelectorAll("[data-i18n]");
  for (const node of nodes) {
    applyNodeTranslation(node);
  }

  updateLanguageSwitcherState(rootNode);
}

export async function changeLanguage(language) {
  await initI18n();

  const normalizedLanguage = String(language || "").toLowerCase();
  if (!SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
    return getCurrentLanguage();
  }

  await i18next.changeLanguage(normalizedLanguage);
  persistLanguage(normalizedLanguage);
  return getCurrentLanguage();
}

export function onLanguageChanged(handler) {
  if (typeof handler !== "function") {
    return () => {};
  }

  languageChangeSubscribers.add(handler);

  return () => {
    languageChangeSubscribers.delete(handler);
  };
}

function notifyLanguageSubscribers(language) {
  for (const subscriber of languageChangeSubscribers) {
    try {
      subscriber(language);
    } catch {
      // Ignore subscriber errors to keep i18n flow stable.
    }
  }
}

export async function initI18n() {
  if (initPromise) {
    return initPromise;
  }

  const loadPath = `${getLocalesBasePath()}/{{lng}}/{{ns}}.json`;

  initPromise = i18next
    .use(Backend)
    .use(LanguageDetector)
    .init({
      fallbackLng: FALLBACK_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGES,
      load: "languageOnly",
      ns: ["translation"],
      defaultNS: "translation",
      debug: false,
      interpolation: {
        escapeValue: false
      },
      backend: {
        loadPath
      },
      detection: {
        order: ["querystring", "localStorage", "navigator", "htmlTag"],
        lookupQuerystring: "lng",
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        caches: ["localStorage"],
        checkWhitelist: true
      }
    })
    .then(() => {
      const initialLanguage = getCurrentLanguage();
      document.documentElement.lang = initialLanguage;
      persistLanguage(initialLanguage);
      bindLanguageSwitchers(document);
      applyTranslations(document);

      i18next.on("languageChanged", () => {
        const activeLanguage = getCurrentLanguage();
        document.documentElement.lang = activeLanguage;
        persistLanguage(activeLanguage);
        applyTranslations(document);
        bindLanguageSwitchers(document);
        notifyLanguageSubscribers(activeLanguage);
      });

      document.addEventListener("components:ready", () => {
        bindLanguageSwitchers(document);
        applyTranslations(document);
      });

      return i18next;
    })
    .catch((error) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}
