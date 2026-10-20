const ADMIN_DRAFT_KEY = "epub_pro_admin_draft_v4";

const sectionButtons = document.querySelectorAll(".sidebar-nav__btn");
const sections = document.querySelectorAll(".admin-section");

const startNewBookBtn = document.getElementById("startNewBookBtn");
const importBookInput = document.getElementById("importBookInput");
const openRepoSectionBtn = document.getElementById("openRepoSectionBtn");

const saveDraftBtn = document.getElementById("saveDraftBtn");
const loadDraftBtn = document.getElementById("loadDraftBtn");
const clearDraftBtn = document.getElementById("clearDraftBtn");
const saveDraftMainBtn = document.getElementById("saveDraftMainBtn");

const refreshRepoBtn = document.getElementById("refreshRepoBtn");
const repoSearchInput = document.getElementById("repoSearchInput");
const repoBooksList = document.getElementById("repoBooksList");

const currentProjectTitle = document.getElementById("currentProjectTitle");
const currentProjectAuthor = document.getElementById("currentProjectAuthor");
const currentProjectSource = document.getElementById("currentProjectSource");
const currentProjectChapterCount = document.getElementById("currentProjectChapterCount");

const bookTitleInput = document.getElementById("bookTitleInput");
const bookAuthorInput = document.getElementById("bookAuthorInput");
const bookCategoryInput = document.getElementById("bookCategoryInput");
const bookLanguageInput = document.getElementById("bookLanguageInput");
const bookSlugInput = document.getElementById("bookSlugInput");
const bookFileNameInput = document.getElementById("bookFileNameInput");
const bookDescriptionInput = document.getElementById("bookDescriptionInput");

const addChapterBtn = document.getElementById("addChapterBtn");
const moveChapterUpBtn = document.getElementById("moveChapterUpBtn");
const moveChapterDownBtn = document.getElementById("moveChapterDownBtn");
const duplicateChapterBtn = document.getElementById("duplicateChapterBtn");
const deleteChapterBtn = document.getElementById("deleteChapterBtn");
const chaptersList = document.getElementById("chaptersList");
const chapterTitleInput = document.getElementById("chapterTitleInput");
const chapterFileInput = document.getElementById("chapterFileInput");
const chapterEditor = document.getElementById("chapterEditor");
const chapterHtmlInput = document.getElementById("chapterHtmlInput");
const toolbarButtons = document.querySelectorAll(".word-editor-toolbar button");

const coverInput = document.getElementById("coverInput");
const coverPreview = document.getElementById("coverPreview");
const imagesInput = document.getElementById("imagesInput");
const imagesList = document.getElementById("imagesList");

