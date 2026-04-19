import { renderIcons } from "./foundation/icons.js";

async function mountComponent(placeholderNode) {
  const sourcePath = placeholderNode.dataset.componentSrc;
  if (!sourcePath) {
    return;
  }

  const response = await fetch(sourcePath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load component: ${sourcePath}`);
  }

  const html = await response.text();
  placeholderNode.innerHTML = html;
}

function wireHomeLinks(rootNode) {
  const homeUrl = document.body.dataset.homeUrl || "index.html";
  const links = rootNode.querySelectorAll("[data-component-home-link]");

  for (const link of links) {
    link.setAttribute("href", homeUrl);
  }
}

async function bootstrapComponents() {
  const placeholders = [...document.querySelectorAll("[data-component-src]")];
  if (!placeholders.length) {
    return;
  }

  for (const placeholder of placeholders) {
    await mountComponent(placeholder);
    wireHomeLinks(placeholder);
  }

  renderIcons();
  document.dispatchEvent(new CustomEvent("components:ready"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bootstrapComponents().catch(() => {});
  });
} else {
  bootstrapComponents().catch(() => {});
}
