const ADMIN_DRAFT_KEY = "epub_admin_draft_v2";

const stepButtons = document.querySelectorAll(".admin-step-btn");
const tabPanels = document.querySelectorAll(".admin-tab-panel");

const startNewBookBtn = document.getElementById("startNewBookBtn");
const startOpenRepoBtn = document.getElementById("startOpenRepoBtn");
const importEpubInput = document.getElementById("importEpubInput");

const refreshRepoBooksBtn = document.getElementById("refreshRepoBooksBtn");
const repoSearchInput = document.getElementById("repoSearchInput");
const repoBooksList = document.getElementById("repoBooksList");

const saveDraftBtn = document.getElementById("saveDraftBtn");
const loadDraftBtn = document.getElementById("loadDraftBtn");
const clearDraftBtn = document.getElementById("clearDraftBtn");
const saveDraftPrimaryBtn = document.getElementById("saveDraftPrimaryBtn");

const exportEpubBtn = document.getElementById("exportEpubBtn");
const exportProjectJsonBtn = document.getElementById("exportProjectJsonBtn");
const exportLogOutput = document.getElementById("exportLogOutput");

const bookTitleInput = document.getElementById("bookTitleInput");
const bookAuthorInput = document.getElementById("bookAuthorInput");
const bookCategoryInput = document.getElementById("bookCategoryInput");
const bookLanguageInput = document.getElementById("bookLanguageInput");
const bookIdInput = document.getElementById("bookIdInput");
const bookFileNameInput = document.getElementById("bookFileNameInput");
const bookDescriptionInput = document.getElementById("bookDescriptionInput");

const currentProjectTitle = document.getElementById("currentProjectTitle");
const currentProjectAuthor = document.getElementById("currentProjectAuthor");
const currentProjectSource = document.getElementById("currentProjectSource");
const currentProjectChapters = document.getElementById("currentProjectChapters");

const addChapterBtn = document.getElementById("addChapterBtn");
const duplicateChapterBtn = document.getElementById("duplicateChapterBtn");
const deleteChapterBtn = document.getElementById("deleteChapterBtn");
const chaptersList = document.getElementById("chaptersList");
const chapterTitleInput = document.getElementById("chapterTitleInput");
const chapterFileInput = document.getElementById("chapterFileInput");
const chapterEditor = document.getElementById("chapterEditor");
const chapterHtmlOutput = document.getElementById("chapterHtmlOutput");

const coverUploadInput = document.getElementById("coverUploadInput");
const coverPreview = document.getElementById("coverPreview");
const illustrationsUploadInput = document.getElementById("illustrationsUploadInput");
const illustrationsList = document.getElementById("illustrationsList");

const editorToolbarButtons = document.querySelectorAll(".editor-toolbar button");

let repoBooks = [];
let currentProject = createEmptyProject();
let currentChapterIndex = -1;

function createEmptyProject() {
  return {
    meta: {
      title: "",
      author: "",
      category: "",
      language: "pl",
      id: "",
      fileName: "",
      description: ""
    },
    source: "Nowy projekt",
    cover: "",
    coverName: "",
    illustrations: [],
    chapters: []
  };
}

