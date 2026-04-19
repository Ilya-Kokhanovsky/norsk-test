export function byId(documentRef, id, { required = true } = {}) {
  const node = documentRef.getElementById(id);
  if (!node && required) {
    throw new Error(`Missing required DOM node: #${id}`);
  }
  return node;
}

export function setText(node, value) {
  if (!node) {
    return;
  }
  node.textContent = value == null ? "" : String(value);
}

export function setHtml(node, html) {
  if (!node) {
    return;
  }
  node.innerHTML = html || "";
}

export function toggleHidden(node, hidden) {
  if (!node) {
    return;
  }
  node.classList.toggle("hidden", Boolean(hidden));
}

export function setDisabled(nodes, disabled = true) {
  for (const node of nodes) {
    node.disabled = disabled;
  }
}

export function createNode(documentRef, tagName, config = {}) {
  const node = documentRef.createElement(tagName);

  if (config.className) {
    node.className = config.className;
  }

  if (config.text != null) {
    node.textContent = String(config.text);
  }

  if (config.html) {
    node.innerHTML = config.html;
  }

  if (config.attrs && typeof config.attrs === "object") {
    for (const [key, value] of Object.entries(config.attrs)) {
      node.setAttribute(key, String(value));
    }
  }

  if (config.dataset && typeof config.dataset === "object") {
    for (const [key, value] of Object.entries(config.dataset)) {
      node.dataset[key] = String(value);
    }
  }

  return node;
}
