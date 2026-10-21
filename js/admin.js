const ADMIN_DRAFT_KEY = "epub_pro_admin_draft_v632";
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
const exportOdtBtn = document.getElementById("exportOdtBtn");
const exportDocxBtn = document.getElementById("exportDocxBtn");
const exportHtmlBtn = document.getElementById("exportHtmlBtn");
const copyLibraryEntryBtn = document.getElementById("copyLibraryEntryBtn");

const currentProjectTitle = document.querySelectorAll("#currentProjectTitle");
const currentProjectAuthor = document.querySelectorAll("#currentProjectAuthor");
const currentProjectSource = document.querySelectorAll("#currentProjectSource");
const currentProjectChapterCount = document.querySelectorAll("#currentProjectChapterCount");
const adminLogOutput = document.getElementById("adminLogOutput");

const backFromContentBtn = document.getElementById("backFromContentBtn");
const goToChaptersBtn = document.getElementById("goToChaptersBtn");
const backToContentBtn = document.getElementById("backToContentBtn");
const goToCoverBtn = document.getElementById("goToCoverBtn");
const backToChaptersBtn = document.getElementById("backToChaptersBtn");
const goToMetadataBtn = document.getElementById("goToMetadataBtn");
const backToCoverBtn = document.getElementById("backToCoverBtn");
const goToExportBtn = document.getElementById("goToExportBtn");
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

let activeImageBlock = null;
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
  upgradeImagesToEditableBlocks();
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
    if (chapterHtmlInput) chapterHtmlInput.value = "";
    setEditorHtml("<p>Zacznij pisać treść rozdziału tutaj...</p>");
    updateChapterSwitcherButtons();
    return;
  }

  chapterTitleInput.value = chapter.title || "";
  if (chapterHtmlInput) chapterHtmlInput.value = chapter.html || "";
  setEditorHtml(chapter.html || "<p></p>");
  renderChapterSelect();
  updateChapterSwitcherButtons();
}

function persistCurrentChapter() {
  const chapter = getCurrentChapter();
  if (!chapter) return;

  chapter.title = chapterTitleInput.value.trim() || `Rozdział ${currentChapterIndex + 1}`;
  chapter.html = getEditorHtml() || "<p></p>";
  if (chapterHtmlInput) chapterHtmlInput.value = chapter.html;

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

async function copyLibraryEntry() {
  const entry = buildLibraryEntryObject();
  const json = JSON.stringify(entry, null, 2);
  const copied = await copyTextToClipboard(json);

  if (copied) {
    alert("Wpis do library.json został skopiowany.");
    logMessage("Skopiowano wpis do library.json.");
  } else {
    alert("Nie udało się skopiować wpisu do schowka.");
    logMessage("Nie udało się skopiować wpisu do library.json.");
  }
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64: match[2]
  };
}

function extensionFromMimeType(mimeType) {
  switch (mimeType) {
    case "image/png": return "png";
    case "image/gif": return "gif";
    case "image/webp": return "webp";
    case "image/svg+xml": return "svg";
    case "image/jpeg":
    case "image/jpg":
    default: return "jpg";
  }
}