function createChapter(index = 0) {
  return {
    id: `chapter-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: `Rozdział ${index + 1}`,
    file: `chapter-${index + 1}.xhtml`,
    html: "<p>Zacznij pisać treść rozdziału tutaj...</p>"
  };
}

function logAdmin(message) {
  const time = new Date().toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const line = `[${time}] ${message}`;
  exportLogOutput.value = exportLogOutput.value
    ? `${line}\n${exportLogOutput.value}`
    : line;
}

function switchTab(tabId) {
  stepButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

function syncProjectSummary() {
  currentProjectTitle.textContent = currentProject.meta.title || "Brak otwartego projektu";
  currentProjectAuthor.textContent = currentProject.meta.author || "—";
  currentProjectSource.textContent = currentProject.source || "—";
  currentProjectChapters.textContent = String(currentProject.chapters.length || 0);
}

function slugify(text) {
  return (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function syncMetaInputsFromProject() {
  bookTitleInput.value = currentProject.meta.title || "";
  bookAuthorInput.value = currentProject.meta.author || "";
  bookCategoryInput.value = currentProject.meta.category || "";
  bookLanguageInput.value = currentProject.meta.language || "pl";
  bookIdInput.value = currentProject.meta.id || "";
  bookFileNameInput.value = currentProject.meta.fileName || "";
  bookDescriptionInput.value = currentProject.meta.description || "";
}

function syncMetaFromInputs() {
  currentProject.meta.title = bookTitleInput.value.trim();
  currentProject.meta.author = bookAuthorInput.value.trim();
  currentProject.meta.category = bookCategoryInput.value.trim();
  currentProject.meta.language = bookLanguageInput.value.trim() || "pl";
  currentProject.meta.id = bookIdInput.value.trim();
  currentProject.meta.fileName = bookFileNameInput.value.trim();
  currentProject.meta.description = bookDescriptionInput.value.trim();

  syncProjectSummary();
}

function autoFillSlugFields() {
  const title = bookTitleInput.value.trim();
  const slug = slugify(title);

  if (!bookIdInput.value.trim() && slug) {
    bookIdInput.value = slug;
  }

  if (!bookFileNameInput.value.trim() && slug) {
    bookFileNameInput.value = `${slug}.epub`;
  }

  syncMetaFromInputs();
}

function selectChapter(index) {
  if (!currentProject.chapters.length) {
    currentChapterIndex = -1;
    chapterTitleInput.value = "";
    chapterFileInput.value = "";
    chapterEditor.innerHTML = "<p>Zacznij pisać treść rozdziału tutaj...</p>";
    chapterHtmlOutput.value = "";
    renderChaptersList();
    syncProjectSummary();
    return;
  }

  if (index < 0) index = 0;
  if (index >= currentProject.chapters.length) index = currentProject.chapters.length - 1;

  currentChapterIndex = index;
  const chapter = currentProject.chapters[index];

  chapterTitleInput.value = chapter.title || "";
  chapterFileInput.value = chapter.file || "";
  chapterEditor.innerHTML = chapter.html || "<p></p>";
  chapterHtmlOutput.value = chapter.html || "";

  renderChaptersList();
  syncProjectSummary();
}

function saveCurrentChapterEdits() {
  if (currentChapterIndex < 0 || !currentProject.chapters[currentChapterIndex]) return;

  const chapter = currentProject.chapters[currentChapterIndex];
  chapter.title = chapterTitleInput.value.trim() || `Rozdział ${currentChapterIndex + 1}`;
  chapter.file = chapterFileInput.value.trim() || `chapter-${currentChapterIndex + 1}.xhtml`;
  chapter.html = chapterEditor.innerHTML.trim() || "<p></p>";
  chapterHtmlOutput.value = chapter.html;

  renderChaptersList();
  syncProjectSummary();
}

function renderChaptersList() {
  if (!currentProject.chapters.length) {
    chaptersList.innerHTML = `<div class="admin-empty-box">Nie ma jeszcze rozdziałów.</div>`;
    return;
  }

  chaptersList.innerHTML = "";

  currentProject.chapters.forEach((chapter, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `chapter-item ${index === currentChapterIndex ? "active" : ""}`;
    item.innerHTML = `
      <strong>${escapeHtml(chapter.title || `Rozdział ${index + 1}`)}</strong>
      <span>${escapeHtml(chapter.file || `chapter-${index + 1}.xhtml`)}</span>
    `;
    item.addEventListener("click", () => {
      saveCurrentChapterEdits();
      selectChapter(index);
    });
    chaptersList.appendChild(item);
  });
}

function renderIllustrations() {
  if (!currentProject.illustrations.length) {
    illustrationsList.innerHTML = `<div class="admin-empty-box">Brak ilustracji.</div>`;
    return;
  }

  illustrationsList.innerHTML = "";

  currentProject.illustrations.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img src="${item.data}" alt="${escapeHtml(item.name)}" />
      <div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>Ilustracja ${index + 1}</p>
        <p>${Math.round((item.data.length || 0) / 1024)} KB danych</p>
      </div>
    `;
    illustrationsList.appendChild(card);
  });
}

