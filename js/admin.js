const ADMIN_DRAFT_KEY = "epub_pro_admin_draft_v626";
const ADD_CHAPTER_SELECT_VALUE = "__add_new_chapter__";

const SCREENS = {
  start: "startScreen",
  repo: "repoScreen",
  content: "contentScreen",
  chapters: "chaptersScreen",
  cover: "coverScreen",
  metadata: "metadataScreen",
  export: "exportScreen"
};

const screens = {
  start: document.getElementById(SCREENS.start),
  repo: document.getElementById(SCREENS.repo),
  content: document.getElementById(SCREENS.content),
  chapters: document.getElementById(SCREENS.chapters),
  cover: document.getElementById(SCREENS.cover),
  metadata: document.getElementById(SCREENS.metadata),
  export: document.getElementById(SCREENS.export)
};

const topbarMenuBtn = document.getElementById("topbarMenuBtn");
const topbarDropdown = document.getElementById("topbarDropdown");
const goToStartBtn = document.getElementById("goToStartBtn");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const loadDraftBtn = document.getElementById("loadDraftBtn");

const startNewBookBtn = document.getElementById("startNewBookBtn");
const importBookInput = document.getElementById("importBookInput");
const openRepoBtn = document.getElementById("openRepoBtn");

const refreshRepoBtn = document.getElementById("refreshRepoBtn");
const repoSearchInput = document.getElementById("repoSearchInput");
const repoBooksList = document.getElementById("repoBooksList");
const backFromRepoBtn = document.getElementById("backFromRepoBtn");

const chapterSelect = document.getElementById("chapterSelect");
const chapterTitleInput = document.getElementById("chapterTitleInput");
const chapterHtmlInput = document.getElementById("chapterHtmlInput");

const prevChapterBtn = document.getElementById("prevChapterBtn");
const nextChapterBtn = document.getElementById("nextChapterBtn");

const addChapterBtn = document.getElementById("addChapterBtn");
const duplicateChapterBtn = document.getElementById("duplicateChapterBtn");
const deleteChapterBtn = document.getElementById("deleteChapterBtn");
const chaptersList = document.getElementById("chaptersList");

const coverInput = document.getElementById("coverInput");
const coverPreview = document.getElementById("coverPreview");
const coverFileNameInput = document.getElementById("coverFileNameInput");

const bookTitleInput = document.getElementById("bookTitleInput");
const bookAuthorInput = document.getElementById("bookAuthorInput");
const bookCategoryInput = document.getElementById("bookCategoryInput");
const bookLanguageInput = document.getElementById("bookLanguageInput");
const bookFileNameInput = document.getElementById("bookFileNameInput");
const bookDescriptionInput = document.getElementById("bookDescriptionInput");

const exportEpubBtn = document.getElementById("exportEpubBtn");
const exportHtmlBtn = document.getElementById("exportHtmlBtn");
const exportTxtBtn = document.getElementById("exportTxtBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportLibraryEntryBtn = document.getElementById("exportLibraryEntryBtn");

const currentProjectTitle = document.querySelectorAll("#currentProjectTitle");
const currentProjectAuthor = document.querySelectorAll("#currentProjectAuthor");
const currentProjectSource = document.querySelectorAll("#currentProjectSource");
const currentProjectChapterCount = document.querySelectorAll("#currentProjectChapterCount");
const adminLogOutput = document.getElementById("adminLogOutput");

const backFromContentBtn = document.getElementById("backFromContentBtn");
const goToChaptersBtn = document.getElementById("goToChaptersBtn");
const goToChaptersBtnTop = document.getElementById("goToChaptersBtnTop");
const backToContentBtn = document.getElementById("backToContentBtn");
const goToCoverBtn = document.getElementById("goToCoverBtn");
const goToCoverBtnTop = document.getElementById("goToCoverBtnTop");
const backToChaptersBtn = document.getElementById("backToChaptersBtn");
const goToMetadataBtn = document.getElementById("goToMetadataBtn");
const goToMetadataBtnTop = document.getElementById("goToMetadataBtnTop");
const backToCoverBtn = document.getElementById("backToCoverBtn");
const goToExportBtn = document.getElementById("goToExportBtn");
const goToExportBtnTop = document.getElementById("goToExportBtnTop");
const backToMetadataBtn = document.getElementById("backToMetadataBtn");
const finishToStartBtn = document.getElementById("finishToStartBtn");

const editorToolbar = document.getElementById("editorToolbar");
const bookEditor = document.getElementById("bookEditor");
const inlineImageInput = document.getElementById("inlineImageInput");
const insertImageBtn = document.getElementById("insertImageBtn");
const deleteImageBtn = document.getElementById("deleteImageBtn");
const alignImageLeftBtn = document.getElementById("alignImageLeftBtn");
const alignImageCenterBtn = document.getElementById("alignImageCenterBtn");
const alignImageRightBtn = document.getElementById("alignImageRightBtn");
const imageWidthInput = document.getElementById("imageWidthInput");
const applyImageWidthBtn = document.getElementById("applyImageWidthBtn");
const dropdownToggles = document.querySelectorAll("[data-dropdown]");

let repoBooks = [];
let currentChapterIndex = -1;
let currentScreenKey = "start";
let lastStartAction = null;

let draggedChapterIndex = null;
let touchDragIndex = null;
let touchDragElement = null;
let touchPlaceholder = null;
let touchDragStarted = false;

let suppressEditorSync = false;
let lastRange = null;

let activeResizable = null;
let resizeState = null;

let project = createEmptyProject();

function createEmptyProject() {
  return {
    source: "Nowy projekt",
    meta: {
      title: "",
      author: "",
      category: "",
      language: "pl",
      fileName: "",
      description: "",
      coverFileName: ""
    },
    cover: {
      name: "",
      dataUrl: ""
    },
    images: [],
    chapters: []
  };
}

function createEmptyChapter(index = 0) {
  return {
    id: `chapter-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: `Rozdział ${index + 1}`,
    file: `chapter-${index + 1}.xhtml`,
    html: "<p>Zacznij pisać treść rozdziału tutaj...</p>"
  };
}

function logMessage(message) {
  const time = new Date().toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const line = `[${time}] ${message}`;
  if (adminLogOutput) {
    adminLogOutput.value = adminLogOutput.value ? `${line}\n${adminLogOutput.value}` : line;
  }
  console.log(line);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html || "";
  return (temp.textContent || temp.innerText || "").trim();
}

function normalizeFileName(name, fallbackBase, ext) {
  const cleanBase = slugify(fallbackBase || "projekt") || "projekt";
  const cleanName = (name || "").trim();
  if (!cleanName) return `${cleanBase}.${ext}`;
  if (cleanName.toLowerCase().endsWith(`.${ext}`)) return cleanName;
  return `${cleanName}.${ext}`;
}

function normalizeChapterFileName(fileName, index) {
  const fallback = `chapter-${index + 1}.xhtml`;
  const clean = (fileName || "").trim();
  if (!clean) return fallback;
  if (/\.(xhtml|html)$/i.test(clean)) return clean;
  return `${clean}.xhtml`;
}

function updateTopbarOffset() {
  const topbar = document.querySelector(".admin-topbar");
  const height = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty("--admin-topbar-height", `${height}px`);
}

function closeTopbarMenu() {
  if (!topbarDropdown || !topbarMenuBtn) return;
  topbarDropdown.hidden = true;
  topbarMenuBtn.setAttribute("aria-expanded", "false");
}

function toggleTopbarMenu() {
  if (!topbarDropdown || !topbarMenuBtn) return;
  const willOpen = topbarDropdown.hidden;
  topbarDropdown.hidden = !willOpen;
  topbarMenuBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
}

function showScreen(screenKey, options = {}) {
  const { scrollToTop = true, focusEditor = false } = options;

  Object.entries(screens).forEach(([key, element]) => {
    if (!element) return;
    element.classList.toggle("active-screen", key === screenKey);
  });

  currentScreenKey = screenKey;
  closeTopbarMenu();
  closeAllDropdowns();

  if (scrollToTop) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateTopbarOffset();

  if (screenKey === "content" && focusEditor) {
    setTimeout(() => {
      focusEditorAtEnd();
    }, 120);
  }
}

function updateSummaryNodeList(nodeList, value, fallback = "—") {
  nodeList.forEach((node) => {
    node.textContent = value || fallback;
  });
}

function updateSummary() {
  updateSummaryNodeList(currentProjectTitle, project.meta.title, "Brak projektu");
  updateSummaryNodeList(currentProjectAuthor, project.meta.author, "—");
  updateSummaryNodeList(currentProjectSource, project.source, "—");
  updateSummaryNodeList(currentProjectChapterCount, String(project.chapters.length || 0), "0");
}

function saveMetaFromInputs() {
  project.meta.title = bookTitleInput.value.trim();
  project.meta.author = bookAuthorInput.value.trim();
  project.meta.category = bookCategoryInput.value.trim();
  project.meta.language = bookLanguageInput.value.trim() || "pl";
  project.meta.fileName = bookFileNameInput.value.trim();
  project.meta.description = bookDescriptionInput.value.trim();
  project.meta.coverFileName = coverFileNameInput.value.trim();

  if (project.meta.coverFileName) {
    project.cover.name = project.meta.coverFileName;
  }

  updateSummary();
}

function fillMetaInputs() {
  bookTitleInput.value = project.meta.title || "";
  bookAuthorInput.value = project.meta.author || "";
  bookCategoryInput.value = project.meta.category || "";
  bookLanguageInput.value = project.meta.language || "pl";
  bookFileNameInput.value = project.meta.fileName || "";
  bookDescriptionInput.value = project.meta.description || "";
  coverFileNameInput.value = project.meta.coverFileName || project.cover?.name || "";
}

function autoFillFileName() {
  const title = bookTitleInput.value.trim();
  const slug = slugify(title);

  if (!bookFileNameInput.value.trim() && slug) {
    bookFileNameInput.value = `${slug}.epub`;
  }

  if (!coverFileNameInput.value.trim() && slug) {
    coverFileNameInput.value = `${slug}-cover.jpg`;
  }

  saveMetaFromInputs();
}

function getCurrentChapter() {
  if (currentChapterIndex < 0) return null;
  return project.chapters[currentChapterIndex] || null;
}

function setEditorHtml(html) {
  suppressEditorSync = true;
  bookEditor.innerHTML = html || "<p></p>";
  bookEditor.dataset.placeholder = "Zacznij pisać treść rozdziału...";
  upgradeImagesToResizable();
  suppressEditorSync = false;
}

function getEditorHtml() {
  const html = bookEditor.innerHTML.trim();
  if (!html || html === "<br>") return "<p></p>";
  return html;
}

function focusEditorAtEnd() {
  if (!bookEditor) return;
  bookEditor.focus();

  const range = document.createRange();
  range.selectNodeContents(bookEditor);
  range.collapse(false);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  rememberSelection();
}

function rememberSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  if (bookEditor.contains(range.commonAncestorContainer)) {
    lastRange = range.cloneRange();
  }
}

function restoreSelection() {
  if (!lastRange) return false;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(lastRange);
  return true;
}

function renderChapterSelect() {
  chapterSelect.innerHTML = "";

  if (!project.chapters.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Brak rozdziałów";
    chapterSelect.appendChild(option);
    return;
  }

  project.chapters.forEach((chapter, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = chapter.title || `Rozdział ${index + 1}`;
    if (index === currentChapterIndex) option.selected = true;
    chapterSelect.appendChild(option);
  });

  const addOption = document.createElement("option");
  addOption.value = ADD_CHAPTER_SELECT_VALUE;
  addOption.textContent = "+ Dodaj nowy rozdział";
  chapterSelect.appendChild(addOption);

  updateChapterSwitcherButtons();
}

function updateChapterSwitcherButtons() {
  prevChapterBtn.disabled = currentChapterIndex <= 0;
  nextChapterBtn.disabled =
    currentChapterIndex < 0 || currentChapterIndex >= project.chapters.length - 1;
}

function renderChapters() {
  renderChapterSelect();

  if (!project.chapters.length) {
    chaptersList.innerHTML = `<div class="empty-state">Nie ma jeszcze rozdziałów.</div>`;
    return;
  }

  chaptersList.innerHTML = "";

  project.chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chapter-item ${index === currentChapterIndex ? "active" : ""}`;
    button.dataset.index = String(index);
    button.innerHTML = `
      <strong>${escapeHtml(chapter.title || `Rozdział ${index + 1}`)}</strong>
      <span>${escapeHtml(chapter.file || `chapter-${index + 1}.xhtml`)}</span>
    `;

    button.addEventListener("click", () => {
      if (touchDragStarted || draggedChapterIndex !== null) return;
      switchToChapter(index);
    });

    setupDesktopDrag(button, index);
    setupTouchDrag(button, index);

    chaptersList.appendChild(button);
  });
}

