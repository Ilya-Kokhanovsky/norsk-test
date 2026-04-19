import { createIcons, icons } from "lucide";

const DEFAULT_ICON_ATTRS = {
  "stroke-width": 2
};

export function renderIcons(attrs = DEFAULT_ICON_ATTRS) {
  createIcons({
    icons,
    attrs
  });
}

export function setIcon(targetNode, iconName) {
  if (!targetNode) {
    return;
  }
  targetNode.setAttribute("data-lucide", iconName);
}

export function iconLabelMarkup(iconName, text, iconClassName = "h-4 w-4") {
  return `<span class="inline-flex items-center gap-2"><i data-lucide="${iconName}" aria-hidden="true" class="${iconClassName}"></i><span>${text}</span></span>`;
}