function renderCoverPreview() {
  if (currentProject.cover) {
    coverPreview.src = currentProject.cover;
    coverPreview.style.display = "block";
  } else {
    coverPreview.removeAttribute("src");
    coverPreview.style.display = "none";
  }
}

function updateUiFromProject() {
  syncMetaInputsFromProject();
  syncProjectSummary();
  renderCoverPreview();
  renderIllustrations();

  if (currentProject.chapters.length) {
    if (currentChapterIndex < 0 || currentChapterIndex >= currentProject.chapters.length) {
      currentChapterIndex = 0;
    }
    selectChapter(currentChapterIndex);
  } else {
    currentChapterIndex = -1;
    renderChaptersList();
    chapterTitleInput.value = "";
    chapterFileInput.value = "";
    chapterEditor.innerHTML = "<p>Zacznij pisać treść rozdziału tutaj...</p>";
    chapterHtmlOutput.value = "";
  }
}

function startNewProject() {
  currentProject = createEmptyProject();
  currentProject.chapters = [createChapter(0)];
  currentProject.source = "Nowy projekt";
  currentChapterIndex = 0;
  updateUiFromProject();
  switchTab("metaTab");
  logAdmin("Utworzono nowy pusty projekt książki.");
}

async function loadRepoBooks() {
  repoBooksList.innerHTML = `<div class="admin-empty-box">Ładowanie książek z repo...</div>`;

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`);
    const data = await response.json();
    repoBooks = data.books || [];
    renderRepoBooks(repoBooks);
    logAdmin(`Wczytano listę książek z repo: ${repoBooks.length}.`);
  } catch (error) {
    console.error(error);
    repoBooksList.innerHTML = `<div class="admin-empty-box">Nie udało się wczytać listy książek z repo.</div>`;
    logAdmin("Błąd podczas ładowania książek z repo.");
  }
}

function renderRepoBooks(books) {
  if (!books.length) {
    repoBooksList.innerHTML = `<div class="admin-empty-box">Brak książek w repo.</div>`;
    return;
  }

  repoBooksList.innerHTML = "";

  books.forEach(book => {
    const card = document.createElement("article");
    card.className = "admin-repo-card";
    card.innerHTML = `
      <img class="admin-repo-cover" src="${book.cover || "assets/no-cover.svg"}" alt="${escapeHtml(book.title || "Okładka")}" />
      <div class="admin-repo-meta">
        <h3>${escapeHtml(book.title || "Bez tytułu")}</h3>
        <p>${escapeHtml(book.author || "Nieznany autor")}</p>
        <p>${escapeHtml(book.category || "Brak kategorii")}</p>
        <p>${escapeHtml(book.epub || "")}</p>
      </div>
      <div class="admin-repo-actions">
        <button class="btn" data-action="edit">Edytuj</button>
        <button class="btn secondary" data-action="duplicate">Duplikuj</button>
      </div>
    `;

    const editBtn = card.querySelector('[data-action="edit"]');
    const duplicateBtn = card.querySelector('[data-action="duplicate"]');

    editBtn.addEventListener("click", () => openRepoBook(book, false));
    duplicateBtn.addEventListener("click", () => openRepoBook(book, true));

    repoBooksList.appendChild(card);
  });
}

async function openRepoBook(book, duplicate = false) {
  try {
    const response = await fetch(`${book.epub}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const epubBook = ePub(arrayBuffer);

    await epubBook.ready;

    const meta = await epubBook.loaded.metadata;
    const navigation = await epubBook.loaded.navigation;
    const spineItems = epubBook.spine?.spineItems || [];

    const chapters = [];

    for (let i = 0; i < spineItems.length; i += 1) {
      const item = spineItems[i];
      try {
        const sectionText = await item.load(epubBook.load.bind(epubBook));
        chapters.push({
          id: item.idref || `chapter-${i + 1}`,
          title: findTocLabel(navigation?.toc || [], item.href) || `Rozdział ${i + 1}`,
          file: item.href || `chapter-${i + 1}.xhtml`,
          html: sectionText || "<p></p>"
        });
        item.unload();
      } catch (error) {
        console.warn(error);
      }
    }

    currentProject = {
      meta: {
        title: duplicate ? `${meta?.title || book.title || "Bez tytułu"} (kopia)` : (meta?.title || book.title || ""),
        author: meta?.creator || book.author || "",
        category: book.category || "",
        language: meta?.language || "pl",
        id: duplicate
          ? `${slugify(meta?.title || book.title || "book")}-copy`
          : slugify(book.id || meta?.title || book.title || "book"),
        fileName: duplicate
          ? `${slugify(meta?.title || book.title || "book")}-copy.epub`
          : (book.epub?.split("/").pop() || `${slugify(meta?.title || book.title || "book")}.epub`),
        description: book.description || ""
      },
      source: duplicate ? "Duplikat z repo" : "Repo",
      cover: book.cover || "",
      coverName: book.cover ? book.cover.split("/").pop() : "",
      illustrations: [],
      chapters: chapters.length ? chapters : [createChapter(0)]
    };

    currentChapterIndex = 0;
    updateUiFromProject();
    switchTab("chaptersTab");

    logAdmin(
      duplicate
        ? `Utworzono projekt jako kopię książki z repo: ${currentProject.meta.title}.`
        : `Otworzono książkę z repo do edycji: ${currentProject.meta.title}.`
    );
  } catch (error) {
    console.error(error);
    logAdmin(`Błąd podczas otwierania książki z repo: ${book.title || book.epub}.`);
    alert("Nie udało się otworzyć książki z repo.");
  }
}

