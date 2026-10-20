const STORAGE_KEY = "epub_admin_draft_pro";

const refreshRepoBtn = document.getElementById("refreshRepoBtn");
const adminBooksList = document.getElementById("adminBooksList");
const epubUpload = document.getElementById("epubUpload");

const newBookTitle = document.getElementById("newBookTitle");
const newBookAuthor = document.getElementById("newBookAuthor");
const newBookLang = document.getElementById("newBookLang");
const newBookCategory = document.getElementById("newBookCategory");
const newBookDescription = document.getElementById("newBookDescription");
const newBookChapterTitle = document.getElementById("newBookChapterTitle");
const newBookChapterEditor = document.getElementById("newBookChapterEditor");
const createBookBtn = document.getElementById("createBookBtn");

const metaTitle = document.getElementById("metaTitle");
const metaAuthor = document.getElementById("metaAuthor");
const metaLang = document.getElementById("metaLang");
const metaCategory = document.getElementById("metaCategory");
const metaFileName = document.getElementById("metaFileName");
const metaBookId = document.getElementById("metaBookId");
const coverRepoPath = document.getElementById("coverRepoPath");
const metaDescription = document.getElementById("metaDescription");

const chapterSelect = document.getElementById("chapterSelect");
const chapterTitle = document.getElementById("chapterTitle");
const chapterEditor = document.getElementById("chapterEditor");
const chapterContentRaw = document.getElementById("chapterContentRaw");
const chaptersList = document.getElementById("chaptersList");
const addChapterBtn = document.getElementById("addChapterBtn");
const saveChapterBtn = document.getElementById("saveChapterBtn");
const toggleHtmlBtn = document.getElementById("toggleHtmlBtn");
const insertIllustrationBtn = document.getElementById("insertIllustrationBtn");

const coverUpload = document.getElementById("coverUpload");
const illustrationUpload = document.getElementById("illustrationUpload");
const coverPreview = document.getElementById("coverPreview");
const illustrationPreview = document.getElementById("illustrationPreview");

const exportEpubBtn = document.getElementById("exportEpubBtn");
const generateLibraryEntryBtn = document.getElementById("generateLibraryEntryBtn");
const copyLibraryEntryBtn = document.getElementById("copyLibraryEntryBtn");
const libraryEntryOutput = document.getElementById("libraryEntryOutput");

const saveDraftBtn = document.getElementById("saveDraftBtn");
const loadDraftBtn = document.getElementById("loadDraftBtn");
const clearDraftBtn = document.getElementById("clearDraftBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

const editorEmptyStateMeta = document.getElementById("editorEmptyStateMeta");
const editorEmptyStateChapters = document.getElementById("editorEmptyStateChapters");
const editorEmptyStateMedia = document.getElementById("editorEmptyStateMedia");
const editorEmptyStateExport = document.getElementById("editorEmptyStateExport");

const metadataArea = document.getElementById("metadataArea");
const chaptersArea = document.getElementById("chaptersArea");
const mediaArea = document.getElementById("mediaArea");
const exportArea = document.getElementById("exportArea");

let libraryCache = [];
let currentEditableBook = null;
let rawHtmlMode = false;

initTabs();
initEditors();
loadAdminLibrary();

function initTabs() {
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;
      openTab(target);
    });
  });
}

function openTab(name) {
  tabButtons.forEach(btn => btn.classList.remove("active"));
  tabPanels.forEach(panel => panel.classList.remove("active"));

  document.querySelector(`.tab-btn[data-tab="${name}"]`)?.classList.add("active");
  document.getElementById(`tab-${name}`)?.classList.add("active");
}

function initEditors() {
  bindToolbar("newBookEditorToolbar", "newBookChapterEditor");
  bindToolbar("chapterEditorToolbar", "chapterEditor");
}

function bindToolbar(toolbarId, editorId) {
  const toolbar = document.getElementById(toolbarId);
  const editor = document.getElementById(editorId);
  if (!toolbar || !editor) return;

  toolbar.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const command = button.dataset.command;
    const value = button.dataset.value || null;

    editor.focus();
    document.execCommand(command, false, value);
  });
}