function renderCurrentChapter() {
  const chapter = getCurrentChapter();

  if (!chapter) {
    chapterTitleInput.value = "";
    chapterHtmlInput.value = "";
    setEditorHtml("<p>Zacznij pisać treść rozdziału tutaj...</p>");
    updateChapterSwitcherButtons();
    return;
  }

  chapterTitleInput.value = chapter.title || "";
  chapterHtmlInput.value = chapter.html || "";
  setEditorHtml(chapter.html || "<p></p>");
  renderChapterSelect();
  updateChapterSwitcherButtons();
}

function persistCurrentChapter() {
  const chapter = getCurrentChapter();
  if (!chapter) return;

  chapter.title = chapterTitleInput.value.trim() || `Rozdział ${currentChapterIndex + 1}`;
  chapter.html = getEditorHtml() || "<p></p>";
  chapterHtmlInput.value = chapter.html;

  renderChapterSelect();
  updateSummary();
}

function switchToChapter(index) {
  if (index < 0 || index >= project.chapters.length) return;
  persistCurrentChapter();
  currentChapterIndex = index;
  renderChapters();
  renderCurrentChapter();

  if (currentScreenKey === "content") {
    setTimeout(() => focusEditorAtEnd(), 50);
  }
}

function goToPrevChapter() {
  if (currentChapterIndex > 0) switchToChapter(currentChapterIndex - 1);
}

function goToNextChapter() {
  if (currentChapterIndex < project.chapters.length - 1) switchToChapter(currentChapterIndex + 1);
}

function renderCover() {
  if (project.cover?.dataUrl) {
    coverPreview.src = project.cover.dataUrl;
    coverPreview.style.display = "block";
  } else {
    coverPreview.removeAttribute("src");
    coverPreview.style.display = "none";
  }
}

function renderAllProjectUi() {
  fillMetaInputs();
  updateSummary();
  renderChapters();
  renderCurrentChapter();
  renderCover();
}

function createNewProject() {
  project = createEmptyProject();
  project.source = "Nowy projekt";
  project.chapters = [createEmptyChapter(0)];
  currentChapterIndex = 0;
  lastStartAction = "new";
  renderAllProjectUi();
  showScreen("content", { focusEditor: true });
  logMessage("Utworzono nowy projekt książki.");
}

function createAndSwitchToNewChapter() {
  persistCurrentChapter();
  const chapter = createEmptyChapter(project.chapters.length);
  project.chapters.push(chapter);
  currentChapterIndex = project.chapters.length - 1;
  renderChapters();
  renderCurrentChapter();
  updateSummary();
  logMessage(`Dodano nowy rozdział: ${chapter.title}.`);
  if (currentScreenKey === "content") {
    setTimeout(() => focusEditorAtEnd(), 50);
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function saveDraft() {
  persistCurrentChapter();
  saveMetaFromInputs();
  localStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(project));
  logMessage("Zapisano projekt roboczy lokalnie.");
}

function loadDraft() {
  const raw = localStorage.getItem(ADMIN_DRAFT_KEY);
  if (!raw) {
    alert("Brak zapisanego projektu roboczego.");
    return;
  }

  try {
    project = JSON.parse(raw);
    project.meta = project.meta || createEmptyProject().meta;
    project.cover = project.cover || { name: "", dataUrl: "" };
    project.images = Array.isArray(project.images) ? project.images : [];
    project.chapters = Array.isArray(project.chapters) ? project.chapters : [];
    currentChapterIndex = project.chapters.length ? 0 : -1;

    renderAllProjectUi();
    showScreen("content", { focusEditor: true });
    logMessage("Wczytano projekt roboczy.");
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać projektu roboczego.");
    logMessage(`Błąd wczytywania projektu roboczego: ${error?.message || error}`);
  }
}

function buildProjectJsonFileName() {
  const base = slugify(project.meta.title) || "projekt-epub";
  return `${base}.json`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function exportJson() {
  persistCurrentChapter();
  saveMetaFromInputs();

  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json;charset=utf-8"
  });

  downloadBlob(blob, buildProjectJsonFileName());
  logMessage("Wyeksportowano backup projektu.");
}