function findTocLabel(toc, href) {
  for (const item of toc) {
    if (item.href === href) return item.label;
    if (item.subitems?.length) {
      const nested = findTocLabel(item.subitems, href);
      if (nested) return nested;
    }
  }
  return "";
}

function filterRepoBooks() {
  const q = repoSearchInput.value.trim().toLowerCase();

  const filtered = repoBooks.filter(book =>
    [book.title, book.author, book.category, book.description || "", book.epub || ""]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );

  renderRepoBooks(filtered);
}

function addChapter() {
  saveCurrentChapterEdits();

  const chapter = createChapter(currentProject.chapters.length);
  currentProject.chapters.push(chapter);
  currentChapterIndex = currentProject.chapters.length - 1;

  renderChaptersList();
  selectChapter(currentChapterIndex);
  switchTab("chaptersTab");
  logAdmin(`Dodano nowy rozdział: ${chapter.title}.`);
}

function duplicateCurrentChapter() {
  if (currentChapterIndex < 0 || !currentProject.chapters[currentChapterIndex]) {
    alert("Najpierw wybierz rozdział do skopiowania.");
    return;
  }

  saveCurrentChapterEdits();

  const source = currentProject.chapters[currentChapterIndex];
  const clone = {
    ...source,
    id: `chapter-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: `${source.title} (kopia)`,
    file: source.file.replace(/(\.xhtml|\.html)?$/i, "-copy.xhtml")
  };

  currentProject.chapters.splice(currentChapterIndex + 1, 0, clone);
  currentChapterIndex += 1;

  renderChaptersList();
  selectChapter(currentChapterIndex);
  logAdmin(`Zduplikowano rozdział: ${source.title}.`);
}

function deleteCurrentChapter() {
  if (currentChapterIndex < 0 || !currentProject.chapters[currentChapterIndex]) {
    alert("Nie ma rozdziału do usunięcia.");
    return;
  }

  const chapterTitle = currentProject.chapters[currentChapterIndex].title || "ten rozdział";
  const confirmed = confirm(`Usunąć rozdział "${chapterTitle}"?`);

  if (!confirmed) return;

  currentProject.chapters.splice(currentChapterIndex, 1);

  if (currentChapterIndex >= currentProject.chapters.length) {
    currentChapterIndex = currentProject.chapters.length - 1;
  }

  updateUiFromProject();
  logAdmin(`Usunięto rozdział: ${chapterTitle}.`);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleCoverUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const dataUrl = await fileToDataUrl(file);
    currentProject.cover = dataUrl;
    currentProject.coverName = file.name;
    renderCoverPreview();
    logAdmin(`Wczytano okładkę: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać okładki.");
  }
}