async function loadAdminLibrary() {
  adminBooksList.innerHTML = "<p>Ładowanie biblioteki...</p>";

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`);
    const data = await response.json();
    libraryCache = data.books || [];
    renderAdminBooks(libraryCache);
  } catch (error) {
    adminBooksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    console.error(error);
  }
}

function renderAdminBooks(books) {
  if (!books.length) {
    adminBooksList.innerHTML = "<p>Brak książek w bibliotece.</p>";
    return;
  }

  adminBooksList.innerHTML = "";

  books.forEach(book => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img src="${book.cover || 'assets/no-cover.svg'}" alt="${escapeHtml(book.title)}" />
      <div>
        <h3>${escapeHtml(book.title)}</h3>
        <p>${escapeHtml(book.author || "Nieznany autor")}</p>
        <p>${escapeHtml(book.category || "")}</p>
        <p>${escapeHtml(book.epub || "")}</p>
      </div>
    `;
    card.addEventListener("click", () => loadBookFromRepo(book));
    adminBooksList.appendChild(card);
  });
}

async function loadBookFromRepo(bookMeta) {
  try {
    const response = await fetch(`${bookMeta.epub}?v=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const file = new File([blob], getFileNameFromPath(bookMeta.epub), {
      type: "application/epub+zip"
    });

    await importEpubFile(file, bookMeta);
    openTab("metadata");
  } catch (error) {
    alert("Nie udało się wczytać EPUB z repo. Sprawdź ścieżkę i nazwę pliku.");
    console.error(error);
  }
}

epubUpload?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  await importEpubFile(file);
  openTab("metadata");
});

async function importEpubFile(file, libraryMeta = null) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const packagePath = await findOpfPath(zip);
  const packageEntry = zip.file(packagePath);
  if (!packageEntry) {
    throw new Error("Brak content.opf");
  }

  const opfText = await packageEntry.async("string");
  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfText, "application/xml");

  const title =
    getText(opfDoc, "metadata > title, dc\\:title") ||
    file.name.replace(/\.epub$/i, "");

  const author =
    getText(opfDoc, "metadata > creator, dc\\:creator") || "";

  const language =
    getText(opfDoc, "metadata > language, dc\\:language") || "pl";

  const manifestItems = [...opfDoc.querySelectorAll("manifest > item")].map(item => ({
    id: item.getAttribute("id"),
    href: item.getAttribute("href"),
    mediaType: item.getAttribute("media-type"),
    properties: item.getAttribute("properties") || ""
  }));

  const spineRefs = [...opfDoc.querySelectorAll("spine > itemref")].map(item =>
    item.getAttribute("idref")
  );

  const basePath = packagePath.split("/").slice(0, -1).join("/");
  const chapters = [];

  for (const idref of spineRefs) {
    const manifestItem = manifestItems.find(item => item.id === idref);
    if (!manifestItem) continue;

    const mediaType = manifestItem.mediaType || "";
    if (!mediaType.includes("xhtml") && !mediaType.includes("html")) continue;

    const fullPath = normalizePath(basePath, manifestItem.href);
    const zipEntry = zip.file(fullPath);
    if (!zipEntry) continue;

    const content = await zipEntry.async("string");

    chapters.push({
      id: manifestItem.id,
      href: manifestItem.href,
      fullPath,
      title: extractChapterTitle(content) || manifestItem.id,
      content
    });
  }

  currentEditableBook = {
    fileName: file.name.replace(/\.epub$/i, ""),
    title,
    author,
    language,
    category: libraryMeta?.category || "",
    description: libraryMeta?.description || "",
    bookId: libraryMeta?.id || slugify(title),
    repoCoverPath: libraryMeta?.cover || `covers/${slugify(title)}.jpg`,
    epubPath: libraryMeta?.epub || `books/${file.name}`,
    coverDataUrl: libraryMeta?.cover || "",
    illustrationDataUrl: "",
    chapters
  };

  openBookEditor();
}

function openBookEditor() {
  if (!currentEditableBook) return;

  editorEmptyStateMeta.classList.add("hidden");
  editorEmptyStateChapters.classList.add("hidden");
  editorEmptyStateMedia.classList.add("hidden");
  editorEmptyStateExport.classList.add("hidden");

  metadataArea.classList.remove("hidden");
  chaptersArea.classList.remove("hidden");
  mediaArea.classList.remove("hidden");
  exportArea.classList.remove("hidden");

  metaTitle.value = currentEditableBook.title || "";
  metaAuthor.value = currentEditableBook.author || "";
  metaLang.value = currentEditableBook.language || "pl";
  metaCategory.value = currentEditableBook.category || "";
  metaFileName.value = currentEditableBook.fileName || "";
  metaBookId.value = currentEditableBook.bookId || "";
  coverRepoPath.value = currentEditableBook.repoCoverPath || "";
  metaDescription.value = currentEditableBook.description || "";

  coverPreview.src = currentEditableBook.coverDataUrl || "assets/no-cover.svg";
  illustrationPreview.src = currentEditableBook.illustrationDataUrl || "assets/no-cover.svg";

  renderChapterList();
  renderChapterSelect();

  if (currentEditableBook.chapters.length > 0) {
    chapterSelect.value = "0";
    loadSelectedChapter();
  } else {
    chapterEditor.innerHTML = "<p>Brak rozdziałów.</p>";
    chapterContentRaw.value = "";
  }

  libraryEntryOutput.value = "";
}

function renderChapterList() {
  chaptersList.innerHTML = "";

  currentEditableBook.chapters.forEach((chapter, index) => {
    const item = document.createElement("div");
    item.className = "chapter-item";
    item.innerHTML = `<strong>${index + 1}.</strong> ${escapeHtml(chapter.title)}`;
    item.addEventListener("click", () => {
      saveCurrentChapterIfPossible();
      chapterSelect.value = String(index);
      loadSelectedChapter();
      openTab("chapters");
    });
    chaptersList.appendChild(item);
  });
}

function renderChapterSelect() {
  chapterSelect.innerHTML = "";

  currentEditableBook.chapters.forEach((chapter, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${chapter.title}`;
    chapterSelect.appendChild(option);
  });
}