function buildLibraryEntryObject() {
  persistCurrentChapter();
  saveMetaFromInputs();

  const slug = slugify(project.meta.title) || "book";
  const epubFile = project.meta.fileName
    ? normalizeFileName(project.meta.fileName, slug, "epub")
    : `${slug}.epub`;

  const coverName =
    project.meta.coverFileName ||
    project.cover?.name ||
    `${slug}-cover.jpg`;

  return {
    id: slug,
    title: project.meta.title || "Bez tytułu",
    author: project.meta.author || "",
    category: project.meta.category || "",
    description: project.meta.description || "",
    cover: `assets/covers/${coverName}`,
    epub: `books/${epubFile}`
  };
}

async function exportLibraryEntry() {
  const entry = buildLibraryEntryObject();
  const json = JSON.stringify(entry, null, 2);

  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `${entry.id}-library-entry.json`);

  const copied = await copyTextToClipboard(json);
  if (copied) logMessage("Wyeksportowano wpis do library.json i skopiowano go do schowka.");
  else logMessage("Wyeksportowano wpis do library.json.");
}

function sanitizeChapterNodeForExport(node, doc) {
  if (!node) return null;

  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;

  if (node.nodeType === TEXT_NODE) {
    return doc.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return null;
  }

  const tag = node.tagName.toLowerCase();

  if (tag === "span" && node.classList.contains("image-resizable")) {
    const img = node.querySelector("img");
    if (!img) return null;

    const cleanImg = doc.createElement("img");
    cleanImg.setAttribute("src", img.getAttribute("src") || "");
    cleanImg.setAttribute("alt", img.getAttribute("alt") || "");

    const width = node.style.width || img.style.width || "";
    const alignLeft = node.classList.contains("align-left");
    const alignRight = node.classList.contains("align-right");
    const alignCenter = node.classList.contains("align-center") || (!alignLeft && !alignRight);

    let style = "";
    if (width) style += `width:${width};max-width:100%;height:auto;display:block;`;
    else style += "max-width:100%;height:auto;display:block;";

    if (alignLeft) style += "margin:1em auto 1em 0;";
    else if (alignRight) style += "margin:1em 0 1em auto;";
    else if (alignCenter) style += "margin:1em auto;";

    cleanImg.setAttribute("style", style);
    return cleanImg;
  }

  if (tag === "img") {
    const cleanImg = doc.createElement("img");
    cleanImg.setAttribute("src", node.getAttribute("src") || "");
    cleanImg.setAttribute("alt", node.getAttribute("alt") || "");

    let style = node.getAttribute("style") || "";
    if (!/display\s*:/i.test(style)) style += "display:block;";
    if (!/height\s*:/i.test(style)) style += "height:auto;";
    if (!/max-width\s*:/i.test(style)) style += "max-width:100%;";

    cleanImg.setAttribute("style", style);
    return cleanImg;
  }

  const allowed = new Set([
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote",
    "strong", "b", "em", "i", "u", "br",
    "div", "section", "article"
  ]);

  if (!allowed.has(tag)) {
    const frag = doc.createDocumentFragment();
    Array.from(node.childNodes).forEach((child) => {
      const cleanChild = sanitizeChapterNodeForExport(child, doc);
      if (cleanChild) frag.appendChild(cleanChild);
    });
    return frag;
  }

  const clean = doc.createElement(tag);

  if (tag === "blockquote") {
    clean.setAttribute("style", "margin:1em 0;padding-left:1em;border-left:4px solid #cccccc;");
  }

  if (["p", "div", "section", "article"].includes(tag)) {
    const children = Array.from(node.childNodes)
      .map((child) => sanitizeChapterNodeForExport(child, doc))
      .filter(Boolean);

    if (
      children.length === 1 &&
      children[0].nodeType === 1 &&
      children[0].tagName &&
      children[0].tagName.toLowerCase() === "img"
    ) {
      const wrapper = doc.createElement("div");
      wrapper.appendChild(children[0]);
      return wrapper;
    }

    children.forEach((child) => clean.appendChild(child));
    return clean;
  }

  Array.from(node.childNodes).forEach((child) => {
    const cleanChild = sanitizeChapterNodeForExport(child, doc);
    if (cleanChild) clean.appendChild(cleanChild);
  });

  return clean;
}

function serializeChapterToXhtmlBody(html) {
  const source = document.createElement("div");
  source.innerHTML = html || "<p></p>";

  const xdoc = document.implementation.createDocument(null, "body", null);
  const body = xdoc.documentElement;

  Array.from(source.childNodes).forEach((node) => {
    const cleanNode = sanitizeChapterNodeForExport(node, xdoc);
    if (cleanNode) body.appendChild(cleanNode);
  });

  if (!body.childNodes.length) {
    body.appendChild(xdoc.createElement("p"));
  }

  const serializer = new XMLSerializer();
  let bodyXml = "";
  Array.from(body.childNodes).forEach((child) => {
    bodyXml += serializer.serializeToString(child);
  });

  return bodyXml || "<p></p>";
}

function buildFullBookHtmlDocument() {
  persistCurrentChapter();
  saveMetaFromInputs();

  const title = escapeHtml(project.meta.title || "Bez tytułu");
  const author = escapeHtml(project.meta.author || "");
  const description = escapeHtml(project.meta.description || "");
  const language = escapeHtml(project.meta.language || "pl");

  const coverHtml = project.cover?.dataUrl
    ? `
      <section class="book-cover">
        <img src="${project.cover.dataUrl}" alt="Okładka książki" />
      </section>
    `
    : "";

  const chaptersHtml = project.chapters
    .map((chapter, index) => `
      <section class="chapter">
        <h2>${escapeHtml(chapter.title || `Rozdział ${index + 1}`)}</h2>
        <div class="chapter-content">
          ${serializeChapterToXhtmlBody(chapter.html || "<p></p>")}
        </div>
      </section>
    `)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
</head>
<body>
  <header class="book-head">
    <h1>${title}</h1>
    ${author ? `<p><strong>Autor:</strong> ${author}</p>` : ""}
    ${description ? `<p>${description}</p>` : ""}
  </header>
  ${coverHtml}
  ${chaptersHtml}
</body>
</html>`;
}

function exportHtml() {
  const html = buildFullBookHtmlDocument();
  const base = slugify(project.meta.title) || "ksiazka";
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${base}.html`);
  logMessage("Wyeksportowano HTML.");
}

function exportTxt() {
  persistCurrentChapter();
  saveMetaFromInputs();

  const lines = [];
  lines.push(project.meta.title || "Bez tytułu");
  if (project.meta.author) lines.push(`Autor: ${project.meta.author}`);
  if (project.meta.category) lines.push(`Kategoria: ${project.meta.category}`);
  if (project.meta.description) {
    lines.push("");
    lines.push(project.meta.description);
  }
  lines.push("");
  lines.push("========================================");
  lines.push("");

  project.chapters.forEach((chapter, index) => {
    lines.push(chapter.title || `Rozdział ${index + 1}`);
    lines.push("----------------------------------------");
    lines.push(stripHtml(serializeChapterToXhtmlBody(chapter.html || "")));
    lines.push("");
  });

  const base = slugify(project.meta.title) || "ksiazka";
  downloadBlob(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }), `${base}.txt`);
  logMessage("Wyeksportowano TXT.");
}

function getImageExtension(name = "") {
  const parts = name.split(".");
  return (parts.pop() || "jpg").toLowerCase();
}

