const ADMIN_DRAFT_KEY = "epub_pro_admin_draft_v635";
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
const repoAuthorFilterInput = document.getElementById("repoAuthorFilterInput");
const repoSortSelect = document.getElementById("repoSortSelect");
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
const imageWidthInput = document.getElementById("imageWidthInput");
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

/* ---------- core ---------- */

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

function compareStringsLocale(a, b) {
  return String(a || "").localeCompare(String(b || ""), "pl", { sensitivity: "base" });
}

/* ---------- repo pipeline ---------- */

function getRepoFilteredAndSortedBooks() {
  const textQuery = repoSearchInput?.value?.trim().toLowerCase() || "";
  const authorQuery = repoAuthorFilterInput?.value?.trim().toLowerCase() || "";
  const sortMode = repoSortSelect?.value || "title-asc";

  let result = [...repoBooks];

  if (textQuery) {
    result = result.filter((book) =>
      [book.title, book.author, book.category, book.description || "", book.epub || ""]
        .join(" ")
        .toLowerCase()
        .includes(textQuery)
    );
  }

  if (authorQuery) {
    result = result.filter((book) =>
      String(book.author || "").toLowerCase().includes(authorQuery)
    );
  }

  result.sort((a, b) => {
    if (sortMode === "title-asc") return compareStringsLocale(a.title, b.title);
    if (sortMode === "title-desc") return compareStringsLocale(b.title, a.title);

    if (sortMode === "author-asc") {
      const byAuthor = compareStringsLocale(a.author, b.author);
      return byAuthor !== 0 ? byAuthor : compareStringsLocale(a.title, b.title);
    }

    if (sortMode === "author-desc") {
      const byAuthor = compareStringsLocale(b.author, a.author);
      return byAuthor !== 0 ? byAuthor : compareStringsLocale(a.title, b.title);
    }

    if (sortMode === "category-asc") {
      const byCategory = compareStringsLocale(a.category, b.category);
      return byCategory !== 0 ? byCategory : compareStringsLocale(a.title, b.title);
    }

    if (sortMode === "category-desc") {
      const byCategory = compareStringsLocale(b.category, a.category);
      return byCategory !== 0 ? byCategory : compareStringsLocale(a.title, b.title);
    }

    return compareStringsLocale(a.title, b.title);
  });

  return result;
}

function rerenderRepoBooks() {
  renderRepoBooks(getRepoFilteredAndSortedBooks());
}

/* ---------- layout ---------- */

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

/* ---------- summary/meta ---------- */

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

/* ---------- chapters ---------- */

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

/* ---------- io ---------- */

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

/* ---------- export helpers ---------- */

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

/* ---------- EPUB ---------- */

function buildContainerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
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

function buildOpf(extraImageItems = []) {
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

  const extraManifest = extraImageItems
    .map((item, index) => `<item id="img-${index + 1}" href="images/${escapeXml(item.fileName)}" media-type="${escapeXml(item.mimeType)}"/>`)
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
    <item id="style" href="styles/book.css" media-type="text/css"/>
    ${coverManifest}
    ${extraManifest}
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
      const title = escapeXml((chapter.title || "").trim() || `Rozdział ${index + 1}`);
      const href = `text/${escapeXml(normalizeChapterFileName(chapter.file, index))}`;
      return `      <li><a href="${href}">${title}</a></li>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escapeXml(project.meta.language || "pl")}">
<head>
  <meta charset="utf-8"/>
  <title>Spis treści</title>
  <link rel="stylesheet" type="text/css" href="styles/book.css"/>
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
      const title = escapeXml((chapter.title || "").trim() || `Rozdział ${index + 1}`);
      const href = `text/${escapeXml(normalizeChapterFileName(chapter.file, index))}`;
      return `    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel><text>${title}</text></navLabel>
      <content src="${href}"/>
    </navPoint>`;
    })
    .join("\n");

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
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
}

function buildChapterXhtml(chapter, index, preparedHtml) {
  const rawTitle = (chapter.title || "").trim();
  const title = escapeXml(rawTitle || `Rozdział ${index + 1}`);
  const lang = escapeXml(project.meta.language || "pl");
  const cleanBody = serializeChapterToXhtmlBody(preparedHtml || chapter.html || "<p></p>");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <link rel="stylesheet" type="text/css" href="../styles/book.css"/>
</head>
<body>
  <section class="chapter">
    <h2>${title}</h2>
    ${cleanBody}
  </section>
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
    const preparedChapters = [];
    const imageRegistry = new Map();

    project.chapters.forEach((chapter, index) => {
      const preparedHtml = collectChapterImagesAndRewrite(chapter.html || "<p></p>", index, imageRegistry);
      preparedChapters.push(preparedHtml);
    });

    const chapterImages = Array.from(imageRegistry.values());

    const zip = new JSZip();
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

    const metaInf = zip.folder("META-INF");
    metaInf.file("container.xml", buildContainerXml());

    const oebps = zip.folder("OEBPS");
    const textFolder = oebps.folder("text");
    const imagesFolder = oebps.folder("images");
    const stylesFolder = oebps.folder("styles");

    oebps.file("content.opf", buildOpf(chapterImages));
    oebps.file("nav.xhtml", buildNavXhtml());
    oebps.file("toc.ncx", buildTocNcx());
    stylesFolder.file("book.css", buildCssFile());

    project.chapters.forEach((chapter, index) => {
      textFolder.file(
        normalizeChapterFileName(chapter.file, index),
        buildChapterXhtml(chapter, index, preparedChapters[index])
      );
    });

    chapterImages.forEach((img) => {
      imagesFolder.file(img.fileName, dataUrlToUint8Array(img.dataUrl));
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
    alert("EPUB został wyeksportowany.");
    logMessage(`Wyeksportowano EPUB: ${fileName}. Obrazy treści: ${chapterImages.length}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wyeksportować EPUB.");
    logMessage(`Błąd eksportu EPUB: ${error?.message || error}`);
  }
}