async function handleIllustrationsUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  try {
    const results = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        data: await fileToDataUrl(file)
      }))
    );

    currentProject.illustrations.push(...results);
    renderIllustrations();
    logAdmin(`Dodano ilustracje: ${results.map(item => item.name).join(", ")}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać ilustracji.");
  }
}

function saveDraft() {
  saveCurrentChapterEdits();
  syncMetaFromInputs();

  localStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(currentProject));
  logAdmin("Zapisano projekt roboczy lokalnie.");
}

function loadDraft() {
  const raw = localStorage.getItem(ADMIN_DRAFT_KEY);

  if (!raw) {
    alert("Brak zapisanego projektu roboczego.");
    return;
  }

  try {
    currentProject = JSON.parse(raw);
    currentProject.meta = currentProject.meta || createEmptyProject().meta;
    currentProject.chapters = Array.isArray(currentProject.chapters) ? currentProject.chapters : [];
    currentProject.illustrations = Array.isArray(currentProject.illustrations) ? currentProject.illustrations : [];
    currentChapterIndex = currentProject.chapters.length ? 0 : -1;

    updateUiFromProject();
    switchTab("dashboardTab");
    logAdmin("Wczytano projekt roboczy z pamięci lokalnej.");
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać projektu roboczego.");
  }
}

function clearDraft() {
  const confirmed = confirm("Usunąć zapis roboczy z pamięci lokalnej?");
  if (!confirmed) return;

  localStorage.removeItem(ADMIN_DRAFT_KEY);
  logAdmin("Usunięto zapis roboczy.");
}

function exportProjectJson() {
  saveCurrentChapterEdits();
  syncMetaFromInputs();

  const blob = new Blob([JSON.stringify(currentProject, null, 2)], {
    type: "application/json;charset=utf-8"
  });

  const fileName = `${currentProject.meta.id || slugify(currentProject.meta.title || "projekt-epub") || "projekt-epub"}.json`;
  downloadBlob(blob, fileName);
  logAdmin(`Wyeksportowano backup projektu do pliku ${fileName}.`);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildOpf() {
  const title = escapeXml(currentProject.meta.title || "Bez tytułu");
  const author = escapeXml(currentProject.meta.author || "Nieznany autor");
  const language = escapeXml(currentProject.meta.language || "pl");
  const identifier = escapeXml(currentProject.meta.id || slugify(currentProject.meta.title || "book") || "book");
  const description = escapeXml(currentProject.meta.description || "");
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const coverMeta = currentProject.cover ? `<meta name="cover" content="cover-image"/>` : "";

  const chapterManifest = currentProject.chapters
    .map((chapter, index) => {
      const href = escapeXml(normalizeChapterFile(chapter.file, index));
      return `<item id="chap${index + 1}" href="text/${href}" media-type="application/xhtml+xml"/>`;
    })
    .join("\n    ");

  const illustrationManifest = currentProject.illustrations
    .map((item, index) => {
      const ext = getImageExtension(item.name);
      const mediaType = getImageMediaType(ext);
      return `<item id="img${index + 1}" href="images/${escapeXml(item.name)}" media-type="${mediaType}"/>`;
    })
    .join("\n    ");

  const coverItem = currentProject.cover
    ? `<item id="cover-image" href="images/${escapeXml(currentProject.coverName || "cover.jpg")}" media-type="${getImageMediaType(getImageExtension(currentProject.coverName || "cover.jpg"))}"/>`
    : "";

  const spine = currentProject.chapters
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
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${coverItem}
    ${chapterManifest}
    ${illustrationManifest}
  </manifest>

  <spine>
    ${spine}
  </spine>
</package>`;
}