function getImageMimeType(ext) {
  switch (ext) {
    case "png": return "image/png";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "jpeg":
    case "jpg":
    default: return "image/jpeg";
  }
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function buildContainerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function buildOpf() {
  const identifier = escapeXml(slugify(project.meta.title) || "book");
  const title = escapeXml(project.meta.title || "Bez tytułu");
  const author = escapeXml(project.meta.author || "Nieznany autor");
  const language = escapeXml(project.meta.language || "pl");
  const description = escapeXml(project.meta.description || "");
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const coverFileName =
    project.meta.coverFileName ||
    project.cover?.name ||
    "cover.jpg";

  const coverMeta = project.cover?.dataUrl ? `<meta name="cover" content="cover-image"/>` : "";
  const coverManifest = project.cover?.dataUrl
    ? `<item id="cover-image" href="images/${escapeXml(coverFileName)}" media-type="${getImageMimeType(getImageExtension(coverFileName))}"/>`
    : "";

  const chapterManifest = project.chapters
    .map((chapter, index) => {
      const href = escapeXml(normalizeChapterFileName(chapter.file, index));
      return `<item id="chap${index + 1}" href="text/${href}" media-type="application/xhtml+xml"/>`;
    })
    .join("\n    ");

  const spine = project.chapters
    .map((_, index) => `<itemref idref="chap${index + 1}"/>`)
    .join("\n    ");

  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${identifier}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:description>${description}</dc:description>
    <meta property="dcterms:modified">${modified}</meta>
    ${coverMeta}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${coverManifest}
    ${chapterManifest}
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>`;
}

function buildNavXhtml() {
  const list = project.chapters
    .map((chapter, index) => {
      const title = escapeXml(chapter.title || `Rozdział ${index + 1}`);
      const href = `text/${escapeXml(normalizeChapterFileName(chapter.file, index))}`;
      return `<li><a href="${href}">${title}</a></li>`;
    })
    .join("\n        ");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(project.meta.language || "pl")}">
<head>
  <meta charset="utf-8"/>
  <title>Spis treści</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Spis treści</h1>
    <ol>
        ${list}
    </ol>
  </nav>
</body>
</html>`;
}

function buildTocNcx() {
  const navPoints = project.chapters
    .map((chapter, index) => {
      const title = escapeXml(chapter.title || `Rozdział ${index + 1}`);
      const href = `text/${escapeXml(normalizeChapterFileName(chapter.file, index))}`;
      return `
    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel><text>${title}</text></navLabel>
      <content src="${href}"/>
    </navPoint>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(slugify(project.meta.title) || "book")}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeXml(project.meta.title || "Bez tytułu")}</text>
  </docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
}

function buildChapterXhtml(chapter, index) {
  const title = escapeXml(chapter.title || `Rozdział ${index + 1}`);
  const lang = escapeXml(project.meta.language || "pl");
  const cleanBody = serializeChapterToXhtmlBody(chapter.html || "<p></p>");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  ${cleanBody}
</body>
</html>`;
}

async function exportEpub() {
  persistCurrentChapter();
  saveMetaFromInputs();

  if (!project.meta.title.trim()) {
    alert("Uzupełnij tytuł książki przed eksportem EPUB.");
    showScreen("metadata");
    return;
  }

  if (!project.chapters.length) {
    alert("Dodaj przynajmniej jeden rozdział przed eksportem EPUB.");
    showScreen("content", { focusEditor: true });
    return;
  }

  try {
    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    const metaInf = zip.folder("META-INF");
    metaInf.file("container.xml", buildContainerXml());

    const oebps = zip.folder("OEBPS");
    const textFolder = oebps.folder("text");
    const imagesFolder = oebps.folder("images");

    oebps.file("content.opf", buildOpf());
    oebps.file("nav.xhtml", buildNavXhtml());
    oebps.file("toc.ncx", buildTocNcx());

    project.chapters.forEach((chapter, index) => {
      textFolder.file(normalizeChapterFileName(chapter.file, index), buildChapterXhtml(chapter, index));
    });

    if (project.cover?.dataUrl) {
      const coverFileName = project.meta.coverFileName || project.cover.name || "cover.jpg";
      imagesFolder.file(coverFileName, dataUrlToUint8Array(project.cover.dataUrl));
    }

    const base = project.meta.fileName || `${slugify(project.meta.title) || "book"}.epub`;

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/epub+zip"
    });

    const fileName = base.toLowerCase().endsWith(".epub") ? base : `${base}.epub`;
    downloadBlob(blob, fileName);
    logMessage(`Wyeksportowano EPUB: ${fileName}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wyeksportować EPUB.");
    logMessage(`Błąd eksportu EPUB: ${error?.message || error}`);
  }
}

function parseXml(xmlText) {
  return new DOMParser().parseFromString(xmlText, "application/xml");
}

function getTextContentSafe(node) {
  return (node?.textContent || "").trim();
}

function convertDomNodeToHtml(node) {
  if (!node) return "";

  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;

  if (node.nodeType === TEXT_NODE) {
    return escapeHtml(node.textContent || "");
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return "";
  }

  const tagName = node.localName ? node.localName.toLowerCase() : node.tagName.toLowerCase();

  if (["h1","h2","h3","h4","h5","h6"].includes(tagName)) {
    return `<${tagName}>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</${tagName}>`;
  }

  if (tagName === "p") {
    return `<p>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</p>`;
  }

  if (["div","section","article","body","figure","figcaption"].includes(tagName)) {
    return `<${tagName}>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</${tagName}>`;
  }

  if (tagName === "blockquote") {
    return `<blockquote>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</blockquote>`;
  }

  if (tagName === "ul" || tagName === "ol") {
    return `<${tagName}>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</${tagName}>`;
  }

  if (tagName === "li") {
    return `<li>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</li>`;
  }

  if (tagName === "strong" || tagName === "b") {
    return `<strong>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</strong>`;
  }

  if (tagName === "em" || tagName === "i") {
    return `<em>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</em>`;
  }

  if (tagName === "u") {
    return `<u>${Array.from(node.childNodes).map(convertDomNodeToHtml).join("")}</u>`;
  }

  if (tagName === "br") {
    return "<br />";
  }

  if (tagName === "img") {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    const style = node.getAttribute("style") || "";
    const styleAttr = style ? ` style="${escapeHtml(style)}"` : "";
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${styleAttr} />`;
  }

  return Array.from(node.childNodes).map(convertDomNodeToHtml).join("");
}

function extractBodyHtmlFromXhtml(xhtmlText) {
  const doc = new DOMParser().parseFromString(xhtmlText, "application/xhtml+xml");
  const body = doc.querySelector("body");
  if (!body) return xhtmlText;

  const html = Array.from(body.childNodes).map(convertDomNodeToHtml).join("").trim() || "<p></p>";
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  const firstHeading = wrapper.querySelector("h1:first-child");
  if (firstHeading && wrapper.children.length > 1) {
    firstHeading.remove();
  }

  return wrapper.innerHTML.trim() || "<p></p>";
}

function parseOpfPath(containerXmlText) {
  const xml = parseXml(containerXmlText);
  const rootfile = xml.querySelector("rootfile");
  return rootfile?.getAttribute("full-path") || "";
}

function getBasePath(path) {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash >= 0 ? path.slice(0, lastSlash + 1) : "";
}

function resolveRelativePath(basePath, relativePath) {
  const baseParts = basePath.split("/").filter(Boolean);
  const relParts = String(relativePath || "").split("/").filter(Boolean);
  const stack = [...baseParts];

  relParts.forEach((part) => {
    if (part === ".") return;
    if (part === "..") {
      stack.pop();
      return;
    }
    stack.push(part);
  });

  return stack.join("/");
}

function parseOpfDocument(opfText) {
  const xml = parseXml(opfText);
  const metadata = { title: "", author: "", language: "pl", description: "" };

  metadata.title = getTextContentSafe(xml.querySelector("metadata > title, dc\\:title, title"));
  metadata.author = getTextContentSafe(xml.querySelector("metadata > creator, dc\\:creator, creator"));
  metadata.language = getTextContentSafe(xml.querySelector("metadata > language, dc\\:language, language")) || "pl";
  metadata.description = getTextContentSafe(xml.querySelector("metadata > description, dc\\:description, description"));

  const manifestItems = {};
  xml.querySelectorAll("manifest > item, item").forEach((item) => {
    const id = item.getAttribute("id");
    if (!id) return;
    manifestItems[id] = {
      href: item.getAttribute("href") || "",
      mediaType: item.getAttribute("media-type") || "",
      properties: item.getAttribute("properties") || ""
    };
  });

  const spine = [];
  xml.querySelectorAll("spine > itemref, itemref").forEach((itemref) => {
    const idref = itemref.getAttribute("idref");
    if (idref) spine.push(idref);
  });

  return { metadata, manifestItems, spine };
}

async function importEpubViaZip(file) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) throw new Error("Brak META-INF/container.xml");

  const containerXml = await containerFile.async("string");
  const opfPath = parseOpfPath(containerXml);
  if (!opfPath) throw new Error("Nie znaleziono ścieżki OPF w container.xml");

  const opfFile = zip.file(opfPath);
  if (!opfFile) throw new Error(`Nie znaleziono pliku OPF: ${opfPath}`);

  const opfText = await opfFile.async("string");
  const { metadata, manifestItems, spine } = parseOpfDocument(opfText);
  const opfBasePath = getBasePath(opfPath);

  const importedChapters = [];

  for (let i = 0; i < spine.length; i += 1) {
    const idref = spine[i];
    const manifest = manifestItems[idref];
    if (!manifest || !manifest.href) continue;

    const chapterPath = resolveRelativePath(opfBasePath, manifest.href);
    const chapterFile = zip.file(chapterPath);
    if (!chapterFile) continue;

    const xhtmlText = await chapterFile.async("string");
    const html = extractBodyHtmlFromXhtml(xhtmlText);

    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const heading = tmp.querySelector("h1, h2, h3");
    const title = heading?.textContent?.trim() || `Rozdział ${i + 1}`;

    importedChapters.push({
      id: idref || `chapter-${i + 1}`,
      title,
      file: manifest.href || `chapter-${i + 1}.xhtml`,
      html: html || "<p></p>"
    });
  }

  return { metadata, chapters: importedChapters };
}