const exportEpubBtn = document.getElementById("exportEpubBtn");
const exportDocxBtn = document.getElementById("exportDocxBtn");
const exportOdtBtn = document.getElementById("exportOdtBtn");
const exportHtmlBtn = document.getElementById("exportHtmlBtn");
const exportTxtBtn = document.getElementById("exportTxtBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportLibraryEntryBtn = document.getElementById("exportLibraryEntryBtn");
const adminLogOutput = document.getElementById("adminLogOutput");

let repoBooks = [];
let currentChapterIndex = -1;

let project = createEmptyProject();

function createEmptyProject() {
  return {
    source: "Nowy projekt",
    meta: {
      title: "",
      author: "",
      category: "",
      language: "pl",
      slug: "",
      fileName: "",
      description: ""
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
  adminLogOutput.value = adminLogOutput.value
    ? `${line}\n${adminLogOutput.value}`
    : line;
}

function switchSection(sectionId) {
  sectionButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === sectionId);
  });

  sections.forEach(section => {
    section.classList.toggle("active-section", section.id === sectionId);
  });
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

function saveMetaFromInputs() {
  project.meta.title = bookTitleInput.value.trim();
  project.meta.author = bookAuthorInput.value.trim();
  project.meta.category = bookCategoryInput.value.trim();
  project.meta.language = bookLanguageInput.value.trim() || "pl";
  project.meta.slug = bookSlugInput.value.trim();
  project.meta.fileName = bookFileNameInput.value.trim();
  project.meta.description = bookDescriptionInput.value.trim();
  updateSummary();
}

function fillMetaInputs() {
  bookTitleInput.value = project.meta.title || "";
  bookAuthorInput.value = project.meta.author || "";
  bookCategoryInput.value = project.meta.category || "";
  bookLanguageInput.value = project.meta.language || "pl";
  bookSlugInput.value = project.meta.slug || "";
  bookFileNameInput.value = project.meta.fileName || "";
  bookDescriptionInput.value = project.meta.description || "";
}

function updateSummary() {
  currentProjectTitle.textContent = project.meta.title || "Brak projektu";
  currentProjectAuthor.textContent = project.meta.author || "—";
  currentProjectSource.textContent = project.source || "—";
  currentProjectChapterCount.textContent = String(project.chapters.length || 0);
}

function autoFillSlugAndFile() {
  const title = bookTitleInput.value.trim();
  const slug = slugify(title);

  if (!bookSlugInput.value.trim() && slug) {
    bookSlugInput.value = slug;
  }

  if (!bookFileNameInput.value.trim() && slug) {
    bookFileNameInput.value = `${slug}.epub`;
  }

  saveMetaFromInputs();
}

function createNewProject() {
  project = createEmptyProject();
  project.source = "Nowy projekt";
  project.chapters = [createEmptyChapter(0)];
  currentChapterIndex = 0;
  renderAllProjectUi();
  switchSection("metadataSection");
  logMessage("Utworzono nowy projekt książki.");
}

function renderAllProjectUi() {
  fillMetaInputs();
  updateSummary();
  renderChapters();
  renderCurrentChapter();
  renderCover();
  renderImages();
}

function renderChapters() {
  if (!project.chapters.length) {
    chaptersList.innerHTML = `<div class="empty-state">Nie ma jeszcze rozdziałów.</div>`;
    return;
  }

  chaptersList.innerHTML = "";

  project.chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chapter-item ${index === currentChapterIndex ? "active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(chapter.title || `Rozdział ${index + 1}`)}</strong>
      <span>${escapeHtml(chapter.file || `chapter-${index + 1}.xhtml`)}</span>
    `;
    button.addEventListener("click", () => {
      persistCurrentChapter();
      currentChapterIndex = index;
      renderChapters();
      renderCurrentChapter();
    });
    chaptersList.appendChild(button);
  });
}

function renderCurrentChapter() {
  if (!project.chapters.length || currentChapterIndex < 0 || !project.chapters[currentChapterIndex]) {
    chapterTitleInput.value = "";
    chapterFileInput.value = "";
    chapterEditor.innerHTML = "<p>Zacznij pisać treść rozdziału tutaj...</p>";
    chapterHtmlInput.value = "";
    return;
  }

  const chapter = project.chapters[currentChapterIndex];
  chapterTitleInput.value = chapter.title || "";
  chapterFileInput.value = chapter.file || "";
  chapterEditor.innerHTML = chapter.html || "<p></p>";
  chapterHtmlInput.value = chapter.html || "";
}

function persistCurrentChapter() {
  if (currentChapterIndex < 0 || !project.chapters[currentChapterIndex]) return;

  const chapter = project.chapters[currentChapterIndex];
  chapter.title = chapterTitleInput.value.trim() || `Rozdział ${currentChapterIndex + 1}`;
  chapter.file = chapterFileInput.value.trim() || `chapter-${currentChapterIndex + 1}.xhtml`;
  chapter.html = chapterEditor.innerHTML.trim() || "<p></p>";
  chapterHtmlInput.value = chapter.html;

  renderChapters();
  updateSummary();
}

function addChapter() {
  persistCurrentChapter();
  const chapter = createEmptyChapter(project.chapters.length);
  project.chapters.push(chapter);
  currentChapterIndex = project.chapters.length - 1;
  renderChapters();
  renderCurrentChapter();
  updateSummary();
  switchSection("editorSection");
  logMessage(`Dodano nowy rozdział: ${chapter.title}.`);
}

function moveCurrentChapterUp() {
  if (currentChapterIndex <= 0 || !project.chapters[currentChapterIndex]) return;
  persistCurrentChapter();

  const idx = currentChapterIndex;
  [project.chapters[idx - 1], project.chapters[idx]] = [project.chapters[idx], project.chapters[idx - 1]];
  currentChapterIndex = idx - 1;

  renderChapters();
  renderCurrentChapter();
  logMessage(`Przesunięto rozdział w górę.`);
}

function moveCurrentChapterDown() {
  if (currentChapterIndex < 0 || currentChapterIndex >= project.chapters.length - 1) return;
  persistCurrentChapter();

  const idx = currentChapterIndex;
  [project.chapters[idx], project.chapters[idx + 1]] = [project.chapters[idx + 1], project.chapters[idx]];
  currentChapterIndex = idx + 1;

  renderChapters();
  renderCurrentChapter();
  logMessage(`Przesunięto rozdział w dół.`);
}

function duplicateCurrentChapter() {
  if (currentChapterIndex < 0 || !project.chapters[currentChapterIndex]) {
    alert("Wybierz rozdział do skopiowania.");
    return;
  }

  persistCurrentChapter();

  const source = project.chapters[currentChapterIndex];
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
  if (currentChapterIndex < 0 || !project.chapters[currentChapterIndex]) {
    alert("Nie ma rozdziału do usunięcia.");
    return;
  }

  const title = project.chapters[currentChapterIndex].title || "ten rozdział";
  const confirmed = confirm(`Czy na pewno chcesz usunąć rozdział "${title}"?`);
  if (!confirmed) return;

  project.chapters.splice(currentChapterIndex, 1);

  if (project.chapters.length === 0) {
    currentChapterIndex = -1;
  } else if (currentChapterIndex >= project.chapters.length) {
    currentChapterIndex = project.chapters.length - 1;
  }

  renderChapters();
  renderCurrentChapter();
  updateSummary();
  logMessage(`Usunięto rozdział: ${title}.`);
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

  chapterHtmlInput.value = chapterEditor.innerHTML;
  persistCurrentChapter();
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
    project.cover = {
      name: file.name,
      dataUrl
    };
    renderCover();
    logMessage(`Wczytano okładkę: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać okładki.");
  }
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

async function handleImagesUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  try {
    const items = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        dataUrl: await fileToDataUrl(file)
      }))
    );

    project.images.push(...items);
    renderImages();
    logMessage(`Dodano ilustracje: ${items.map(item => item.name).join(", ")}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać ilustracji.");
  }
}

function renderImages() {
  if (!project.images.length) {
    imagesList.innerHTML = `<div class="empty-state">Brak ilustracji.</div>`;
    return;
  }

  imagesList.innerHTML = "";

  project.images.forEach((image, index) => {
    const card = document.createElement("div");
    card.className = "image-mini-card";
    card.innerHTML = `
      <img src="${image.dataUrl}" alt="${escapeHtml(image.name)}" />
      <div>
        <h4>${escapeHtml(image.name)}</h4>
        <p>Ilustracja ${index + 1}</p>
      </div>
    `;
    imagesList.appendChild(card);
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
    switchSection("dashboardSection");
    logMessage("Wczytano projekt roboczy.");
  } catch (error) {
    console.error(error);
    alert("Nie udało się wczytać projektu roboczego.");
  }
}

function clearDraft() {
  const confirmed = confirm("Czy na pewno chcesz usunąć zapis roboczy?");
  if (!confirmed) return;

  localStorage.removeItem(ADMIN_DRAFT_KEY);
  logMessage("Usunięto zapis roboczy.");
}

function buildProjectJsonFileName() {
  const base = project.meta.slug || slugify(project.meta.title) || "projekt-epub";
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

  const fileName = buildProjectJsonFileName();
  downloadBlob(blob, fileName);
  logMessage(`Wyeksportowano backup projektu: ${fileName}.`);
}

function buildLibraryEntryObject() {
  persistCurrentChapter();
  saveMetaFromInputs();

  const slug = project.meta.slug || slugify(project.meta.title) || "book";
  const epubFile = project.meta.fileName
    ? normalizeFileName(project.meta.fileName, slug, "epub")
    : `${slug}.epub`;

  const coverName = project.cover?.name
    ? project.cover.name
    : `${slug}.jpg`;

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
  const fileName = `${entry.id}-library-entry.json`;
  downloadBlob(blob, fileName);

  const copied = await copyTextToClipboard(json);
  if (copied) {
    logMessage(`Wyeksportowano wpis do library.json i skopiowano go do schowka: ${fileName}.`);
  } else {
    logMessage(`Wyeksportowano wpis do library.json: ${fileName}.`);
  }

  alert(
    copied
      ? "Gotowy wpis do library.json został pobrany i skopiowany do schowka."
      : "Gotowy wpis do library.json został pobrany jako osobny plik JSON."
  );
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
          ${chapter.html || "<p></p>"}
        </div>
      </section>
    `)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    body {
      font-family: Georgia, "Times New Roman", serif;
      max-width: 860px;
      margin: 40px auto;
      padding: 0 24px 60px;
      line-height: 1.7;
      color: #111827;
      background: #ffffff;
    }
    h1, h2, h3, h4 { color: #111827; }
    .book-head { margin-bottom: 40px; }
    .book-cover img {
      max-width: 280px;
      height: auto;
      display: block;
      margin: 0 0 32px 0;
    }
    .chapter {
      margin: 0 0 42px 0;
      page-break-after: always;
    }
    .chapter:last-child {
      page-break-after: auto;
    }
  </style>
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
  const base = project.meta.slug || slugify(project.meta.title) || "ksiazka";
  const fileName = `${base}.html`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, fileName);
  logMessage(`Wyeksportowano HTML: ${fileName}.`);
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
    lines.push(stripHtml(chapter.html || ""));
    lines.push("");
  });

  const txt = lines.join("\n");
  const base = project.meta.slug || slugify(project.meta.title) || "ksiazka";
  const fileName = `${base}.txt`;

  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, fileName);
  logMessage(`Wyeksportowano TXT: ${fileName}.`);
}

