const cache = new Map();

export async function loadJson(resourcePath) {
  if (cache.has(resourcePath)) {
    return cache.get(resourcePath);
  }

  const loadPromise = (async () => {
    let response;

    try {
      response = await fetch(resourcePath, { cache: "no-store" });
    } catch (error) {
      throw new Error(`Network error while loading ${resourcePath}: ${error.message}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to load ${resourcePath}: ${response.status}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`Invalid JSON payload in ${resourcePath}: ${error.message}`);
    }
  })();

  cache.set(resourcePath, loadPromise);

  try {
    return await loadPromise;
  } catch (error) {
    cache.delete(resourcePath);
    throw error;
  }
}