async function importEpubViaEpubJs(file) {
  const buffer = await file.arrayBuffer();
  const book = ePub(buffer);

  await book.ready;

  const metadata = await book.loaded.metadata;
  const navigation = await book.loaded.navigation;
  const toc = navigation?.toc || [];
  const spineItems = book.spine?.spineItems || [];
  const importedChapters = [];

  for (let i = 0; i < spineItems.length; i += 1) {
    const item = spineItems[i];
    try {
      const text = await item.load(book.load.bind(book));

      let html = text || "<p></p>";
      if (/<body/i.test(html)) {
        html = extractBodyHtmlFromXhtml(html);
      }

      const temp = document.createElement("div");
      temp.innerHTML = html;
      const heading = temp.querySelector("h1, h2, h3");

      importedChapters.push({
        id: item.idref || `chapter-${i + 1}`,
        title: findTocLabel(toc, item.href) || heading?.textContent?.trim() || `Rozdział ${i + 1}`,
        file: item.href || `chapter-${i + 1}.xhtml`,
        html: html || "<p></p>"
      });

      item.unload();
    } catch (error) {
      console.warn(error);
    }
  }

  return {
    metadata: {
      title: metadata?.title || "",
      author: metadata?.creator || "",
      language: metadata?.language || "pl",
      description: metadata?.description || ""
    },
    chapters: importedChapters
  };
}