function buildDocLikeHtml(formatName) {
  const html = buildFullBookHtmlDocument();
  logMessage(`Przygotowano eksport ${formatName} na bazie dokumentu HTML.`);
  return html;
}

function exportDocx() {
  const html = buildDocLikeHtml("DOCX");
  const base = project.meta.slug || slugify(project.meta.title) || "ksiazka";
  const fileName = `${base}.docx`;

  const blob = new Blob([html], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });

  downloadBlob(blob, fileName);
  logMessage(`Wyeksportowano plik DOCX (wersja bazowa HTML): ${fileName}.`);
}

function exportOdt() {
  const html = buildDocLikeHtml("ODT");
  const base = project.meta.slug || slugify(project.meta.title) || "ksiazka";
  const fileName = `${base}.odt`;

  const blob = new Blob([html], {
    type: "application/vnd.oasis.opendocument.text"
  });

  downloadBlob(blob, fileName);
  logMessage(`Wyeksportowano plik ODT (wersja bazowa HTML): ${fileName}.`);
}

function getImageExtension(name = "") {
  const parts = name.split(".");
  return (parts.pop() || "jpg").toLowerCase();
}

function getImageMimeType(ext) {
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

function buildContainerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function buildOpf() {
  const identifier = escapeXml(project.meta.slug || slugify(project.meta.title) || "book");
  const title = escapeXml(project.meta.title || "Bez tytułu");
  const author = escapeXml(project.meta.author || "Nieznany autor");
  const language = escapeXml(project.meta.language || "pl");
  const description = escapeXml(project.meta.description || "");
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const coverMeta = project.cover?.dataUrl
    ? `<meta name="cover" content="cover-image"/>`
    : "";

  const coverManifest = project.cover?.dataUrl
    ? `<item id="cover-image" href="images/${escapeXml(project.cover.name || "cover.jpg")}" media-type="${getImageMimeType(getImageExtension(project.cover.name || "cover.jpg"))}"/>`
    : "";

  const chapterManifest = project.chapters
    .map((chapter, index) => {
      const href = escapeXml(normalizeChapterFileName(chapter.file, index));
      return `<item id="chap${index + 1}" href="text/${href}" media-type="application/xhtml+xml"/>`;
    })
    .join("\n    ");

  const imageManifest = project.images
    .map((image, index) => {
      const ext = getImageExtension(image.name);
      const mime = getImageMimeType(ext);
      return `<item id="img${index + 1}" href="images/${escapeXml(image.name)}" media-type="${mime}"/>`;
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
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${coverManifest}
    ${chapterManifest}
    ${imageManifest}
  </manifest>
  <spine>
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

function buildChapterXhtml(chapter, index) {
  const title = escapeXml(chapter.title || `Rozdział ${index + 1}`);
  const lang = escapeXml(project.meta.language || "pl");

  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${lang}">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
</head>
<body>
  <section>
    <h1>${title}</h1>
    ${chapter.html || "<p></p>"}
  </section>
</body>
</html>`;
}

async function exportEpub() {
  persistCurrentChapter();
  saveMetaFromInputs();

  if (!project.meta.title.trim()) {
    alert("Uzupełnij tytuł książki przed eksportem EPUB.");
    switchSection("metadataSection");
    return;
  }

  if (!project.chapters.length) {
    alert("Dodaj przynajmniej jeden rozdział przed eksportem EPUB.");
    switchSection("editorSection");
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

    project.chapters.forEach((chapter, index) => {
      const fileName = normalizeChapterFileName(chapter.file, index);
      textFolder.file(fileName, buildChapterXhtml(chapter, index));
    });

    if (project.cover?.dataUrl) {
      imagesFolder.file(project.cover.name || "cover.jpg", dataUrlToUint8Array(project.cover.dataUrl));
    }

    project.images.forEach(image => {
      imagesFolder.file(image.name, dataUrlToUint8Array(image.dataUrl));
    });

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/epub+zip"
    });

    const base = project.meta.fileName || `${project.meta.slug || slugify(project.meta.title) || "book"}.epub`;
    const fileName = base.toLowerCase().endsWith(".epub") ? base : `${base}.epub`;

    downloadBlob(blob, fileName);
    logMessage(`Wyeksportowano EPUB: ${fileName}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się wyeksportować EPUB.");
    logMessage("Błąd eksportu EPUB.");
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

  rootNodes.forEach(node => {
    const isElement = node.nodeType === 1;
    const tag = isElement ? node.tagName.toLowerCase() : "";

    if (["h1", "h2"].includes(tag)) {
      startChapter(node.textContent.trim() || `Rozdział ${chapters.length + 1}`);
      current.html += node.outerHTML;
      return;
    }

    if (!current) {
      startChapter(fallbackTitle);
    }

    if (node.nodeType === 1) {
      current.html += node.outerHTML;
    } else if (node.nodeType === 3 && node.textContent.trim()) {
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

async function importEpubFile(file) {
  if (!file) return;

  try {
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
        importedChapters.push({
          id: item.idref || `chapter-${i + 1}`,
          title: findTocLabel(toc, item.href) || `Rozdział ${i + 1}`,
          file: item.href || `chapter-${i + 1}.xhtml`,
          html: text || "<p></p>"
        });
        item.unload();
      } catch (error) {
        console.warn(error);
      }
    }

    project = createEmptyProject();
    project.source = "Import EPUB";
    project.meta.title = metadata?.title || file.name.replace(/\.epub$/i, "");
    project.meta.author = metadata?.creator || "";
    project.meta.language = metadata?.language || "pl";
    project.meta.slug = slugify(project.meta.title || file.name.replace(/\.epub$/i, ""));
    project.meta.fileName = file.name;
    project.chapters = importedChapters.length ? importedChapters : [createEmptyChapter(0)];

    currentChapterIndex = 0;
    renderAllProjectUi();
    switchSection("editorSection");
    logMessage(`Zaimportowano plik EPUB: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować EPUB.");
    logMessage(`Błąd importu EPUB: ${file.name}.`);
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
    project.meta.slug = slugify(project.meta.title);
    project.meta.fileName = `${project.meta.slug || "book"}.epub`;
    project.chapters = splitHtmlIntoChaptersFromHeadings(html, project.meta.title || "Import DOCX");

    currentChapterIndex = 0;
    renderAllProjectUi();
    switchSection("editorSection");
    logMessage(`Zaimportowano plik DOCX: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować DOCX.");
    logMessage(`Błąd importu DOCX: ${file.name}.`);
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
  html = html.replace(/<[^>]+>/g, match => {
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

    if (!contentXmlFile) {
      throw new Error("Brak content.xml w pliku ODT.");
    }

    const contentXml = await contentXmlFile.async("string");
    const html = convertOdtXmlToHtml(contentXml);

    project = createEmptyProject();
    project.source = "Import ODT";
    project.meta.title = file.name.replace(/\.odt$/i, "");
    project.meta.slug = slugify(project.meta.title);
    project.meta.fileName = `${project.meta.slug || "book"}.epub`;
    project.chapters = splitHtmlIntoChaptersFromHeadings(html, project.meta.title || "Import ODT");

    currentChapterIndex = 0;
    renderAllProjectUi();
    switchSection("editorSection");
    logMessage(`Zaimportowano plik ODT: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować ODT.");
    logMessage(`Błąd importu ODT: ${file.name}.`);
  }
}

async function importHtmlFile(file) {
  try {
    const text = await file.text();
    project = createEmptyProject();
    project.source = "Import HTML";
    project.meta.title = file.name.replace(/\.html?$/i, "");
    project.meta.slug = slugify(project.meta.title);
    project.meta.fileName = `${project.meta.slug || "book"}.epub`;
    project.chapters = splitHtmlIntoChaptersFromHeadings(text, project.meta.title || "Import HTML");

    currentChapterIndex = 0;
    renderAllProjectUi();
    switchSection("editorSection");
    logMessage(`Zaimportowano plik HTML: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować HTML.");
    logMessage(`Błąd importu HTML: ${file.name}.`);
  }
}

async function importTxtFile(file) {
  try {
    const text = await file.text();
    const paragraphs = text
      .split(/\n{2,}/)
      .map(block => block.trim())
      .filter(Boolean)
      .map(block => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
      .join("\n");

    project = createEmptyProject();
    project.source = "Import TXT";
    project.meta.title = file.name.replace(/\.txt$/i, "");
    project.meta.slug = slugify(project.meta.title);
    project.meta.fileName = `${project.meta.slug || "book"}.epub`;
    project.chapters = [{
      id: `chapter-${Date.now()}`,
      title: project.meta.title || "Import TXT",
      file: "chapter-1.xhtml",
      html: paragraphs || "<p></p>"
    }];

    currentChapterIndex = 0;
    renderAllProjectUi();
    switchSection("editorSection");
    logMessage(`Zaimportowano plik TXT: ${file.name}.`);
  } catch (error) {
    console.error(error);
    alert("Nie udało się zaimportować TXT.");
    logMessage(`Błąd importu TXT: ${file.name}.`);
  }
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

async function loadRepoBooks() {
  repoBooksList.innerHTML = `<div class="empty-state">Ładowanie książek z repo...</div>`;

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`);
    const data = await response.json();
    repoBooks = Array.isArray(data.books) ? data.books : [];
    renderRepoBooks(repoBooks);
    logMessage(`Wczytano listę książek z repo: ${repoBooks.length}.`);
  } catch (error) {
    console.error(error);
    repoBooksList.innerHTML = `<div class="empty-state">Nie udało się wczytać listy książek z repo.</div>`;
    logMessage("Błąd wczytywania książek z repo.");
  }
}

function renderRepoBooks(list) {
  if (!list.length) {
    repoBooksList.innerHTML = `<div class="empty-state">Brak książek w repo.</div>`;
    return;
  }

  repoBooksList.innerHTML = "";

  list.forEach(book => {
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
      </div>
    `;

    card.querySelector('[data-role="edit"]').addEventListener("click", () => {
      openRepoBook(book, false);
    });

    card.querySelector('[data-role="duplicate"]').addEventListener("click", () => {
      openRepoBook(book, true);
    });

    repoBooksList.appendChild(card);
  });
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

async function openRepoBook(book, duplicate = false) {
  try {
    const response = await fetch(`${book.epub}?v=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const buffer = await response.arrayBuffer();
    const epubBook = ePub(buffer);

    await epubBook.ready;

    const metadata = await epubBook.loaded.metadata;
    const navigation = await epubBook.loaded.navigation;
    const toc = navigation?.toc || [];
    const spineItems = epubBook.spine?.spineItems || [];
    const chapters = [];

    for (let i = 0; i < spineItems.length; i += 1) {
      const item = spineItems[i];
      try {
        const html = await item.load(epubBook.load.bind(epubBook));
        chapters.push({
          id: item.idref || `chapter-${i + 1}`,
          title: findTocLabel(toc, item.href) || `Rozdział ${i + 1}`,
          file: item.href || `chapter-${i + 1}.xhtml`,
          html: html || "<p></p>"
        });
        item.unload();
      } catch (error) {
        console.warn(error);
      }
    }

    project = createEmptyProject();
    project.source = duplicate ? "Duplikat z repo" : "Repo";
    project.meta.title = duplicate
      ? `${metadata?.title || book.title || "Bez tytułu"} (kopia)`
      : (metadata?.title || book.title || "");
    project.meta.author = metadata?.creator || book.author || "";
    project.meta.category = book.category || "";
    project.meta.language = metadata?.language || "pl";
    project.meta.slug = duplicate
      ? `${slugify(metadata?.title || book.title || "book")}-copy`
      : slugify(book.id || metadata?.title || book.title || "book");
    project.meta.fileName = duplicate
      ? `${project.meta.slug}.epub`
      : (book.epub?.split("/").pop() || `${project.meta.slug}.epub`);
    project.meta.description = book.description || "";
    project.cover = {
      name: book.cover ? book.cover.split("/").pop() : "",
      dataUrl: book.cover || ""
    };
    project.chapters = chapters.length ? chapters : [createEmptyChapter(0)];

    currentChapterIndex = 0;
    renderAllProjectUi();
    switchSection("editorSection");

    logMessage(
      duplicate
        ? `Utworzono kopię książki z repo: ${project.meta.title}.`
        : `Otworzono książkę z repo do edycji: ${project.meta.title}.`
    );
  } catch (error) {
    console.error(error);
    alert("Nie udało się otworzyć książki z repo.");
    logMessage(`Błąd otwierania książki z repo: ${book.title || book.epub}.`);
  }
}

function updateStickyToolbarOffset() {
  const topbar = document.querySelector(".admin-topbar");
  const topbarHeight = topbar ? Math.ceil(topbar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty("--admin-toolbar-sticky-top", `${topbarHeight}px`);
}

function bindEvents() {
  sectionButtons.forEach(button => {
    button.addEventListener("click", () => switchSection(button.dataset.target));
  });

  startNewBookBtn?.addEventListener("click", createNewProject);

  openRepoSectionBtn?.addEventListener("click", () => {
    switchSection("repoSection");
    loadRepoBooks();
  });

  importBookInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "epub") {
      await importEpubFile(file);
    } else if (ext === "docx") {
      await importDocxFile(file);
    } else if (ext === "odt") {
      await importOdtFile(file);
    } else if (ext === "html" || ext === "htm") {
      await importHtmlFile(file);
    } else if (ext === "txt") {
      await importTxtFile(file);
    } else {
      alert("Nieobsługiwany format pliku.");
      logMessage(`Nieobsługiwany format importu: ${file.name}.`);
    }

    event.target.value = "";
  });

  refreshRepoBtn?.addEventListener("click", loadRepoBooks);
  repoSearchInput?.addEventListener("input", filterRepoBooks);

  saveDraftBtn?.addEventListener("click", saveDraft);
  loadDraftBtn?.addEventListener("click", loadDraft);
  clearDraftBtn?.addEventListener("click", clearDraft);
  saveDraftMainBtn?.addEventListener("click", saveDraft);

  [
    bookTitleInput,
    bookAuthorInput,
    bookCategoryInput,
    bookLanguageInput,
    bookSlugInput,
    bookFileNameInput,
    bookDescriptionInput
  ].forEach(input => {
    input?.addEventListener("input", saveMetaFromInputs);
  });

  bookTitleInput?.addEventListener("input", autoFillSlugAndFile);

  addChapterBtn?.addEventListener("click", addChapter);
  moveChapterUpBtn?.addEventListener("click", moveCurrentChapterUp);
  moveChapterDownBtn?.addEventListener("click", moveCurrentChapterDown);
  duplicateChapterBtn?.addEventListener("click", duplicateCurrentChapter);
  deleteChapterBtn?.addEventListener("click", deleteCurrentChapter);

  chapterTitleInput?.addEventListener("input", persistCurrentChapter);
  chapterFileInput?.addEventListener("input", persistCurrentChapter);

  chapterEditor?.addEventListener("input", () => {
    chapterHtmlInput.value = chapterEditor.innerHTML;
    persistCurrentChapter();
  });

  chapterHtmlInput?.addEventListener("input", () => {
    if (currentChapterIndex < 0 || !project.chapters[currentChapterIndex]) return;
    project.chapters[currentChapterIndex].html = chapterHtmlInput.value;
    chapterEditor.innerHTML = chapterHtmlInput.value || "<p></p>";
  });

  toolbarButtons.forEach(button => {
    button.addEventListener("click", handleToolbarCommand);
  });

  coverInput?.addEventListener("change", handleCoverUpload);
  imagesInput?.addEventListener("change", handleImagesUpload);

  exportJsonBtn?.addEventListener("click", exportJson);
  exportLibraryEntryBtn?.addEventListener("click", exportLibraryEntry);
  exportHtmlBtn?.addEventListener("click", exportHtml);
  exportTxtBtn?.addEventListener("click", exportTxt);
  exportDocxBtn?.addEventListener("click", exportDocx);
  exportOdtBtn?.addEventListener("click", exportOdt);
  exportEpubBtn?.addEventListener("click", exportEpub);

  window.addEventListener("resize", updateStickyToolbarOffset);
  window.addEventListener("orientationchange", updateStickyToolbarOffset);
}

function initAdmin() {
  bindEvents();
  createNewProject();
  loadRepoBooks();
  switchSection("dashboardSection");
  updateStickyToolbarOffset();
  setTimeout(updateStickyToolbarOffset, 50);
  logMessage("Panel administratora został uruchomiony.");
}

initAdmin();