function simpleHash(text) {
  let hash = 0;
  const str = String(text || "");
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildSafeImageFileName(prefix, index, mimeType, dataUrl) {
  const ext = extensionFromMimeType(mimeType);
  const hash = simpleHash(dataUrl).slice(0, 8);
  return `${slugify(prefix) || "img"}-${index}-${hash}.${ext}`;
}

function buildCssFile() {
  return `body {
  font-family: serif;
  line-height: 1.6;
  margin: 0;
  padding: 1em;
}
h1, h2, h3, h4 {
  line-height: 1.25;
}
img {
  max-width: 100%;
  height: auto;
}
blockquote {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid #cccccc;
}`;
}

function collectChapterImagesAndRewrite(html, chapterIndex, imageRegistry) {
  const source = document.createElement("div");
  source.innerHTML = html || "<p></p>";

  let imageCounter = 0;

  function registerImage(dataUrl, mimeType, fileBasePrefix) {
    if (imageRegistry.has(dataUrl)) {
      return imageRegistry.get(dataUrl);
    }

    const nextIndex = imageRegistry.size + 1;
    const fileName = buildSafeImageFileName(fileBasePrefix, nextIndex, mimeType, dataUrl);
    const record = { fileName, mimeType, dataUrl };
    imageRegistry.set(dataUrl, record);
    return record;
  }

  source.querySelectorAll(".editor-image-block").forEach((block) => {
    const img = block.querySelector("img");
    if (!img) {
      block.remove();
      return;
    }

    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "";
    const parsed = parseDataUrl(src);

    const cleanImg = document.createElement("img");
    cleanImg.setAttribute("alt", alt);

    const width = block.style.width || img.style.width || "";
    const alignLeft = block.classList.contains("align-left");
    const alignRight = block.classList.contains("align-right");
    const alignCenter = block.classList.contains("align-center") || (!alignLeft && !alignRight);

    let style = "";
    if (width) style += `width:${width};max-width:100%;height:auto;display:block;`;
    else style += "max-width:100%;height:auto;display:block;";

    if (alignLeft) style += "margin:1em auto 1em 0;";
    else if (alignRight) style += "margin:1em 0 1em auto;";
    else if (alignCenter) style += "margin:1em auto;";

    cleanImg.setAttribute("style", style);

    if (parsed) {
      imageCounter += 1;
      const record = registerImage(
        src,
        parsed.mimeType,
        `chapter-${chapterIndex + 1}-image`
      );
      cleanImg.setAttribute("src", `../images/${record.fileName}`);
    } else {
      cleanImg.setAttribute("src", src);
    }

    const wrapperBlock = document.createElement("div");
    wrapperBlock.appendChild(cleanImg);
    block.replaceWith(wrapperBlock);
  });

  source.querySelectorAll("img").forEach((img) => {
    if (img.closest(".editor-image-block")) return;

    const src = img.getAttribute("src") || "";
    const parsed = parseDataUrl(src);
    if (!parsed) return;

    imageCounter += 1;
    const record = registerImage(
      src,
      parsed.mimeType,
      `chapter-${chapterIndex + 1}-image`
    );

    img.setAttribute("src", `../images/${record.fileName}`);
    const currentStyle = img.getAttribute("style") || "";
    let style = currentStyle;
    if (!/max-width\s*:/i.test(style)) style += "max-width:100%;";
    if (!/height\s*:/i.test(style)) style += "height:auto;";
    if (!/display\s*:/i.test(style)) style += "display:block;";
    img.setAttribute("style", style);

    if (!img.parentElement || img.parentElement.tagName.toLowerCase() === "p") {
      const block = document.createElement("div");
      img.parentNode.insertBefore(block, img);
      block.appendChild(img);
    }
  });

  return source.innerHTML || "<p></p>";
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

  if (tag === "img") {
    const wrapper = doc.createElement("div");
    const cleanImg = doc.createElement("img");
    cleanImg.setAttribute("src", node.getAttribute("src") || "");
    cleanImg.setAttribute("alt", node.getAttribute("alt") || "");

    let style = node.getAttribute("style") || "";
    if (!/display\s*:/i.test(style)) style += "display:block;";
    if (!/height\s*:/i.test(style)) style += "height:auto;";
    if (!/max-width\s*:/i.test(style)) style += "max-width:100%;";
    cleanImg.setAttribute("style", style);

    wrapper.appendChild(cleanImg);
    return wrapper;
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

/* ---------------- ODT ---------------- */

function buildOdtManifest(imageEntries, coverEntry) {
  const imageLines = imageEntries.map((img) =>
    `<manifest:file-entry manifest:media-type="${escapeXml(img.mimeType)}" manifest:full-path="Pictures/${escapeXml(img.fileName)}"/>`
  ).join("\n  ");

  const coverLine = coverEntry
    ? `\n  <manifest:file-entry manifest:media-type="${escapeXml(coverEntry.mimeType)}" manifest:full-path="Pictures/${escapeXml(coverEntry.fileName)}"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:media-type="application/vnd.oasis.opendocument.text" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="styles.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="meta.xml"/>
  <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="settings.xml"/>${coverLine}
  ${imageLines}
</manifest:manifest>`;
}

function buildOdtMetaXml() {
  const title = escapeXml(project.meta.title || "Bez tytułu");
  const author = escapeXml(project.meta.author || "");
  const description = escapeXml(project.meta.description || "");
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.2">
  <office:meta>
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:description>${description}</dc:description>
    <meta:creation-date>${now}</meta:creation-date>
  </office:meta>
</office:document-meta>`;
}

function buildOdtStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:styles>
    <style:default-style style:family="paragraph">
      <style:paragraph-properties fo:margin-bottom="0.2cm"/>
      <style:text-properties fo:font-size="12pt"/>
    </style:default-style>

    <style:style style:name="P1" style:family="paragraph"/>
    <style:style style:name="Heading1" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="18pt" fo:font-weight="bold"/>
      <style:paragraph-properties fo:margin-top="0.5cm" fo:margin-bottom="0.2cm"/>
    </style:style>
    <style:style style:name="Heading2" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold"/>
      <style:paragraph-properties fo:margin-top="0.4cm" fo:margin-bottom="0.2cm"/>
    </style:style>
    <style:style style:name="Heading3" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="14pt" fo:font-weight="bold"/>
      <style:paragraph-properties fo:margin-top="0.3cm" fo:margin-bottom="0.2cm"/>
    </style:style>
    <style:style style:name="Heading4" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="13pt" fo:font-weight="bold"/>
      <style:paragraph-properties fo:margin-top="0.3cm" fo:margin-bottom="0.2cm"/>
    </style:style>

    <style:style style:name="Quote" style:family="paragraph">
      <style:paragraph-properties fo:margin-left="1cm" fo:margin-right="0.5cm"/>
      <style:text-properties fo:font-style="italic"/>
    </style:style>

    <style:style style:name="Bold" style:family="text">
      <style:text-properties fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold"/>
    </style:style>
    <style:style style:name="Italic" style:family="text">
      <style:text-properties fo:font-style="italic" style:font-style-asian="italic" style:font-style-complex="italic"/>
    </style:style>
    <style:style style:name="Underline" style:family="text">
      <style:text-properties style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"/>
    </style:style>
  </office:styles>
</office:document-styles>`;
}

function buildOdtSettingsXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  office:version="1.2">
  <office:settings/>
</office:document-settings>`;
}

function convertInlineNodeToOdt(node, imageRegistry, imageCounterRef) {
  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;

  if (node.nodeType === TEXT_NODE) {
    return escapeXml(node.textContent || "");
  }

  if (node.nodeType !== ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();

  if (tag === "strong" || tag === "b") {
    return `<text:span text:style-name="Bold">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:span>`;
  }

  if (tag === "em" || tag === "i") {
    return `<text:span text:style-name="Italic">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:span>`;
  }

  if (tag === "u") {
    return `<text:span text:style-name="Underline">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:span>`;
  }

  if (tag === "br") {
    return `<text:line-break/>`;
  }

  if (tag === "img") {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    const parsed = parseDataUrl(src);
    if (!parsed) return "";

    let record = imageRegistry.get(src);
    if (!record) {
      imageCounterRef.count += 1;
      record = {
        fileName: buildSafeImageFileName("odt-image", imageCounterRef.count, parsed.mimeType, src),
        mimeType: parsed.mimeType,
        dataUrl: src
      };
      imageRegistry.set(src, record);
    }

    return `<draw:frame draw:name="${escapeXml(alt || record.fileName)}" text:anchor-type="as-char" svg:width="12cm" svg:height="8cm">
      <draw:image xlink:href="Pictures/${escapeXml(record.fileName)}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
    </draw:frame>`;
  }

  return Array.from(node.childNodes).map((child) =>
    convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
  ).join("");
}

function convertBlockNodeToOdt(node, imageRegistry, imageCounterRef) {
  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;

  if (node.nodeType === TEXT_NODE) {
    const text = (node.textContent || "").trim();
    if (!text) return "";
    return `<text:p text:style-name="P1">${escapeXml(text)}</text:p>`;
  }

  if (node.nodeType !== ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();

  if (tag === "p") {
    return `<text:p text:style-name="P1">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:p>`;
  }

  if (tag === "h1") {
    return `<text:h text:style-name="Heading1" text:outline-level="1">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:h>`;
  }

  if (tag === "h2") {
    return `<text:h text:style-name="Heading2" text:outline-level="2">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:h>`;
  }

  if (tag === "h3") {
    return `<text:h text:style-name="Heading3" text:outline-level="3">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:h>`;
  }

  if (tag === "h4") {
    return `<text:h text:style-name="Heading4" text:outline-level="4">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:h>`;
  }

  if (tag === "blockquote") {
    return `<text:p text:style-name="Quote">${Array.from(node.childNodes).map((child) =>
      convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("")}</text:p>`;
  }

  if (tag === "ul") {
    const items = Array.from(node.children).filter((child) => child.tagName?.toLowerCase() === "li");
    return `<text:list>${items.map((li) => `
      <text:list-item>
        <text:p text:style-name="P1">${Array.from(li.childNodes).map((child) =>
          convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
        ).join("")}</text:p>
      </text:list-item>`).join("")}
    </text:list>`;
  }

  if (tag === "ol") {
    const items = Array.from(node.children).filter((child) => child.tagName?.toLowerCase() === "li");
    return `<text:list text:style-name="L1">${items.map((li) => `
      <text:list-item>
        <text:p text:style-name="P1">${Array.from(li.childNodes).map((child) =>
          convertInlineNodeToOdt(child, imageRegistry, imageCounterRef)
        ).join("")}</text:p>
      </text:list-item>`).join("")}
    </text:list>`;
  }

  if (tag === "div" || tag === "section" || tag === "article") {
    return Array.from(node.childNodes).map((child) =>
      convertBlockNodeToOdt(child, imageRegistry, imageCounterRef)
    ).join("");
  }

  if (tag === "img") {
    return `<text:p text:style-name="P1">${convertInlineNodeToOdt(node, imageRegistry, imageCounterRef)}</text:p>`;
  }

  return Array.from(node.childNodes).map((child) =>
    convertBlockNodeToOdt(child, imageRegistry, imageCounterRef)
  ).join("");
}

function buildOdtContentXml(imageRegistry, includeCoverRecord = null) {
  const imageCounterRef = { count: imageRegistry.size };

  const chapterXml = project.chapters.map((chapter, index) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = chapter.html || "<p></p>";

    const content = Array.from(wrapper.childNodes).map((node) =>
      convertBlockNodeToOdt(node, imageRegistry, imageCounterRef)
    ).join("");

    return `
      <text:h text:style-name="Heading1" text:outline-level="1">${escapeXml(chapter.title || `Rozdział ${index + 1}`)}</text:h>
      ${content || `<text:p text:style-name="P1"></text:p>`}
    `;
  }).join("\n");

  const coverXml = includeCoverRecord
    ? `<text:h text:style-name="Heading1" text:outline-level="1">Okładka</text:h>
       <text:p text:style-name="P1">
         <draw:frame draw:name="cover" text:anchor-type="as-char" svg:width="12cm" svg:height="16cm">
           <draw:image xlink:href="Pictures/${escapeXml(includeCoverRecord.fileName)}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
         </draw:frame>
       </text:p>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles/>
  <office:body>
    <office:text>
      <text:h text:style-name="Heading1" text:outline-level="1">${escapeXml(project.meta.title || "Bez tytułu")}</text:h>
      ${project.meta.author ? `<text:p text:style-name="P1">${escapeXml(project.meta.author)}</text:p>` : ""}
      ${project.meta.description ? `<text:p text:style-name="P1">${escapeXml(project.meta.description)}</text:p>` : ""}
      ${coverXml}
      ${chapterXml}
    </office:text>
  </office:body>
</office:document-content>`;
}

async function exportOdt() {
  persistCurrentChapter();
  saveMetaFromInputs();

  if (!project.meta.title.trim()) {
    alert("Uzupełnij tytuł książki przed eksportem ODT.");
    showScreen("metadata");
    return;
  }

  try {
    const zip = new JSZip();
    zip.file("mimetype", "application/vnd.oasis.opendocument.text", { compression: "STORE" });

    const metaInf = zip.folder("META-INF");
    const imageRegistry = new Map();
    let coverRecord = null;

    if (project.cover?.dataUrl) {
      const parsed = parseDataUrl(project.cover.dataUrl);
      if (parsed) {
        coverRecord = {
          fileName: project.meta.coverFileName || `cover.${extensionFromMimeType(parsed.mimeType)}`,
          mimeType: parsed.mimeType,
          dataUrl: project.cover.dataUrl
        };
      }
    }

    const wrapperCollect = document.createElement("div");
    project.chapters.forEach((chapter, idx) => {
      wrapperCollect.innerHTML = chapter.html || "<p></p>";
      wrapperCollect.querySelectorAll("img").forEach((img, i) => {
        const src = img.getAttribute("src") || "";
        const parsed = parseDataUrl(src);
        if (!parsed) return;
        if (!imageRegistry.has(src)) {
          const nextIndex = imageRegistry.size + 1;
          imageRegistry.set(src, {
            fileName: buildSafeImageFileName(`odt-chapter-${idx + 1}-image`, nextIndex, parsed.mimeType, src),
            mimeType: parsed.mimeType,
            dataUrl: src
          });
        }
      });
    });

    zip.file("content.xml", buildOdtContentXml(imageRegistry, coverRecord));
    zip.file("styles.xml", buildOdtStylesXml());
    zip.file("meta.xml", buildOdtMetaXml());
    zip.file("settings.xml", buildOdtSettingsXml());

    const pictures = zip.folder("Pictures");
    Array.from(imageRegistry.values()).forEach((img) => {
      pictures.file(img.fileName, dataUrlToUint8Array(img.dataUrl));
    });

    if (coverRecord) {
      pictures.file(coverRecord.fileName, dataUrlToUint8Array(coverRecord.dataUrl));
    }

    metaInf.file("manifest.xml", buildOdtManifest(Array.from(imageRegistry.values()), coverRecord));

    const fileName = normalizeFileName(project.meta.fileName || slugify(project.meta.title), slugify(project.meta.title), "odt");
    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.oasis.opendocument.text"
    });

    downloadBlob(blob, fileName);
    alert("ODT został wyeksportowany.");
    logMessage(`Wyeksportowano ODT: ${fileName}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wyeksportować ODT.");
    logMessage(`Błąd eksportu ODT: ${error?.message || error}`);
  }
}

/* ---------------- DOCX ---------------- */

function xmlEscapeText(text) {
  return escapeXml(text).replace(/\n/g, "</w:t><w:br/><w:t>");
}

function blobToBase64Data(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const parts = String(dataUrl || "").split(",");
  const header = parts[0] || "";
  const body = parts[1] || "";
  const mime = (header.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function convertInlineNodeToDocxRuns(node, mediaRegistry) {
  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;

  if (node.nodeType === TEXT_NODE) {
    const text = node.textContent || "";
    if (!text) return "";
    return `<w:r><w:t xml:space="preserve">${xmlEscapeText(text)}</w:t></w:r>`;
  }

  if (node.nodeType !== ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();

  if (tag === "br") {
    return `<w:r><w:br/></w:r>`;
  }

  if (tag === "strong" || tag === "b") {
    return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${xmlEscapeText(node.textContent || "")}</w:t></w:r>`;
  }

  if (tag === "em" || tag === "i") {
    return `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${xmlEscapeText(node.textContent || "")}</w:t></w:r>`;
  }

  if (tag === "u") {
    return `<w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${xmlEscapeText(node.textContent || "")}</w:t></w:r>`;
  }

  if (tag === "img") {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    const parsed = parseDataUrl(src);
    if (!parsed) return "";

    let record = mediaRegistry.get(src);
    if (!record) {
      const index = mediaRegistry.size + 1;
      const ext = extensionFromMimeType(parsed.mimeType);
      const fileName = `image${index}.${ext}`;
      record = {
        id: `rIdImage${index}`,
        fileName,
        mimeType: parsed.mimeType,
        dataUrl: src
      };
      mediaRegistry.set(src, record);
    }

    return `<w:r>
      <w:drawing>
        <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
                   distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="4572000" cy="3048000"/>
          <wp:docPr id="${mediaRegistry.size + 10}" name="${escapeXml(alt || record.fileName)}"/>
          <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:nvPicPr>
                  <pic:cNvPr id="0" name="${escapeXml(alt || record.fileName)}"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="${record.id}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                  <a:stretch><a:fillRect/></a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm><a:off x="0" y="0"/><a:ext cx="4572000" cy="3048000"/></a:xfrm>
                  <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>`;
  }

  return Array.from(node.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join("");
}

function createDocxParagraph(textRuns, style = null, opts = {}) {
  const { quote = false, list = false, numbered = false } = opts;
  const styleXml = style ? `<w:pStyle w:val="${style}"/>` : "";
  const indentXml = quote ? `<w:ind w:left="720" w:right="240"/>` : "";
  const spacingXml = `<w:spacing w:after="160"/>`;

  let numPr = "";
  if (list) {
    numPr = numbered
      ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>`
      : `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>`;
  }

  return `<w:p><w:pPr>${styleXml}${indentXml}${spacingXml}${numPr}</w:pPr>${textRuns || `<w:r><w:t></w:t></w:r>`}</w:p>`;
}

function convertBlockNodeToDocx(node, mediaRegistry) {
  const TEXT_NODE = 3;
  const ELEMENT_NODE = 1;

  if (node.nodeType === TEXT_NODE) {
    const text = (node.textContent || "").trim();
    if (!text) return "";
    return createDocxParagraph(`<w:r><w:t xml:space="preserve">${xmlEscapeText(text)}</w:t></w:r>`);
  }

  if (node.nodeType !== ELEMENT_NODE) return "";

  const tag = node.tagName.toLowerCase();

  if (tag === "p") {
    return createDocxParagraph(Array.from(node.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""));
  }

  if (tag === "h1") {
    return createDocxParagraph(Array.from(node.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""), "Heading1");
  }

  if (tag === "h2") {
    return createDocxParagraph(Array.from(node.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""), "Heading2");
  }

  if (tag === "h3") {
    return createDocxParagraph(Array.from(node.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""), "Heading3");
  }

  if (tag === "h4") {
    return createDocxParagraph(Array.from(node.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""), "Heading4");
  }

  if (tag === "blockquote") {
    return createDocxParagraph(Array.from(node.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""), null, { quote: true });
  }

  if (tag === "ul") {
    return Array.from(node.children)
      .filter((li) => li.tagName?.toLowerCase() === "li")
      .map((li) => createDocxParagraph(
        Array.from(li.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""),
        null,
        { list: true, numbered: false }
      ))
      .join("");
  }

  if (tag === "ol") {
    return Array.from(node.children)
      .filter((li) => li.tagName?.toLowerCase() === "li")
      .map((li) => createDocxParagraph(
        Array.from(li.childNodes).map((child) => convertInlineNodeToDocxRuns(child, mediaRegistry)).join(""),
        null,
        { list: true, numbered: true }
      ))
      .join("");
  }

  if (tag === "div" || tag === "section" || tag === "article") {
    return Array.from(node.childNodes).map((child) => convertBlockNodeToDocx(child, mediaRegistry)).join("");
  }

  if (tag === "img") {
    return createDocxParagraph(convertInlineNodeToDocxRuns(node, mediaRegistry));
  }

  return Array.from(node.childNodes).map((child) => convertBlockNodeToDocx(child, mediaRegistry)).join("");
}

function buildDocxDocumentXml(mediaRegistry) {
  const bodyParts = [];

  bodyParts.push(createDocxParagraph(`<w:r><w:t xml:space="preserve">${xmlEscapeText(project.meta.title || "Bez tytułu")}</w:t></w:r>`, "Title"));

  if (project.meta.author) {
    bodyParts.push(createDocxParagraph(`<w:r><w:t xml:space="preserve">${xmlEscapeText(project.meta.author)}</w:t></w:r>`));
  }

  if (project.meta.description) {
    bodyParts.push(createDocxParagraph(`<w:r><w:t xml:space="preserve">${xmlEscapeText(project.meta.description)}</w:t></w:r>`));
  }

  project.chapters.forEach((chapter, index) => {
    bodyParts.push(createDocxParagraph(`<w:r><w:t xml:space="preserve">${xmlEscapeText(chapter.title || `Rozdział ${index + 1}`)}</w:t></w:r>`, "Heading1"));

    const wrapper = document.createElement("div");
    wrapper.innerHTML = chapter.html || "<p></p>";
    Array.from(wrapper.childNodes).forEach((node) => {
      const xml = convertBlockNodeToDocx(node, mediaRegistry);
      if (xml) bodyParts.push(xml);
    });
  });

  bodyParts.push(`
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  `);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    ${bodyParts.join("\n")}
  </w:body>
</w:document>`;
}

function buildDocxContentTypes(mediaEntries) {
  const imageOverrides = mediaEntries.map((entry) => {
    const ext = entry.fileName.split(".").pop()?.toLowerCase();
    if (ext === "png") return `<Default Extension="png" ContentType="image/png"/>`;
    if (ext === "gif") return `<Default Extension="gif" ContentType="image/gif"/>`;
    if (ext === "webp") return `<Default Extension="webp" ContentType="image/webp"/>`;
    if (ext === "svg") return `<Default Extension="svg" ContentType="image/svg+xml"/>`;
    return `<Default Extension="jpg" ContentType="image/jpeg"/>`;
  });

  const uniqueImageDefaults = Array.from(new Set(imageOverrides)).join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${uniqueImageDefaults}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
}

function buildDocxRootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function buildDocxDocumentRels(mediaEntries) {
  const imageRels = mediaEntries.map((entry) =>
    `<Relationship Id="${entry.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${escapeXml(entry.fileName)}"/>`
  ).join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
  ${imageRels}
</Relationships>`;
}

function buildDocxStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="160"/></w:pPr>
    <w:rPr><w:sz w:val="24"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:after="240"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/></w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading4">
    <w:name w:val="heading 4"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="140" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;
}

function buildDocxNumberingXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>

  <w:abstractNum w:abstractNumId="2">
    <w:lvl w:ilvl="0">
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>`;
}

function buildDocxCoreXml() {
  const title = escapeXml(project.meta.title || "Bez tytułu");
  const author = escapeXml(project.meta.author || "");
  const description = escapeXml(project.meta.description || "");
  const now = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties
  xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:dcterms="http://purl.org/dc/terms/"
  xmlns:dcmitype="http://purl.org/dc/dcmitype/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${title}</dc:title>
  <dc:creator>${author}</dc:creator>
  <dc:description>${description}</dc:description>
  <cp:lastModifiedBy>${author}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function buildDocxAppXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties
  xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
  xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>EPUB PRO</Application>
</Properties>`;
}

async function exportDocx() {
  persistCurrentChapter();
  saveMetaFromInputs();

  if (!project.meta.title.trim()) {
    alert("Uzupełnij tytuł książki przed eksportem DOCX.");
    showScreen("metadata");
    return;
  }

  try {
    const mediaRegistry = new Map();

    if (project.cover?.dataUrl) {
      const parsed = parseDataUrl(project.cover.dataUrl);
      if (parsed && !mediaRegistry.has(project.cover.dataUrl)) {
        mediaRegistry.set(project.cover.dataUrl, {
          id: `rIdImage${mediaRegistry.size + 1}`,
          fileName: `image${mediaRegistry.size + 1}.${extensionFromMimeType(parsed.mimeType)}`,
          mimeType: parsed.mimeType,
          dataUrl: project.cover.dataUrl
        });
      }
    }

    project.chapters.forEach((chapter) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = chapter.html || "<p></p>";
      wrapper.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        const parsed = parseDataUrl(src);
        if (!parsed || mediaRegistry.has(src)) return;
        const index = mediaRegistry.size + 1;
        mediaRegistry.set(src, {
          id: `rIdImage${index}`,
          fileName: `image${index}.${extensionFromMimeType(parsed.mimeType)}`,
          mimeType: parsed.mimeType,
          dataUrl: src
        });
      });
    });

    const mediaEntries = Array.from(mediaRegistry.values());
    const zip = new JSZip();

    zip.file("[Content_Types].xml", buildDocxContentTypes(mediaEntries));
    zip.folder("_rels").file(".rels", buildDocxRootRels());
    zip.folder("docProps").file("core.xml", buildDocxCoreXml());
    zip.folder("docProps").file("app.xml", buildDocxAppXml());

    const wordFolder = zip.folder("word");
    wordFolder.file("document.xml", buildDocxDocumentXml(mediaRegistry));
    wordFolder.file("styles.xml", buildDocxStylesXml());
    wordFolder.file("numbering.xml", buildDocxNumberingXml());

    const wordRels = wordFolder.folder("_rels");
    wordRels.file("document.xml.rels", buildDocxDocumentRels(mediaEntries));

    const mediaFolder = wordFolder.folder("media");
    mediaEntries.forEach((entry) => {
      mediaFolder.file(entry.fileName, dataUrlToUint8Array(entry.dataUrl));
    });

    const fileName = normalizeFileName(project.meta.fileName || slugify(project.meta.title), slugify(project.meta.title), "docx");
    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });

    downloadBlob(blob, fileName);
    alert("DOCX został wyeksportowany.");
    logMessage(`Wyeksportowano DOCX: ${fileName}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wyeksportować DOCX.");
    logMessage(`Błąd eksportu DOCX: ${error?.message || error}`);
  }
}

/* ---------------- editor image blocks ---------------- */

function createImageBlock(src, alt = "") {
  const block = document.createElement("div");
  block.className = "editor-image-block align-center";
  block.contentEditable = "false";
  block.style.width = "320px";

  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  block.appendChild(img);

  ["nw", "ne", "sw", "se"].forEach((pos) => {
    const handle = document.createElement("span");
    handle.className = `resize-handle ${pos}`;
    handle.dataset.handle = pos;
    block.appendChild(handle);
  });

  return block;
}

function convertStandaloneImagesToBlocks(root) {
  const images = Array.from(root.querySelectorAll("img"));
  images.forEach((img) => {
    if (img.closest(".editor-image-block")) return;

    const block = createImageBlock(img.getAttribute("src") || "", img.getAttribute("alt") || "");
    const styleWidthMatch = (img.getAttribute("style") || "").match(/width\s*:\s*([^;]+)/i);
    if (styleWidthMatch && styleWidthMatch[1]) {
      block.style.width = styleWidthMatch[1].trim();
    }

    img.parentNode.insertBefore(block, img);
    img.remove();
  });
}

function upgradeImagesToEditableBlocks() {
  convertStandaloneImagesToBlocks(bookEditor);
}

function clearSelectedImageBlock() {
  bookEditor.querySelectorAll(".editor-image-block.selected").forEach((el) => {
    el.classList.remove("selected");
  });
  activeImageBlock = null;
}

function selectImageBlock(block) {
  clearSelectedImageBlock();
  if (!block) return;
  block.classList.add("selected");
  activeImageBlock = block;

  const width = parseInt(block.getBoundingClientRect().width, 10);
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

function startResize(block, handle, event) {
  event.preventDefault();
  event.stopPropagation();

  selectImageBlock(block);

  const rect = block.getBoundingClientRect();
  const pointer = pointerPosition(event);

  resizeState = {
    block,
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

  resizeState.block.style.width = `${Math.round(nextWidth)}px`;
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

function bindImageBlockEvents() {
  bookEditor.addEventListener("click", (event) => {
    const block = event.target.closest(".editor-image-block");
    if (block) {
      selectImageBlock(block);
      return;
    }
    clearSelectedImageBlock();
  });

  bookEditor.addEventListener("mousedown", (event) => {
    const handle = event.target.closest(".resize-handle");
    if (!handle) return;
    const block = handle.closest(".editor-image-block");
    if (!block) return;
    startResize(block, handle.dataset.handle, event);
  });

  bookEditor.addEventListener("touchstart", (event) => {
    const handle = event.target.closest(".resize-handle");
    if (!handle) return;
    const block = handle.closest(".editor-image-block");
    if (!block) return;
    startResize(block, handle.dataset.handle, event);
  }, { passive: false });

  document.addEventListener("click", (event) => {
    if (!bookEditor.contains(event.target)) {
      clearSelectedImageBlock();
    }
  });
}

function setActiveImageAlignment(mode) {
  if (!activeImageBlock) {
    alert("Najpierw zaznacz obraz.");
    return;
  }

  activeImageBlock.classList.remove("align-left", "align-center", "align-right");

  if (mode === "left") activeImageBlock.classList.add("align-left");
  if (mode === "center") activeImageBlock.classList.add("align-center");
  if (mode === "right") activeImageBlock.classList.add("align-right");

  syncCurrentChapterFromEditor();
}

function applyImageWidth() {
  if (!activeImageBlock) {
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
  activeImageBlock.style.width = `${finalWidth}px`;
  imageWidthInput.value = String(finalWidth);
  syncCurrentChapterFromEditor();
}

function deleteSelectedImage() {
  if (!activeImageBlock) {
    alert("Najpierw zaznacz obraz.");
    return;
  }
  activeImageBlock.remove();
  clearSelectedImageBlock();
  syncCurrentChapterFromEditor();
  logMessage("Usunięto zaznaczony obraz z treści.");
}

/* ---------------- toolbar ---------------- */

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

async function handleInlineImageInsert(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const dataUrl = await fileToDataUrl(file);
    const imageBlock = createImageBlock(dataUrl, file.name);

    bookEditor.focus();
    restoreSelection();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.collapse(true);

      const blockWrap = document.createElement("div");
      blockWrap.appendChild(imageBlock);

      const spacer = document.createElement("p");
      spacer.innerHTML = "<br>";

      range.insertNode(spacer);
      range.insertNode(blockWrap);

      const newRange = document.createRange();
      newRange.setStartAfter(spacer);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
      rememberSelection();
    } else {
      const blockWrap = document.createElement("div");
      blockWrap.appendChild(imageBlock);
      bookEditor.appendChild(blockWrap);

      const spacer = document.createElement("p");
      spacer.innerHTML = "<br>";
      bookEditor.appendChild(spacer);
      rememberSelection();
    }

    selectImageBlock(imageBlock);
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

/* ---------------- navigation ---------------- */

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

/* ---------------- bindings ---------------- */

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

  openRepoBtn?.addEventListener("click", async (event) => {
    event.preventDefault();
    lastStartAction = "repo";
    showScreen("repo");
    await loadRepoBooks();
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

  if (chapterHtmlInput) {
    chapterHtmlInput.addEventListener("input", () => {
      const chapter = getCurrentChapter();
      if (!chapter) return;
      chapter.html = chapterHtmlInput.value || "<p></p>";
      setEditorHtml(chapter.html);
    });
  }

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

  inlineImageInput?.addEventListener("change", handleInlineImageInsert);

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

  backToContentBtn?.addEventListener("click", () => {
    persistCurrentChapter();
    showScreen("content", { focusEditor: true });
  });

  goToCoverBtn?.addEventListener("click", () => {
    persistCurrentChapter();
    saveMetaFromInputs();
    showScreen("cover");
  });

  backToChaptersBtn?.addEventListener("click", () => showScreen("chapters"));

  goToMetadataBtn?.addEventListener("click", () => {
    saveMetaFromInputs();
    showScreen("metadata");
  });

  backToCoverBtn?.addEventListener("click", () => showScreen("cover"));

  goToExportBtn?.addEventListener("click", () => {
    saveMetaFromInputs();
    updateSummary();
    showScreen("export");
  });

  backToMetadataBtn?.addEventListener("click", () => showScreen("metadata"));
  finishToStartBtn?.addEventListener("click", finishAndReturnToStart);

  exportEpubBtn?.addEventListener("click", exportEpub);
  exportOdtBtn?.addEventListener("click", exportOdt);
  exportDocxBtn?.addEventListener("click", exportDocx);
  exportHtmlBtn?.addEventListener("click", exportHtml);
  copyLibraryEntryBtn?.addEventListener("click", copyLibraryEntry);

  window.addEventListener("resize", updateTopbarOffset);
  window.addEventListener("orientationchange", updateTopbarOffset);
  window.addEventListener("pageshow", updateTopbarOffset);
}

function initAdmin() {
  logMessage("Start panelu administratora.");
  bindEditorDropdowns();
  bindEditorToolbar();
  bindImageBlockEvents();
  bindEvents();
  updateTopbarOffset();
  bookEditor.dataset.placeholder = "Zacznij pisać treść rozdziału...";
  showScreen("start", { scrollToTop: false });
  updateSummary();
  setTimeout(updateTopbarOffset, 50);
  setTimeout(updateTopbarOffset, 250);
  logMessage("Panel administratora został uruchomiony.");
}

initAdmin();