async function importEpubFile(file) {
  if (!file) return;

  try {
    let result;
    try {
      result = await importEpubViaZip(file);
      logMessage(`Import EPUB przez ZIP zakończony powodzeniem: ${file.name}.`);
    } catch (zipError) {
      logMessage(`ZIP fallback dla EPUB: ${zipError?.message || zipError}`);
      result = await importEpubViaEpubJs(file);
      logMessage(`Import EPUB użył trybu zapasowego epub.js: ${file.name}.`);
    }

    project = createEmptyProject();
    project.source = "Import EPUB";
    project.meta.title = result.metadata?.title || file.name.replace(/\.epub$/i, "");
    project.meta.author = result.metadata?.author || "";
    project.meta.language = result.metadata?.language || "pl";
    project.meta.description = result.metadata?.description || "";
    project.meta.fileName = file.name;
    project.chapters = result.chapters?.length ? result.chapters : [createEmptyChapter(0)];

    currentChapterIndex = 0;
    lastStartAction = "import";
    renderAllProjectUi();
    showScreen("content", { focusEditor: true });
    logMessage(`Zaimportowano plik EPUB: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować EPUB.");
    logMessage(`Błąd importu EPUB: ${file.name} | ${error?.message || error}`);
  }
}

async function importDocxFile(file) {
  if (!file) return;
  if (!window.mammoth) {
    alert("Biblioteka importu DOCX nie została załadowana.");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer: buffer });
    const html = result.value || "<p></p>";

    project = createEmptyProject();
    project.source = "Import DOCX";
    project.meta.title = file.name.replace(/\.docx$/i, "");
    project.meta.fileName = `${slugify(project.meta.title) || "book"}.epub`;
    project.chapters = splitHtmlIntoChaptersFromHeadings(html, project.meta.title || "Import DOCX");

    currentChapterIndex = 0;
    lastStartAction = "import";
    renderAllProjectUi();
    showScreen("content", { focusEditor: true });
    logMessage(`Zaimportowano plik DOCX: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować DOCX.");
    logMessage(`Błąd importu DOCX: ${file.name} | ${error?.message || error}`);
  }
}

function convertOdtXmlToHtml(contentXml) {
  let html = String(contentXml || "");
  html = html.replace(/<text:h[^>]*text:outline-level="1"[^>]*>([\s\S]*?)<\/text:h>/gi, "<h1>$1</h1>");
  html = html.replace(/<text:h[^>]*text:outline-level="2"[^>]*>([\s\S]*?)<\/text:h>/gi, "<h2>$1</h2>");
  html = html.replace(/<text:h[^>]*text:outline-level="3"[^>]*>([\s\S]*?)<\/text:h>/gi, "<h3>$1</h3>");
  html = html.replace(/<text:h[^>]*text:outline-level="4"[^>]*>([\s\S]*?)<\/text:h>/gi, "<h4>$1</h4>");
  html = html.replace(/<text:p[^>]*>([\s\S]*?)<\/text:p>/gi, "<p>$1</p>");
  html = html.replace(/<text:list-item[^>]*>/gi, "<li>");
  html = html.replace(/<\/text:list-item>/gi, "</li>");
  html = html.replace(/<text:list[^>]*>/gi, "<ul>");
  html = html.replace(/<\/text:list>/gi, "</ul>");
  html = html.replace(/<text:span[^>]*>/gi, "<span>");
  html = html.replace(/<\/text:span>/gi, "</span>");
  html = html.replace(/<office:[^>]+>/gi, "");
  html = html.replace(/<\/office:[^>]+>/gi, "");
  html = html.replace(/<style:[^>]+>[\s\S]*?<\/style:[^>]+>/gi, "");
  html = html.replace(/<meta:[^>]+>[\s\S]*?<\/meta:[^>]+>/gi, "");
  html = html.replace(/<number:[^>]+>[\s\S]*?<\/number:[^>]+>/gi, "");
  html = html.replace(/<[^>]+\/>/g, "");
  html = html.replace(/<[^>]+>/g, (match) => {
    if (/^<\/?(h1|h2|h3|h4|p|ul|li|span)>$/i.test(match)) return match;
    return "";
  });
  html = html
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

  return html.trim() || "<p></p>";
}

async function importOdtFile(file) {
  if (!file) return;

  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const contentXmlFile = zip.file("content.xml");
    if (!contentXmlFile) throw new Error("Brak content.xml w pliku ODT.");

    const contentXml = await contentXmlFile.async("string");
    const html = convertOdtXmlToHtml(contentXml);

    project = createEmptyProject();
    project.source = "Import ODT";
    project.meta.title = file.name.replace(/\.odt$/i, "");
    project.meta.fileName = `${slugify(project.meta.title) || "book"}.epub`;
    project.chapters = splitHtmlIntoChaptersFromHeadings(html, project.meta.title || "Import ODT");

    currentChapterIndex = 0;
    lastStartAction = "import";
    renderAllProjectUi();
    showScreen("content", { focusEditor: true });
    logMessage(`Zaimportowano plik ODT: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować ODT.");
    logMessage(`Błąd importu ODT: ${file.name} | ${error?.message || error}`);
  }
}

async function importHtmlFile(file) {
  try {
    const text = await file.text();

    project = createEmptyProject();
    project.source = "Import HTML";
    project.meta.title = file.name.replace(/\.html?$/i, "");
    project.meta.fileName = `${slugify(project.meta.title) || "book"}.epub`;
    project.chapters = splitHtmlIntoChaptersFromHeadings(text, project.meta.title || "Import HTML");

    currentChapterIndex = 0;
    lastStartAction = "import";
    renderAllProjectUi();
    showScreen("content", { focusEditor: true });
    logMessage(`Zaimportowano plik HTML: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować HTML.");
    logMessage(`Błąd importu HTML: ${file.name} | ${error?.message || error}`);
  }
}

async function importTxtFile(file) {
  try {
    const text = await file.text();
    const paragraphs = text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
      .join("\n");

    project = createEmptyProject();
    project.source = "Import TXT";
    project.meta.title = file.name.replace(/\.txt$/i, "");
    project.meta.fileName = `${slugify(project.meta.title) || "book"}.epub`;
    project.chapters = [{
      id: `chapter-${Date.now()}`,
      title: project.meta.title || "Import TXT",
      file: "chapter-1.xhtml",
      html: paragraphs || "<p></p>"
    }];

    currentChapterIndex = 0;
    lastStartAction = "import";
    renderAllProjectUi();
    showScreen("content", { focusEditor: true });
    logMessage(`Zaimportowano plik TXT: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować TXT.");
    logMessage(`Błąd importu TXT: ${file.name} | ${error?.message || error}`);
  }
}

function splitHtmlIntoChaptersFromHeadings(html, fallbackTitle = "Import") {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html || "";

  const rootNodes = Array.from(wrapper.childNodes);
  const chapters = [];
  let current = null;

  function startChapter(title) {
    current = {
      id: `chapter-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: title || `Rozdział ${chapters.length + 1}`,
      file: `chapter-${chapters.length + 1}.xhtml`,
      html: ""
    };
    chapters.push(current);
  }

  rootNodes.forEach((node) => {
    const isElement = node.nodeType === 1;
    const tag = isElement ? node.tagName.toLowerCase() : "";

    if (["h1", "h2"].includes(tag)) {
      startChapter(node.textContent.trim() || `Rozdział ${chapters.length + 1}`);
      current.html += node.outerHTML;
      return;
    }

    if (!current) startChapter(fallbackTitle);

    if (node.nodeType === 1) current.html += node.outerHTML;
    else if (node.nodeType === 3 && node.textContent.trim()) {
      current.html += `<p>${escapeHtml(node.textContent.trim())}</p>`;
    }
  });

  if (!chapters.length) {
    return [{
      id: `chapter-${Date.now()}`,
      title: fallbackTitle,
      file: "chapter-1.xhtml",
      html: html || "<p></p>"
    }];
  }

  return chapters.map((chapter, index) => ({
    ...chapter,
    file: `chapter-${index + 1}.xhtml`,
    title: chapter.title || `Rozdział ${index + 1}`,
    html: chapter.html || "<p></p>"
  }));
}

function findTocLabel(toc, href) {
  for (const item of toc) {
    if (item.href === href) return item.label;
    if (item.subitems?.length) {
      const found = findTocLabel(item.subitems, href);
      if (found) return found;
    }
  }
  return "";
}

function createTouchPlaceholder() {
  const placeholder = document.createElement("div");
  placeholder.className = "chapter-item";
  placeholder.style.opacity = "0.35";
  placeholder.style.borderStyle = "dashed";
  placeholder.style.minHeight = "62px";
  placeholder.innerHTML = "<strong>Upuść tutaj</strong>";
  return placeholder;
}

function getChapterItemElements() {
  return Array.from(chaptersList.querySelectorAll(".chapter-item[data-index]"));
}

function setupDesktopDrag(item, index) {
  item.setAttribute("draggable", "true");

  item.addEventListener("dragstart", (event) => {
    draggedChapterIndex = index;
    item.style.opacity = "0.45";
    event.dataTransfer.effectAllowed = "move";
    try { event.dataTransfer.setData("text/plain", String(index)); } catch {}
  });

  item.addEventListener("dragend", () => {
    draggedChapterIndex = null;
    item.style.opacity = "";
    getChapterItemElements().forEach((el) => {
      el.style.borderTop = "";
      el.style.borderBottom = "";
    });
  });

  item.addEventListener("dragover", (event) => {
    event.preventDefault();
    const rect = item.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    item.style.borderTop = before ? "2px solid #60a5fa" : "";
    item.style.borderBottom = before ? "" : "2px solid #60a5fa";
  });

  item.addEventListener("dragleave", () => {
    item.style.borderTop = "";
    item.style.borderBottom = "";
  });

  item.addEventListener("drop", (event) => {
    event.preventDefault();
    item.style.borderTop = "";
    item.style.borderBottom = "";

    const fromIndex = draggedChapterIndex;
    if (fromIndex === null) return;

    const rect = item.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    let toIndex = index;

    if (!before && fromIndex < index) toIndex = index;
    else if (before && fromIndex < index) toIndex = index - 1;
    else if (!before && fromIndex > index) toIndex = index + 1;
    else toIndex = index;

    if (toIndex < 0) toIndex = 0;
    if (toIndex >= project.chapters.length) toIndex = project.chapters.length - 1;

    moveChapter(fromIndex, toIndex);
  });
}

function setupTouchDrag(item, index) {
  let startY = 0;
  let startX = 0;

  item.addEventListener("touchstart", (event) => {
    if (event.target.closest("button")) return;

    const touch = event.touches[0];
    startY = touch.clientY;
    startX = touch.clientX;

    touchDragIndex = index;
    touchDragElement = item;
    touchDragStarted = false;

    if (!touchPlaceholder) touchPlaceholder = createTouchPlaceholder();
  }, { passive: true });

  item.addEventListener("touchmove", (event) => {
    if (touchDragIndex === null || !touchDragElement) return;

    const touch = event.touches[0];
    const diffY = Math.abs(touch.clientY - startY);
    const diffX = Math.abs(touch.clientX - startX);

    if (!touchDragStarted) {
      if (diffY < 8 && diffX < 8) return;
      touchDragStarted = true;
      touchDragElement.style.opacity = "0.55";
      touchDragElement.style.transform = "scale(0.985)";
    }

    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const overItem = target?.closest?.(".chapter-item[data-index]");

    if (overItem && overItem !== touchDragElement && overItem.parentNode === chaptersList) {
      const rect = overItem.getBoundingClientRect();
      const before = touch.clientY < rect.top + rect.height / 2;
      if (before) chaptersList.insertBefore(touchPlaceholder, overItem);
      else chaptersList.insertBefore(touchPlaceholder, overItem.nextSibling);
    }

    event.preventDefault();
  }, { passive: false });

  item.addEventListener("touchend", () => {
    if (touchDragIndex === null || !touchDragElement) {
      cleanupTouchDrag();
      return;
    }

    if (!touchDragStarted) {
      cleanupTouchDrag();
      return;
    }

    let fromIndex = touchDragIndex;
    let toIndex = fromIndex;

    if (touchPlaceholder && touchPlaceholder.parentNode === chaptersList) {
      const children = Array.from(chaptersList.children).filter((child) =>
        child.classList.contains("chapter-item")
      );
      toIndex = children.indexOf(touchPlaceholder);
      if (toIndex === -1) toIndex = fromIndex;
      if (toIndex > fromIndex) toIndex -= 1;
    }

    cleanupTouchDrag();
    moveChapter(fromIndex, toIndex);
  });

  item.addEventListener("touchcancel", cleanupTouchDrag);
}

function cleanupTouchDrag() {
  if (touchDragElement) {
    touchDragElement.style.opacity = "";
    touchDragElement.style.transform = "";
  }

  if (touchPlaceholder?.parentNode) {
    touchPlaceholder.parentNode.removeChild(touchPlaceholder);
  }

  touchDragIndex = null;
  touchDragElement = null;
  touchPlaceholder = null;
  touchDragStarted = false;
}

function moveChapter(fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= project.chapters.length ||
    toIndex >= project.chapters.length
  ) return;

  persistCurrentChapter();

  const [moved] = project.chapters.splice(fromIndex, 1);
  project.chapters.splice(toIndex, 0, moved);

  if (currentChapterIndex === fromIndex) {
    currentChapterIndex = toIndex;
  } else if (fromIndex < currentChapterIndex && toIndex >= currentChapterIndex) {
    currentChapterIndex -= 1;
  } else if (fromIndex > currentChapterIndex && toIndex <= currentChapterIndex) {
    currentChapterIndex += 1;
  }

  renderChapters();
  renderCurrentChapter();
  updateSummary();
  logMessage("Zmieniono kolejność rozdziałów.");
}

function addChapter() {
  createAndSwitchToNewChapter();
}

function duplicateCurrentChapter() {
  const source = getCurrentChapter();
  if (!source) {
    alert("Wybierz rozdział do skopiowania.");
    return;
  }

  persistCurrentChapter();

  const copy = {
    id: `chapter-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: `${source.title} (kopia)`,
    file: (source.file || "chapter.xhtml").replace(/(\.xhtml|\.html)?$/i, "-copy.xhtml"),
    html: source.html
  };

  project.chapters.splice(currentChapterIndex + 1, 0, copy);
  currentChapterIndex += 1;

  renderChapters();
  renderCurrentChapter();
  updateSummary();
  logMessage(`Zduplikowano rozdział: ${source.title}.`);
}

function deleteCurrentChapter() {
  const chapter = getCurrentChapter();
  if (!chapter) {
    alert("Nie ma rozdziału do usunięcia.");
    return;
  }

  const title = chapter.title || "ten rozdział";
  const confirmed = confirm(`Czy na pewno chcesz usunąć rozdział "${title}"?`);
  if (!confirmed) return;

  project.chapters.splice(currentChapterIndex, 1);

  if (project.chapters.length === 0) currentChapterIndex = -1;
  else if (currentChapterIndex >= project.chapters.length) currentChapterIndex = project.chapters.length - 1;

  renderChapters();
  renderCurrentChapter();
  updateSummary();
  logMessage(`Usunięto rozdział: ${title}.`);
}

async function handleCoverUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const dataUrl = await fileToDataUrl(file);
    project.cover = { name: file.name, dataUrl };
    project.meta.coverFileName = file.name;
    renderCover();
    fillMetaInputs();
    logMessage(`Wczytano okładkę: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać okładki.");
    logMessage(`Błąd wczytywania okładki: ${error?.message || error}`);
  }
}

