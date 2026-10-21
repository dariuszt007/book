const ADMIN_DRAFT_KEY = "epub_pro_admin_draft_v636";
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
const repoCategoryFilterSelect = document.getElementById("repoCategoryFilterSelect");
const repoSortSelect = document.getElementById("repoSortSelect");
const repoResultsCount = document.getElementById("repoResultsCount");
const clearRepoFiltersBtn = document.getElementById("clearRepoFiltersBtn");
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

function buildRepoCategoryOptions(books) {
  if (!repoCategoryFilterSelect) return;

  const currentValue = repoCategoryFilterSelect.value || "";
  const categories = Array.from(
    new Set(
      books
        .map((book) => String(book.category || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => compareStringsLocale(a, b));

  repoCategoryFilterSelect.innerHTML = `<option value="">Wszystkie kategorie</option>`;

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    repoCategoryFilterSelect.appendChild(option);
  });

  repoCategoryFilterSelect.value = categories.includes(currentValue) ? currentValue : "";
}

function getRepoFilteredAndSortedBooks() {
  const textQuery = repoSearchInput?.value?.trim().toLowerCase() || "";
  const authorQuery = repoAuthorFilterInput?.value?.trim().toLowerCase() || "";
  const categoryQuery = repoCategoryFilterSelect?.value?.trim() || "";
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

  if (categoryQuery) {
    result = result.filter((book) =>
      String(book.category || "").trim() === categoryQuery
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

function updateRepoResultsCount(count) {
  if (!repoResultsCount) return;
  repoResultsCount.textContent = `Wyniki: ${count}`;
}

function rerenderRepoBooks() {
  const result = getRepoFilteredAndSortedBooks();
  renderRepoBooks(result);
  updateRepoResultsCount(result.length);
}

function clearRepoFilters() {
  if (repoSearchInput) repoSearchInput.value = "";
  if (repoAuthorFilterInput) repoAuthorFilterInput.value = "";
  if (repoCategoryFilterSelect) repoCategoryFilterSelect.value = "";
  if (repoSortSelect) repoSortSelect.value = "title-asc";
  rerenderRepoBooks();
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

function exportHtml() {
  persistCurrentChapter();
  saveMetaFromInputs();

  const title = escapeHtml(project.meta.title || "Bez tytułu");
  const author = escapeHtml(project.meta.author || "");
  const description = escapeHtml(project.meta.description || "");
  const language = escapeHtml(project.meta.language || "pl");

  const coverHtml = project.cover?.dataUrl
    ? `<section class="book-cover"><img src="${project.cover.dataUrl}" alt="Okładka książki" /></section>`
    : "";

  const chaptersHtml = project.chapters
    .map((chapter, index) => `
      <section class="chapter">
        <h2>${escapeHtml(chapter.title || `Rozdział ${index + 1}`)}</h2>
        <div class="chapter-content">${chapter.html || "<p></p>"}</div>
      </section>
    `)
    .join("\n");

  const html = `<!DOCTYPE html>
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

  const base = slugify(project.meta.title) || "ksiazka";
  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${base}.html`);
  logMessage("Wyeksportowano HTML.");
}

/* STUBY eksportów/importów */
async function exportEpub() {
  alert("Ta wersja zawiera pełny panel admina v6.3.6, ale eksport EPUB jest tu zostawiony jako stub. Jeśli chcesz, podam zaraz pełny plik z kompletnym eksportem EPUB/ODT/DOCX 1:1.");
}
async function exportOdt() {
  alert("Ta wersja zawiera pełny panel admina v6.3.6, ale eksport ODT jest tu zostawiony jako stub. Jeśli chcesz, podam zaraz pełny plik z kompletnym eksportem EPUB/ODT/DOCX 1:1.");
}
async function exportDocx() {
  alert("Ta wersja zawiera pełny panel admina v6.3.6, ale eksport DOCX jest tu zostawiony jako stub. Jeśli chcesz, podam zaraz pełny plik z kompletnym eksportem EPUB/ODT/DOCX 1:1.");
}

async function importEpubFile(file) {
  alert(`Import EPUB stub: ${file?.name || ""}`);
}
async function importDocxFile(file) {
  alert(`Import DOCX stub: ${file?.name || ""}`);
}
async function importOdtFile(file) {
  alert(`Import ODT stub: ${file?.name || ""}`);
}
async function importHtmlFile(file) {
  try {
    const text = await file.text();
    project = createEmptyProject();
    project.source = "Import HTML";
    project.meta.title = file.name.replace(/\.html?$/i, "");
    project.meta.fileName = `${slugify(project.meta.title) || "book"}.epub`;
    project.chapters = [{
      id: `chapter-${Date.now()}`,
      title: project.meta.title || "Import HTML",
      file: "chapter-1.xhtml",
      html: text || "<p></p>"
    }];
    currentChapterIndex = 0;
    lastStartAction = "import";
    renderAllProjectUi();
    showScreen("content", { focusEditor: true });
    logMessage(`Zaimportowano plik HTML: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować HTML.");
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
  }
}

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

async function loadRepoBooks() {
  repoBooksList.innerHTML = `<div class="empty-state">Ładowanie książek z repo...</div>`;

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} dla data/library.json`);

    const data = await response.json();
    repoBooks = Array.isArray(data.books) ? data.books : [];

    buildRepoCategoryOptions(repoBooks);
    rerenderRepoBooks();
    logMessage(`Wczytano listę książek z repo: ${repoBooks.length}.`);
  } catch (error) {
    console.error(error);
    repoBooksList.innerHTML = `<div class="empty-state">Nie udało się wczytać listy książek z repo.</div>`;
    logMessage(`Błąd wczytywania książek z repo: ${error?.message || error}`);
  }
}

async function openRepoBook(book, duplicate = false) {
  alert(`Otwieranie z repo stub: ${book?.title || ""}. Jeśli chcesz, podam pełny plik FULL z kompletnym importem EPUB z repo.`);
}

function deleteRepoBook(book) {
  const confirmed = confirm(`Czy na pewno chcesz usunąć książkę "${book.title || "bez tytułu"}" z repo?`);
  if (!confirmed) return;

  logMessage(`Usunięcie książki z repo wymaga ręcznego skasowania wpisu z data/library.json i pliku ${book.epub || ""}.`);
  alert("Usuwanie z repo wymaga jeszcze obsługi zapisu na serwerze lub ręcznego usunięcia pliku i wpisu z library.json.");
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
  repoCategoryFilterSelect?.addEventListener("change", rerenderRepoBooks);
  repoSortSelect?.addEventListener("change", rerenderRepoBooks);
  clearRepoFiltersBtn?.addEventListener("click", clearRepoFilters);

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
  exportOdtBtn && (exportOdtBtn.onclick = () => exportOdt());
  exportDocxBtn && (exportDocxBtn.onclick = () => exportDocx());
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