function buildNav() {
  const links = currentProject.chapters
    .map((chapter, index) => {
      const title = escapeXml(chapter.title || `Rozdział ${index + 1}`);
      const href = escapeXml(`text/${normalizeChapterFile(chapter.file, index)}`);
      return `<li><a href="${href}">${title}</a></li>`;
    })
    .join("\n          ");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${escapeXml(currentProject.meta.language || "pl")}">
<head>
  <title>Spis treści</title>
  <meta charset="utf-8"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Spis treści</h1>
    <ol>
      ${links}
    </ol>
  </nav>
</body>
</html>`;
}

function buildContainerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function wrapChapterHtml(chapter, index) {
  const title = escapeXml(chapter.title || `Rozdział ${index + 1}`);
  const lang = escapeXml(currentProject.meta.language || "pl");
  const bodyHtml = chapter.html || "<p></p>";

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}">
<head>
  <title>${title}</title>
  <meta charset="utf-8"/>
</head>
<body>
  <section>
    <h1>${title}</h1>
    ${bodyHtml}
  </section>
</body>
</html>`;
}

function normalizeChapterFile(fileName, index) {
  const safe = (fileName || `chapter-${index + 1}.xhtml`).trim();
  if (/\.(xhtml|html)$/i.test(safe)) return safe;
  return `${safe}.xhtml`;
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getImageExtension(name = "") {
  const parts = name.split(".");
  return (parts.pop() || "jpg").toLowerCase();
}

function getImageMediaType(ext) {
  switch (ext) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function exportEpub() {
  saveCurrentChapterEdits();
  syncMetaFromInputs();

  if (!currentProject.meta.title.trim()) {
    alert("Uzupełnij tytuł książki przed eksportem EPUB.");
    switchTab("metaTab");
    return;
  }

  if (!currentProject.chapters.length) {
    alert("Dodaj przynajmniej jeden rozdział przed eksportem EPUB.");
    switchTab("chaptersTab");
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
    oebps.file("nav.xhtml", buildNav());

    currentProject.chapters.forEach((chapter, index) => {
      const fileName = normalizeChapterFile(chapter.file, index);
      textFolder.file(fileName, wrapChapterHtml(chapter, index));
    });

    if (currentProject.cover) {
      imagesFolder.file(
        currentProject.coverName || "cover.jpg",
        dataUrlToUint8Array(currentProject.cover)
      );
    }

    currentProject.illustrations.forEach((item) => {
      imagesFolder.file(item.name, dataUrlToUint8Array(item.data));
    });

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/epub+zip"
    });

    const fileName =
      currentProject.meta.fileName ||
      `${currentProject.meta.id || slugify(currentProject.meta.title || "book") || "book"}.epub`;

    downloadBlob(blob, fileName);
    logAdmin(`Wyeksportowano EPUB: ${fileName}.`);
    switchTab("exportTab");
  } catch (error) {
    console.error(error);
    logAdmin("Błąd podczas eksportu EPUB.");
    alert("Nie udało się wyeksportować EPUB.");
  }
}