function execEditorCommand(command, value = null) {
  bookEditor.focus();
  restoreSelection();
  document.execCommand(command, false, value);
  rememberSelection();
  syncCurrentChapterFromEditor();
}

function setBlock(tagName) {
  execEditorCommand("formatBlock", tagName);
}

function normalizeEditorMarkup() {
  if (!bookEditor.innerHTML.trim()) bookEditor.innerHTML = "<p></p>";
}

function syncCurrentChapterFromEditor() {
  if (suppressEditorSync) return;
  const chapter = getCurrentChapter();
  if (!chapter) return;

  normalizeEditorMarkup();
  chapter.html = getEditorHtml();
  chapterHtmlInput.value = chapter.html;
}

function createResizableImageWrapper(src, alt = "") {
  const wrapper = document.createElement("span");
  wrapper.className = "image-resizable align-center";
  wrapper.contentEditable = "false";
  wrapper.style.width = "320px";

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.style.width = "100%";
  img.style.height = "auto";
  wrapper.appendChild(img);

  ["nw", "ne", "sw", "se"].forEach((pos) => {
    const handle = document.createElement("span");
    handle.className = `resize-handle ${pos}`;
    handle.dataset.handle = pos;
    wrapper.appendChild(handle);
  });

  return wrapper;
}

function makeImageResizable(img) {
  if (!img || !img.parentNode) return;
  if (img.closest(".image-resizable")) return;

  const wrapper = createResizableImageWrapper(img.src, img.alt || "");
  const width = img.style.width || img.getAttribute("width");
  if (width) wrapper.style.width = /^\d+$/.test(width) ? `${width}px` : width;

  img.parentNode.insertBefore(wrapper, img);
  img.remove();
}

function upgradeImagesToResizable() {
  const images = Array.from(bookEditor.querySelectorAll("img"));
  images.forEach((img) => makeImageResizable(img));
}

function clearSelectedResizable() {
  bookEditor.querySelectorAll(".image-resizable.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  activeResizable = null;
}

function selectResizable(wrapper) {
  clearSelectedResizable();
  if (!wrapper) return;
  wrapper.classList.add("selected");
  activeResizable = wrapper;

  const width = parseInt(wrapper.getBoundingClientRect().width, 10);
  if (width && imageWidthInput) {
    imageWidthInput.value = String(width);
  }
}

function pointerPosition(event) {
  if (event.touches && event.touches[0]) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

function startResize(wrapper, handle, event) {
  event.preventDefault();
  event.stopPropagation();

  selectResizable(wrapper);

  const rect = wrapper.getBoundingClientRect();
  const pointer = pointerPosition(event);

  resizeState = {
    wrapper,
    handle,
    startX: pointer.x,
    startY: pointer.y,
    startWidth: rect.width
  };

  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", stopResize);
  document.addEventListener("touchmove", onResizeMove, { passive: false });
  document.addEventListener("touchend", stopResize);
}

function onResizeMove(event) {
  if (!resizeState) return;
  event.preventDefault();

  const pointer = pointerPosition(event);
  const deltaX = pointer.x - resizeState.startX;
  const deltaY = pointer.y - resizeState.startY;

  let nextWidth = resizeState.startWidth;

  if (resizeState.handle === "se" || resizeState.handle === "ne") {
    nextWidth = resizeState.startWidth + deltaX;
  } else {
    nextWidth = resizeState.startWidth - deltaX;
  }

  if (Math.abs(deltaY) > Math.abs(deltaX) * 0.6) {
    const signed = (resizeState.handle === "sw" || resizeState.handle === "se") ? deltaY : -deltaY;
    nextWidth = resizeState.startWidth + signed;
  }

  nextWidth = Math.max(80, nextWidth);
  const editorRect = bookEditor.getBoundingClientRect();
  nextWidth = Math.min(nextWidth, editorRect.width - 30);

  resizeState.wrapper.style.width = `${Math.round(nextWidth)}px`;
  if (imageWidthInput) imageWidthInput.value = String(Math.round(nextWidth));
  syncCurrentChapterFromEditor();
}

function stopResize() {
  if (!resizeState) return;
  resizeState = null;

  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", onResizeMove);
  document.removeEventListener("touchend", stopResize);

  syncCurrentChapterFromEditor();
}

function bindResizableImageEvents() {
  bookEditor.addEventListener("click", (event) => {
    const wrapper = event.target.closest(".image-resizable");
    if (wrapper) {
      selectResizable(wrapper);
      return;
    }
    clearSelectedResizable();
  });

  bookEditor.addEventListener("mousedown", (event) => {
    const handle = event.target.closest(".resize-handle");
    if (!handle) return;
    const wrapper = handle.closest(".image-resizable");
    if (!wrapper) return;
    startResize(wrapper, handle.dataset.handle, event);
  });

  bookEditor.addEventListener("touchstart", (event) => {
    const handle = event.target.closest(".resize-handle");
    if (!handle) return;
    const wrapper = handle.closest(".image-resizable");
    if (!wrapper) return;
    startResize(wrapper, handle.dataset.handle, event);
  }, { passive: false });

  document.addEventListener("click", (event) => {
    if (!bookEditor.contains(event.target)) {
      clearSelectedResizable();
    }
  });
}

function setActiveImageAlignment(mode) {
  if (!activeResizable) {
    alert("Najpierw zaznacz obraz.");
    return;
  }

  activeResizable.classList.remove("align-left", "align-center", "align-right");

  if (mode === "left") activeResizable.classList.add("align-left");
  if (mode === "center") activeResizable.classList.add("align-center");
  if (mode === "right") activeResizable.classList.add("align-right");

  syncCurrentChapterFromEditor();
}

function applyImageWidth() {
  if (!activeResizable) {
    alert("Najpierw zaznacz obraz.");
    return;
  }

  const value = parseInt(imageWidthInput.value, 10);
  if (!value || value < 40) {
    alert("Podaj poprawną szerokość obrazu w px.");
    return;
  }

  const editorRect = bookEditor.getBoundingClientRect();
  const finalWidth = Math.min(value, Math.max(80, Math.floor(editorRect.width - 30)));
  activeResizable.style.width = `${finalWidth}px`;
  imageWidthInput.value = String(finalWidth);
  syncCurrentChapterFromEditor();
}

function deleteSelectedImage() {
  if (!activeResizable) {
    alert("Najpierw zaznacz obraz.");
    return;
  }
  activeResizable.remove();
  clearSelectedResizable();
  syncCurrentChapterFromEditor();
  logMessage("Usunięto zaznaczony obraz z treści.");
}

function closeAllDropdowns() {
  dropdownToggles.forEach((toggle) => {
    const targetId = toggle.dataset.dropdown;
    const menu = document.getElementById(targetId);
    if (menu) menu.hidden = true;
  });
}

function toggleDropdown(targetId) {
  dropdownToggles.forEach((toggle) => {
    const id = toggle.dataset.dropdown;
    const menu = document.getElementById(id);
    if (!menu) return;
    if (id === targetId) menu.hidden = !menu.hidden;
    else menu.hidden = true;
  });
}

function bindEditorDropdowns() {
  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleDropdown(toggle.dataset.dropdown);
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".toolbar-dropdown")) {
      closeAllDropdowns();
    }
  });
}

function bindEditorToolbar() {
  editorToolbar.addEventListener("click", (event) => {
    const button = event.target.closest(".editor-tool-btn");
    if (!button) return;

    const cmd = button.dataset.cmd;
    const block = button.dataset.block;
    const value = button.dataset.value || null;

    if (button.id === "insertImageBtn") {
      closeAllDropdowns();
      inlineImageInput.click();
      return;
    }

    if (button.id === "deleteImageBtn") {
      deleteSelectedImage();
      closeAllDropdowns();
      return;
    }

    if (button.id === "alignImageLeftBtn") {
      setActiveImageAlignment("left");
      closeAllDropdowns();
      return;
    }

    if (button.id === "alignImageCenterBtn") {
      setActiveImageAlignment("center");
      closeAllDropdowns();
      return;
    }

    if (button.id === "alignImageRightBtn") {
      setActiveImageAlignment("right");
      closeAllDropdowns();
      return;
    }

    if (button.id === "applyImageWidthBtn") {
      applyImageWidth();
      closeAllDropdowns();
      return;
    }

    if (block) {
      setBlock(block);
      closeAllDropdowns();
      return;
    }

    if (cmd) {
      execEditorCommand(cmd, value);
      closeAllDropdowns();
    }
  });
}