function loadSelectedChapter() {
  const index = Number(chapterSelect.value);
  const chapter = currentEditableBook.chapters[index];
  if (!chapter) return;

  chapterTitle.value = chapter.title || "";
  const bodyHtml = extractBodyContent(chapter.content);
  chapterEditor.innerHTML = bodyHtml;
  chapterContentRaw.value = chapter.content;
}

function saveCurrentChapterIfPossible() {
  if (!currentEditableBook) return;

  const index = Number(chapterSelect.value);
  const chapter = currentEditableBook.chapters[index];
  if (!chapter) return;

  const safeTitle = chapterTitle.value.trim() || `Rozdział ${index + 1}`;
  chapter.title = safeTitle;

  if (rawHtmlMode) {
    chapter.content = chapterContentRaw.value;
  } else {
    chapter.content = wrapChapterHtml(safeTitle, chapterEditor.innerHTML);
  }
}

chapterSelect?.addEventListener("change", () => {
  saveCurrentChapterIfPossible();
  loadSelectedChapter();
});

saveChapterBtn?.addEventListener("click", () => {
  saveCurrentChapterIfPossible();
  renderChapterList();
  renderChapterSelect();
  alert("Rozdział zapisany.");
});

toggleHtmlBtn?.addEventListener("click", () => {
  rawHtmlMode = !rawHtmlMode;

  if (rawHtmlMode) {
    chapterContentRaw.value = wrapChapterHtml(
      chapterTitle.value.trim() || "Rozdział",
      chapterEditor.innerHTML
    );
    chapterContentRaw.classList.remove("hidden");
    chapterEditor.classList.add("hidden");
    toggleHtmlBtn.textContent = "Pokaż edytor";
  } else {
    chapterEditor.innerHTML = extractBodyContent(chapterContentRaw.value);
    chapterContentRaw.classList.add("hidden");
    chapterEditor.classList.remove("hidden");
    toggleHtmlBtn.textContent = "Pokaż HTML";
  }
});

addChapterBtn?.addEventListener("click", () => {
  if (!currentEditableBook) return;

  saveCurrentChapterIfPossible();

  const nextIndex = currentEditableBook.chapters.length + 1;
  currentEditableBook.chapters.push({
    id: `chapter_${nextIndex}`,
    href: `chapter_${nextIndex}.xhtml`,
    fullPath: `OEBPS/chapter_${nextIndex}.xhtml`,
    title: `Rozdział ${nextIndex}`,
    content: wrapChapterHtml(
      `Rozdział ${nextIndex}`,
      `<h1>Rozdział ${nextIndex}</h1><p>Nowa treść rozdziału.</p>`
    )
  });

  renderChapterList();
  renderChapterSelect();
  chapterSelect.value = String(currentEditableBook.chapters.length - 1);
  loadSelectedChapter();
});

insertIllustrationBtn?.addEventListener("click", () => {
  if (!currentEditableBook?.illustrationDataUrl) {
    alert("Najpierw wgraj ilustrację.");
    return;
  }

  const imgHtml = `<p><img src="images/illustration.jpg" alt="Ilustracja" style="max-width:100%;" /></p>`;

  if (rawHtmlMode) {
    chapterContentRaw.value += `\n${imgHtml}`;
  } else {
    chapterEditor.focus();
    document.execCommand("insertHTML", false, imgHtml);
  }
});

