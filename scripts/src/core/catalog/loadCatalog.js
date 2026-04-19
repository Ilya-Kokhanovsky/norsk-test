import { loadJson } from "../data/loadJson.js";
import { createTestTemplate } from "../../foundation/testBlueprints.js";
import { assertValidTestConfig } from "../../foundation/testValidators.js";

function resolveResourcePath(resourcePath, catalogPath) {
  if (typeof resourcePath !== "string" || !resourcePath.trim()) {
    return resourcePath;
  }

  try {
    return new URL(resourcePath, new URL(catalogPath, window.location.href)).toString();
  } catch {
    return resourcePath;
  }
}

function normalizeTestConfig(rawConfig, catalogPath) {
  const normalized = createTestTemplate(rawConfig);
  normalized.datasetPath = resolveResourcePath(normalized.datasetPath, catalogPath);
  assertValidTestConfig(normalized);
  return normalized;
}

export async function loadCatalog(catalogPath) {
  const payload = await loadJson(catalogPath);
  const rawTests = Array.isArray(payload.tests) ? payload.tests : [];
  const tests = rawTests.map((testConfig) => normalizeTestConfig(testConfig, catalogPath));

  if (!tests.length) {
    throw new Error("Catalog does not contain tests");
  }

  const testIds = new Set(tests.map((test) => test.id));
  const defaultTestId = testIds.has(payload.defaultTestId) ? payload.defaultTestId : tests[0].id;

  return {
    tests,
    defaultTestId
  };
}