async function handleInlineImageInsert(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const dataUrl = await fileToDataUrl(file);

    bookEditor.focus();
    restoreSelection();

    const imgHtml = `<div><img src="${dataUrl}" alt="${escapeHtml(file.name)}" style="width:320px;max-width:100%;height:auto;display:block;margin:1em auto;" /></div><p><br></p>`;
    document.execCommand("insertHTML", false, imgHtml);

    upgradeImagesToResizable();

    const latestWrapper = Array.from(bookEditor.querySelectorAll(".image-resizable")).pop();
    if (latestWrapper) {
      selectResizable(latestWrapper);
      latestWrapper.scrollIntoView({ block: "nearest" });
    }

    rememberSelection();
    syncCurrentChapterFromEditor();
    logMessage(`Wstawiono obraz do treści: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wstawić obrazu.");
    logMessage(`Błąd wstawiania obrazu do treści: ${error?.message || error}`);
  } finally {
    event.target.value = "";
  }
}

function goBackFromContent() {
  if (lastStartAction === "repo") showScreen("repo");
  else showScreen("start");
}

function finishAndReturnToStart() {
  showScreen("start");
  logMessage("Powrócono do ekranu startowego.");
}

function goToChaptersScreen() {
  persistCurrentChapter();
  renderChapters();
  renderCurrentChapter();
  showScreen("chapters");
}

function bindEvents() {
  topbarMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleTopbarMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      topbarDropdown &&
      !topbarDropdown.hidden &&
      !topbarDropdown.contains(event.target) &&
      !topbarMenuBtn?.contains(event.target)
    ) {
      closeTopbarMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeTopbarMenu();
      closeAllDropdowns();
    }
  });

  goToStartBtn?.addEventListener("click", () => showScreen("start"));
  saveDraftBtn?.addEventListener("click", saveDraft);
  loadDraftBtn?.addEventListener("click", loadDraft);

  startNewBookBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    createNewProject();
  });

  openRepoBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    lastStartAction = "repo";
    showScreen("repo");
    loadRepoBooks();
  });

  backFromRepoBtn?.addEventListener("click", () => showScreen("start"));

  importBookInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "epub") await importEpubFile(file);
    else if (ext === "docx") await importDocxFile(file);
    else if (ext === "odt") await importOdtFile(file);
    else if (ext === "html" || ext === "htm") await importHtmlFile(file);
    else if (ext === "txt") await importTxtFile(file);
    else {
      alert("Nieobsługiwany format pliku.");
      logMessage(`Nieobsługiwany format importu: ${file.name}.`);
    }

    event.target.value = "";
  });

  refreshRepoBtn?.addEventListener("click", loadRepoBooks);
  repoSearchInput?.addEventListener("input", filterRepoBooks);

  chapterSelect?.addEventListener("change", () => {
    const value = chapterSelect.value;

    if (value === ADD_CHAPTER_SELECT_VALUE) {
      createAndSwitchToNewChapter();
      return;
    }

    const newIndex = Number(value);
    if (!Number.isNaN(newIndex)) switchToChapter(newIndex);
  });

  chapterTitleInput?.addEventListener("input", () => {
    const chapter = getCurrentChapter();
    if (!chapter) return;
    chapter.title = chapterTitleInput.value.trim() || `Rozdział ${currentChapterIndex + 1}`;
    renderChapterSelect();
    renderChapters();
  });

  chapterHtmlInput?.addEventListener("input", () => {
    const chapter = getCurrentChapter();
    if (!chapter) return;
    chapter.html = chapterHtmlInput.value || "<p></p>";
    setEditorHtml(chapter.html);
  });

  prevChapterBtn?.addEventListener("click", goToPrevChapter);
  nextChapterBtn?.addEventListener("click", goToNextChapter);

  bookEditor?.addEventListener("input", syncCurrentChapterFromEditor);
  bookEditor?.addEventListener("blur", () => {
    rememberSelection();
    syncCurrentChapterFromEditor();
  });
  bookEditor?.addEventListener("keyup", rememberSelection);
  bookEditor?.addEventListener("mouseup", rememberSelection);
  bookEditor?.addEventListener("touchend", rememberSelection);

  insertImageBtn?.addEventListener("click", () => inlineImageInput.click());
  inlineImageInput?.addEventListener("change", handleInlineImageInsert);
  deleteImageBtn?.addEventListener("click", deleteSelectedImage);
  alignImageLeftBtn?.addEventListener("click", () => setActiveImageAlignment("left"));
  alignImageCenterBtn?.addEventListener("click", () => setActiveImageAlignment("center"));
  alignImageRightBtn?.addEventListener("click", () => setActiveImageAlignment("right"));
  applyImageWidthBtn?.addEventListener("click", applyImageWidth);

  addChapterBtn?.addEventListener("click", addChapter);
  duplicateChapterBtn?.addEventListener("click", duplicateCurrentChapter);
  deleteChapterBtn?.addEventListener("click", deleteCurrentChapter);

  coverInput?.addEventListener("change", handleCoverUpload);

  [
    bookTitleInput,
    bookAuthorInput,
    bookCategoryInput,
    bookLanguageInput,
    bookFileNameInput,
    bookDescriptionInput,
    coverFileNameInput
  ].forEach((input) => {
    input?.addEventListener("input", saveMetaFromInputs);
  });

  bookTitleInput?.addEventListener("input", autoFillFileName);

  backFromContentBtn?.addEventListener("click", goBackFromContent);
  goToChaptersBtn?.addEventListener("click", goToChaptersScreen);
  goToChaptersBtnTop?.addEventListener("click", goToChaptersScreen);

  backToContentBtn?.addEventListener("click", () => {
    persistCurrentChapter();
    showScreen("content", { focusEditor: true });
  });

  goToCoverBtn?.addEventListener("click", () => {
    persistCurrentChapter();
    saveMetaFromInputs();
    showScreen("cover");
  });
  goToCoverBtnTop?.addEventListener("click", () => {
    persistCurrentChapter();
    saveMetaFromInputs();
    showScreen("cover");
  });

  backToChaptersBtn?.addEventListener("click", () => showScreen("chapters"));

  goToMetadataBtn?.addEventListener("click", () => {
    saveMetaFromInputs();
    showScreen("metadata");
  });
  goToMetadataBtnTop?.addEventListener("click", () => {
    saveMetaFromInputs();
    showScreen("metadata");
  });

  backToCoverBtn?.addEventListener("click", () => showScreen("cover"));

  goToExportBtn?.addEventListener("click", () => {
    saveMetaFromInputs();
    updateSummary();
    showScreen("export");
  });
  goToExportBtnTop?.addEventListener("click", () => {
    saveMetaFromInputs();
    updateSummary();
    showScreen("export");
  });

  backToMetadataBtn?.addEventListener("click", () => showScreen("metadata"));
  finishToStartBtn?.addEventListener("click", finishAndReturnToStart);

  exportJsonBtn?.addEventListener("click", exportJson);
  exportLibraryEntryBtn?.addEventListener("click", exportLibraryEntry);
  exportHtmlBtn?.addEventListener("click", exportHtml);
  exportTxtBtn?.addEventListener("click", exportTxt);
  exportEpubBtn?.addEventListener("click", exportEpub);

  window.addEventListener("resize", updateTopbarOffset);
  window.addEventListener("orientationchange", updateTopbarOffset);
  window.addEventListener("pageshow", updateTopbarOffset);
}

function initAdmin() {
  logMessage("Start panelu administratora.");
  bindEditorDropdowns();
  bindEditorToolbar();
  bindResizableImageEvents();
  bindEvents();
  updateTopbarOffset();
  bookEditor.dataset.placeholder = "Zacznij pisać treść rozdziału...";
  showScreen("start", { scrollToTop: false });
  loadRepoBooks();
  updateSummary();
  setTimeout(updateTopbarOffset, 50);
  setTimeout(updateTopbarOffset, 250);
  logMessage("Panel administratora został uruchomiony.");
}

initAdmin();