/* ---------- ODT ---------- */

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
  </office:styles>`;
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

    const widthStyle = node.getAttribute("style") || "";
    const widthMatch = widthStyle.match(/width\s*:\s*(\d+)px/i);
    const widthPx = widthMatch ? parseInt(widthMatch[1], 10) : 480;
    const widthCm = Math.max(4, Math.min(15, widthPx / 37.8));
    const heightCm = Math.max(3, Math.min(20, widthCm * 0.66));

    return `<draw:frame draw:name="${escapeXml(alt || record.fileName)}" text:anchor-type="as-char" svg:width="${widthCm.toFixed(2)}cm" svg:height="${heightCm.toFixed(2)}cm">
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
         <draw:frame draw:name="cover" text:anchor-type="as-char" svg:width="12.00cm" svg:height="16.00cm">
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
      wrapperCollect.querySelectorAll("img").forEach((img) => {
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

/* ---------- DOCX ---------- */

function xmlEscapeText(text) {
  return escapeXml(text).replace(/\n/g, "</w:t><w:br/><w:t>");
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

function getDocxImageSizeFromStyle(styleText = "") {
  const widthMatch = String(styleText).match(/width\s*:\s*(\d+)px/i);
  const widthPx = widthMatch ? parseInt(widthMatch[1], 10) : 480;
  const ratio = 0.66;
  const widthEmu = Math.max(914400, Math.min(5486400, Math.round(widthPx * 9525)));
  const heightEmu = Math.round(widthEmu * ratio);
  return { widthEmu, heightEmu };
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

    const { widthEmu, heightEmu } = getDocxImageSizeFromStyle(node.getAttribute("style") || "");

    return `<w:r>
      <w:drawing>
        <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
                   distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
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
                  <a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm>
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
  xmlns:wne="http://schemas.microsoft.com/office/2006/wordml"
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

/* ---------- import helpers ---------- */

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

/* ---------- repo ---------- */

async function loadRepoBooks() {
  repoBooksList.innerHTML = `<div class="empty-state">Ładowanie książek z repo...</div>`;

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} dla data/library.json`);

    const data = await response.json();
    repoBooks = Array.isArray(data.books) ? data.books : [];
    rerenderRepoBooks();
    logMessage(`Wczytano listę książek z repo: ${repoBooks.length}.`);
  } catch (error) {
    console.error(error);
    repoBooksList.innerHTML = `<div class="empty-state">Nie udało się wczytać listy książek z repo.</div>`;
    logMessage(`Błąd wczytywania książek z repo: ${error?.message || error}`);
  }
}

function renderRepoBooks(list) {
  if (!list.length) {
    repoBooksList.innerHTML = `<div class="empty-state">Brak książek spełniających kryteria.</div>`;
    return;
  }

  repoBooksList.innerHTML = "";

  list.forEach((book) => {
    const card = document.createElement("article");
    card.className = "repo-book-card";
    card.innerHTML = `
      <img
        class="repo-book-card__cover"
        src="${book.cover || "assets/no-cover.svg"}"
        alt="${escapeHtml(book.title || "Okładka")}"
      />
      <div class="repo-book-card__meta">
        <h3>${escapeHtml(book.title || "Bez tytułu")}</h3>
        <p>${escapeHtml(book.author || "Nieznany autor")}</p>
        <p>${escapeHtml(book.category || "Brak kategorii")}</p>
        <p>${escapeHtml(book.epub || "")}</p>
      </div>
      <div class="repo-book-card__actions">
        <button class="admin-btn admin-btn--primary" type="button" data-role="edit">Edytuj</button>
        <button class="admin-btn admin-btn--secondary" type="button" data-role="duplicate">Duplikuj</button>
        <button class="admin-btn admin-btn--danger" type="button" data-role="delete">Usuń</button>
      </div>
    `;

    card.querySelector('[data-role="edit"]').addEventListener("click", () => openRepoBook(book, false));
    card.querySelector('[data-role="duplicate"]').addEventListener("click", () => openRepoBook(book, true));
    card.querySelector('[data-role="delete"]').addEventListener("click", () => deleteRepoBook(book));

    repoBooksList.appendChild(card);
  });
}

async function openRepoBook(book, duplicate = false) {
  const epubPath = String(book.epub || "").trim();
  if (!epubPath) {
    alert("Brak ścieżki EPUB w repo.");
    logMessage(`Repo error: brak pola epub dla "${book.title || "bez tytułu"}".`);
    return;
  }

  try {
    logMessage(`Otwieranie książki z repo: ${epubPath}`);

    const response = await fetch(`${epubPath}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} dla ${epubPath}`);

    const buffer = await response.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) throw new Error(`Pusty plik EPUB: ${epubPath}`);

    const blob = new Blob([buffer], { type: "application/epub+zip" });
    const file = new File([blob], epubPath.split("/").pop() || "book.epub", {
      type: "application/epub+zip"
    });

    let result;
    try {
      result = await importEpubViaZip(file);
      logMessage(`Repo import ZIP OK: ${epubPath}`);
    } catch (zipError) {
      logMessage(`Repo ZIP fail: ${zipError?.message || zipError}`);
      result = await importEpubViaEpubJs(file);
      logMessage(`Repo epub.js fallback OK: ${epubPath}`);
    }

    project = createEmptyProject();
    project.source = duplicate ? "Duplikat z repo" : "Repo";
    project.meta.title = duplicate
      ? `${result.metadata?.title || book.title || "Bez tytułu"} (kopia)`
      : (result.metadata?.title || book.title || "");
    project.meta.author = result.metadata?.author || book.author || "";
    project.meta.category = book.category || "";
    project.meta.language = result.metadata?.language || "pl";
    project.meta.description = result.metadata?.description || book.description || "";
    project.meta.fileName = duplicate
      ? `${slugify(result.metadata?.title || book.title || "book")}.epub`
      : (epubPath.split("/").pop() || `${slugify(book.title || "book")}.epub`);
    project.cover = {
      name: book.cover ? book.cover.split("/").pop() : "",
      dataUrl: book.cover || ""
    };
    project.meta.coverFileName = project.cover.name || "";
    project.chapters = result.chapters?.length ? result.chapters : [createEmptyChapter(0)];

    currentChapterIndex = 0;
    lastStartAction = "repo";

    renderAllProjectUi();
    showScreen("content", { focusEditor: true });

    logMessage(
      duplicate
        ? `Utworzono kopię książki z repo: ${project.meta.title}.`
        : `Otworzono książkę z repo do edycji: ${project.meta.title}.`
    );
  } catch (error) {
    console.error(error);
    alert("Nie udało się otworzyć książki z repo.");
    logMessage(`Błąd otwierania książki z repo: ${epubPath} | ${error?.message || error}`);
  }
}