coverUpload?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file || !currentEditableBook) return;

  currentEditableBook.coverDataUrl = await fileToDataURL(file);
  coverPreview.src = currentEditableBook.coverDataUrl;

  if (!coverRepoPath.value.trim()) {
    coverRepoPath.value = `covers/${slugify(metaFileName.value || metaTitle.value || "book")}.${getExtension(file.name)}`;
  }
});

illustrationUpload?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file || !currentEditableBook) return;

  currentEditableBook.illustrationDataUrl = await fileToDataURL(file);
  illustrationPreview.src = currentEditableBook.illustrationDataUrl;
});

createBookBtn?.addEventListener("click", () => {
  const title = newBookTitle.value.trim() || "Nowa książka";
  const author = newBookAuthor.value.trim() || "Nieznany autor";
  const language = newBookLang.value.trim() || "pl";
  const category = newBookCategory.value.trim() || "";
  const description = newBookDescription.value.trim() || "";
  const firstChapterTitle = newBookChapterTitle.value.trim() || "Rozdział 1";
  const firstChapterHtml = newBookChapterEditor.innerHTML.trim() || "<h1>Rozdział 1</h1><p>Treść książki.</p>";

  const fileBase = slugify(title);

  currentEditableBook = {
    fileName: fileBase,
    title,
    author,
    language,
    category,
    description,
    bookId: fileBase,
    repoCoverPath: `covers/${fileBase}.jpg`,
    epubPath: `books/${fileBase}.epub`,
    coverDataUrl: "",
    illustrationDataUrl: "",
    chapters: [
      {
        id: "chapter_1",
        href: "chapter_1.xhtml",
        fullPath: "OEBPS/chapter_1.xhtml",
        title: firstChapterTitle,
        content: wrapChapterHtml(firstChapterTitle, firstChapterHtml)
      }
    ]
  };

  openBookEditor();
  openTab("metadata");
});