async function importEpubFile(file) {
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const epubBook = ePub(arrayBuffer);

    await epubBook.ready;

    const meta = await epubBook.loaded.metadata;
    const navigation = await epubBook.loaded.navigation;
    const spineItems = epubBook.spine?.spineItems || [];

    const chapters = [];

    for (let i = 0; i < spineItems.length; i += 1) {
      const item = spineItems[i];
      try {
        const sectionText = await item.load(epubBook.load.bind(epubBook));
        chapters.push({
          id: item.idref || `chapter-${i + 1}`,
          title: findTocLabel(navigation?.toc || [], item.href) || `Rozdział ${i + 1}`,
          file: item.href || `chapter-${i + 1}.xhtml`,
          html: sectionText || "<p></p>"
        });
        item.unload();
      } catch (error) {
        console.warn(error);
      }
    }

    currentProject = {
      meta: {
        title: meta?.title || file.name.replace(/\.epub$/i, ""),
        author: meta?.creator || "",
        category: "",
        language: meta?.language || "pl",
        id: slugify(meta?.title || file.name.replace(/\.epub$/i, "") || "book"),
        fileName: file.name,
        description: ""
      },
      source: "Import EPUB",
      cover: "",
      coverName: "",
      illustrations: [],
      chapters: chapters.length ? chapters : [createChapter(0)]
    };

    currentChapterIndex = 0;
    updateUiFromProject();
    switchTab("chaptersTab");
    logAdmin(`Zaimportowano plik EPUB: ${file.name}.`);
  } catch (error) {
    console.error(error);
    logAdmin(`Błąd podczas importu EPUB: ${file.name}.`);
    alert("Nie udało się zaimportować pliku EPUB.");
  }
}

function handleToolbarCommand(event) {
  const btn = event.currentTarget;
  const cmd = btn.dataset.cmd;
  const value = btn.dataset.value || null;

  chapterEditor.focus();

  if (cmd === "formatBlock" && value) {
    document.execCommand(cmd, false, value);
  } else {
    document.execCommand(cmd, false, null);
  }

  chapterHtmlOutput.value = chapterEditor.innerHTML;
  saveCurrentChapterEdits();
}

function bindEvents() {
  stepButtons.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  startNewBookBtn?.addEventListener("click", startNewProject);

  startOpenRepoBtn?.addEventListener("click", () => {
    switchTab("repoTab");
    loadRepoBooks();
  });

  refreshRepoBooksBtn?.addEventListener("click", loadRepoBooks);
  repoSearchInput?.addEventListener("input", debounce(filterRepoBooks, 120));

  importEpubInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    importEpubFile(file);
    event.target.value = "";
  });

  saveDraftBtn?.addEventListener("click", saveDraft);
  loadDraftBtn?.addEventListener("click", loadDraft);
  clearDraftBtn?.addEventListener("click", clearDraft);
  saveDraftPrimaryBtn?.addEventListener("click", saveDraft);

  exportProjectJsonBtn?.addEventListener("click", exportProjectJson);
  exportEpubBtn?.addEventListener("click", exportEpub);

  [
    bookTitleInput,
    bookAuthorInput,
    bookCategoryInput,
    bookLanguageInput,
    bookIdInput,
    bookFileNameInput,
    bookDescriptionInput
  ].forEach(input => {
    input?.addEventListener("input", syncMetaFromInputs);
  });

  bookTitleInput?.addEventListener("input", autoFillSlugFields);

  addChapterBtn?.addEventListener("click", addChapter);
  duplicateChapterBtn?.addEventListener("click", duplicateCurrentChapter);
  deleteChapterBtn?.addEventListener("click", deleteCurrentChapter);

  chapterTitleInput?.addEventListener("input", () => {
    saveCurrentChapterEdits();
  });

  chapterFileInput?.addEventListener("input", () => {
    saveCurrentChapterEdits();
  });

  chapterEditor?.addEventListener("input", debounce(() => {
    chapterHtmlOutput.value = chapterEditor.innerHTML;
    saveCurrentChapterEdits();
  }, 120));

  chapterHtmlOutput?.addEventListener("input", debounce(() => {
    if (currentChapterIndex < 0 || !currentProject.chapters[currentChapterIndex]) return;
    currentProject.chapters[currentChapterIndex].html = chapterHtmlOutput.value;
    chapterEditor.innerHTML = chapterHtmlOutput.value || "<p></p>";
  }, 180));

  coverUploadInput?.addEventListener("change", handleCoverUpload);
  illustrationsUploadInput?.addEventListener("change", handleIllustrationsUpload);

  editorToolbarButtons.forEach(btn => {
    btn.addEventListener("click", handleToolbarCommand);
  });
}

function initAdmin() {
  bindEvents();
  loadRepoBooks();
  startNewProject();
  logAdmin("Panel administratora gotowy do pracy.");
}

initAdmin();