function deleteRepoBook(book) {
  const confirmed = confirm(`Czy na pewno chcesz usunąć książkę "${book.title || "bez tytułu"}" z repo?`);
  if (!confirmed) return;

  logMessage(`Usunięcie książki z repo wymaga ręcznego skasowania wpisu z data/library.json i pliku ${book.epub || ""}.`);
  alert("Usuwanie z repo wymaga jeszcze obsługi zapisu na serwerze lub ręcznego usunięcia pliku i wpisu z library.json.");
}

/* ---------- image blocks ---------- */

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

/* ---------- editor ---------- */

function normalizeEditorMarkup() {
  if (!bookEditor.innerHTML.trim()) bookEditor.innerHTML = "<p></p>";
}

function syncCurrentChapterFromEditor() {
  if (suppressEditorSync) return;
  const chapter = getCurrentChapter();
  if (!chapter) return;

  normalizeEditorMarkup();
  chapter.html = getEditorHtml();
  if (chapterHtmlInput) chapterHtmlInput.value = chapter.html;
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

/* ---------- drag ---------- */

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

/* ---------- misc ---------- */

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

/* ---------- bindings ---------- */

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
  repoSearchInput?.addEventListener("input", rerenderRepoBooks);
  repoAuthorFilterInput?.addEventListener("input", rerenderRepoBooks);
  repoSortSelect?.addEventListener("change", rerenderRepoBooks);

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

  if (exportEpubBtn) exportEpubBtn.addEventListener("click", exportEpub);
  if (exportOdtBtn) exportOdtBtn.onclick = () => exportOdt();
  if (exportDocxBtn) exportDocxBtn.onclick = () => exportDocx();
  if (exportHtmlBtn) exportHtmlBtn.addEventListener("click", exportHtml);
  if (copyLibraryEntryBtn) copyLibraryEntryBtn.addEventListener("click", copyLibraryEntry);

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