exportEpubBtn?.addEventListener("click", async () => {
  if (!currentEditableBook) return;

  syncFormToBook();
  saveCurrentChapterIfPossible();

  const zip = new JSZip();

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  const oebps = zip.folder("OEBPS");
  const images = oebps.folder("images");

  let coverManifestItem = "";
  let coverMeta = "";

  if (currentEditableBook.coverDataUrl && currentEditableBook.coverDataUrl.startsWith("data:")) {
    const coverData = parseDataUrl(currentEditableBook.coverDataUrl);
    images.file(`cover.${coverData.extension}`, coverData.base64, { base64: true });
    coverManifestItem = `<item id="cover-image" href="images/cover.${coverData.extension}" media-type="${coverData.mime}"/>`;
    coverMeta = `<meta name="cover" content="cover-image"/>`;
  }

  let illustrationManifestItem = "";
  if (currentEditableBook.illustrationDataUrl && currentEditableBook.illustrationDataUrl.startsWith("data:")) {
    const imageData = parseDataUrl(currentEditableBook.illustrationDataUrl);
    images.file(`illustration.${imageData.extension}`, imageData.base64, { base64: true });
    illustrationManifestItem = `<item id="illustration-image" href="images/illustration.${imageData.extension}" media-type="${imageData.mime}"/>`;

    currentEditableBook.chapters = currentEditableBook.chapters.map(ch => ({
      ...ch,
      content: ch.content
        .replaceAll('src="images/illustration.jpg"', `src="images/illustration.${imageData.extension}"`)
        .replaceAll("src='images/illustration.jpg'", `src="images/illustration.${imageData.extension}"`)
    }));
  }

  currentEditableBook.chapters.forEach(chapter => {
    oebps.file(chapter.href, chapter.content);
  });

  oebps.file("toc.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Spis treści</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Spis treści</h1>
    <ol>
      ${currentEditableBook.chapters.map(ch => `<li><a href="${ch.href}">${escapeXml(ch.title)}</a></li>`).join("")}
    </ol>
  </nav>
</body>
</html>`);

  const manifestChapters = currentEditableBook.chapters
    .map(ch => `<item id="${ch.id}" href="${ch.href}" media-type="application/xhtml+xml"/>`)
    .join("\n");

  const spineItems = currentEditableBook.chapters
    .map(ch => `<itemref idref="${ch.id}"/>`)
    .join("\n");

  oebps.file("content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${crypto.randomUUID()}</dc:identifier>
    <dc:title>${escapeXml(currentEditableBook.title)}</dc:title>
    <dc:creator>${escapeXml(currentEditableBook.author)}</dc:creator>
    <dc:language>${escapeXml(currentEditableBook.language)}</dc:language>
    ${coverMeta}
  </metadata>
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${manifestChapters}
    ${coverManifestItem}
    ${illustrationManifestItem}
  </manifest>
  <spine>
    ${spineItems}
  </spine>
</package>`);

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${currentEditableBook.fileName}.epub`);
});

generateLibraryEntryBtn?.addEventListener("click", () => {
  if (!currentEditableBook) return;

  syncFormToBook();
  saveCurrentChapterIfPossible();

  const entry = {
    id: currentEditableBook.bookId || slugify(currentEditableBook.title),
    title: currentEditableBook.title,
    author: currentEditableBook.author,
    language: currentEditableBook.language,
    category: currentEditableBook.category,
    epub: `books/${currentEditableBook.fileName}.epub`,
    cover: coverRepoPath.value.trim() || `covers/${currentEditableBook.fileName}.jpg`,
    description: currentEditableBook.description
  };

  libraryEntryOutput.value = JSON.stringify(entry, null, 2);
  openTab("export");
});

copyLibraryEntryBtn?.addEventListener("click", async () => {
  const text = libraryEntryOutput.value.trim();
  if (!text) {
    alert("Najpierw wygeneruj wpis.");
    return;
  }

  try {
    await copyText(text);
    alert("Wpis został skopiowany.");
  } catch (error) {
    alert("Nie udało się skopiować wpisu.");
    console.error(error);
  }
});

saveDraftBtn?.addEventListener("click", () => {
  if (!currentEditableBook) {
    alert("Brak książki do zapisania.");
    return;
  }

  syncFormToBook();
  saveCurrentChapterIfPossible();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentEditableBook));
  alert("Wersja robocza została zapisana.");
});

loadDraftBtn?.addEventListener("click", () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    alert("Brak zapisanej wersji roboczej.");
    return;
  }

  try {
    currentEditableBook = JSON.parse(raw);
    openBookEditor();
    openTab("metadata");
  } catch (error) {
    alert("Nie udało się wczytać wersji roboczej.");
    console.error(error);
  }
});

clearDraftBtn?.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  alert("Usunięto wersję roboczą.");
});

function syncFormToBook() {
  if (!currentEditableBook) return;

  currentEditableBook.title = metaTitle.value.trim() || "Bez tytułu";
  currentEditableBook.author = metaAuthor.value.trim() || "Nieznany autor";
  currentEditableBook.language = metaLang.value.trim() || "pl";
  currentEditableBook.category = metaCategory.value.trim() || "";
  currentEditableBook.fileName = slugify(metaFileName.value.trim() || currentEditableBook.title);
  currentEditableBook.bookId = slugify(metaBookId.value.trim() || currentEditableBook.title);
  currentEditableBook.repoCoverPath = coverRepoPath.value.trim() || `covers/${currentEditableBook.fileName}.jpg`;
  currentEditableBook.description = metaDescription.value.trim() || "";
}

function wrapChapterHtml(title, bodyHtml) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(title)}</title>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

function extractBodyContent(fullHtml = "") {
  const match = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1].trim() : fullHtml;
}

async function findOpfPath(zip) {
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) throw new Error("Brak META-INF/container.xml");

  const containerText = await containerFile.async("string");
  const parser = new DOMParser();
  const xml = parser.parseFromString(containerText, "application/xml");
  const rootFile = xml.querySelector("rootfile");
  if (!rootFile) throw new Error("Brak rootfile w container.xml");

  return rootFile.getAttribute("full-path");
}

function getText(doc, selector) {
  const node = doc.querySelector(selector);
  return node?.textContent?.trim() || "";
}

function extractChapterTitle(content) {
  const match =
    content.match(/<h1[^>]*>(.*?)<\/h1>/i) ||
    content.match(/<title[^>]*>(.*?)<\/title>/i);

  return match ? stripHtml(match[1]) : "";
}

function getExtension(filename = "") {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "jpg";
}

function getFileNameFromPath(path = "") {
  return path.split("/").pop() || "book.epub";
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) {
    throw new Error("Nieprawidłowy data URL");
  }

  const mime = match[1];
  const base64 = match[2];

  let extension = "bin";
  if (mime === "image/jpeg") extension = "jpg";
  if (mime === "image/png") extension = "png";
  if (mime === "image/webp") extension = "webp";
  if (mime === "image/gif") extension = "gif";

  return { mime, base64, extension };
}
