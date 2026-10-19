const refreshRepoBtn = document.getElementById("refreshRepoBtn");
const adminBooksList = document.getElementById("adminBooksList");
const epubUpload = document.getElementById("epubUpload");

const newBookTitle = document.getElementById("newBookTitle");
const newBookAuthor = document.getElementById("newBookAuthor");
const newBookLang = document.getElementById("newBookLang");
const newBookDescription = document.getElementById("newBookDescription");
const newBookCategory = document.getElementById("newBookCategory");
const newBookChapterTitle = document.getElementById("newBookChapterTitle");
const newBookChapterContent = document.getElementById("newBookChapterContent");
const createBookBtn = document.getElementById("createBookBtn");

const editorEmptyState = document.getElementById("editorEmptyState");
const editorArea = document.getElementById("editorArea");

const metaTitle = document.getElementById("metaTitle");
const metaAuthor = document.getElementById("metaAuthor");
const metaLang = document.getElementById("metaLang");
const metaFileName = document.getElementById("metaFileName");
const metaBookId = document.getElementById("metaBookId");
const metaCategory = document.getElementById("metaCategory");
const metaDescription = document.getElementById("metaDescription");

const coverUpload = document.getElementById("coverUpload");
const illustrationUpload = document.getElementById("illustrationUpload");
const coverPreview = document.getElementById("coverPreview");
const illustrationPreview = document.getElementById("illustrationPreview");
const coverRepoPath = document.getElementById("coverRepoPath");

const chaptersList = document.getElementById("chaptersList");
const addChapterBtn = document.getElementById("addChapterBtn");
const chapterSelect = document.getElementById("chapterSelect");
const chapterTitle = document.getElementById("chapterTitle");
const chapterContent = document.getElementById("chapterContent");
const saveChapterBtn = document.getElementById("saveChapterBtn");
const insertIllustrationBtn = document.getElementById("insertIllustrationBtn");

const exportEpubBtn = document.getElementById("exportEpubBtn");
const generateLibraryEntryBtn = document.getElementById("generateLibraryEntryBtn");
const copyLibraryEntryBtn = document.getElementById("copyLibraryEntryBtn");
const libraryEntryOutput = document.getElementById("libraryEntryOutput");

let libraryCache = [];
let currentEditableBook = null;

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
    const blob = await response.blob();
    const file = new File([blob], `${bookMeta.id || "book"}.epub`, {
      type: "application/epub+zip"
    });

    await importEpubFile(file, bookMeta);
  } catch (error) {
    alert("Nie udało się wczytać pliku EPUB z repo.");
    console.error(error);
  }
}

epubUpload?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  await importEpubFile(file);
});

async function importEpubFile(file, libraryMeta = null) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const packagePath = await findOpfPath(zip);
  const opfText = await zip.file(packagePath).async("string");
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
    mediaType: item.getAttribute("media-type")
  }));

  const spineRefs = [...opfDoc.querySelectorAll("spine > itemref")].map(item =>
    item.getAttribute("idref")
  );

  const basePath = packagePath.split("/").slice(0, -1).join("/");
  const chapters = [];

  for (const idref of spineRefs) {
    const manifestItem = manifestItems.find(item => item.id === idref);
    if (!manifestItem) continue;

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
    description: libraryMeta?.description || "",
    category: libraryMeta?.category || "",
    bookId: libraryMeta?.id || slugify(title),
    repoCoverPath: libraryMeta?.cover || `covers/${slugify(title)}.jpg`,
    epubPath: libraryMeta?.epub || `books/${file.name}`,
    coverDataUrl: libraryMeta?.cover || "",
    illustrationDataUrl: "",
    chapters
  };

  openEditor();
}

function openEditor() {
  editorEmptyState.classList.add("hidden");
  editorArea.classList.remove("hidden");

  metaTitle.value = currentEditableBook.title || "";
  metaAuthor.value = currentEditableBook.author || "";
  metaLang.value = currentEditableBook.language || "pl";
  metaFileName.value = currentEditableBook.fileName || "";
  metaBookId.value = currentEditableBook.bookId || "";
  metaCategory.value = currentEditableBook.category || "";
  metaDescription.value = currentEditableBook.description || "";
  coverRepoPath.value = currentEditableBook.repoCoverPath || "";

  coverPreview.src = currentEditableBook.coverDataUrl || "assets/no-cover.svg";
  illustrationPreview.src = currentEditableBook.illustrationDataUrl || "assets/no-cover.svg";

  renderChaptersList();
  renderChapterSelect();

  if (currentEditableBook.chapters.length > 0) {
    chapterSelect.value = "0";
    loadSelectedChapter();
  }

  libraryEntryOutput.value = "";
}

function renderChaptersList() {
  chaptersList.innerHTML = "";

  currentEditableBook.chapters.forEach((chapter, index) => {
    const item = document.createElement("div");
    item.className = "chapter-item";
    item.innerHTML = `<strong>${index + 1}.</strong> ${escapeHtml(chapter.title)}`;
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
  chapterContent.value = chapter.content || "";
}

chapterSelect?.addEventListener("change", loadSelectedChapter);

saveChapterBtn?.addEventListener("click", () => {
  if (!currentEditableBook) return;

  const index = Number(chapterSelect.value);
  const chapter = currentEditableBook.chapters[index];
  if (!chapter) return;

  chapter.title = chapterTitle.value.trim() || `Rozdział ${index + 1}`;
  chapter.content = chapterContent.value;

  renderChaptersList();
  renderChapterSelect();
  chapterSelect.value = String(index);

  alert("Rozdział został zapisany.");
});

addChapterBtn?.addEventListener("click", () => {
  if (!currentEditableBook) return;

  const nextIndex = currentEditableBook.chapters.length + 1;
  currentEditableBook.chapters.push({
    id: `chapter_${nextIndex}`,
    href: `chapter_${nextIndex}.xhtml`,
    fullPath: `OEBPS/chapter_${nextIndex}.xhtml`,
    title: `Rozdział ${nextIndex}`,
    content: `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Rozdział ${nextIndex}</title>
</head>
<body>
  <h1>Rozdział ${nextIndex}</h1>
  <p>Nowa treść rozdziału.</p>
</body>
</html>`
  });

  renderChaptersList();
  renderChapterSelect();
  chapterSelect.value = String(currentEditableBook.chapters.length - 1);
  loadSelectedChapter();
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

insertIllustrationBtn?.addEventListener("click", () => {
  if (!currentEditableBook?.illustrationDataUrl) {
    alert("Najpierw wgraj ilustrację.");
    return;
  }

  const tag = `<p><img src="images/illustration.jpg" alt="Ilustracja" style="max-width:100%;" /></p>`;
  chapterContent.value += `\n${tag}`;
});

createBookBtn?.addEventListener("click", () => {
  const title = newBookTitle.value.trim() || "Nowa książka";
  const author = newBookAuthor.value.trim() || "Nieznany autor";
  const language = newBookLang.value.trim() || "pl";
  const description = newBookDescription.value.trim() || "";
  const category = newBookCategory.value.trim() || "";
  const firstChapterTitle = newBookChapterTitle.value.trim() || "Rozdział 1";
  const firstChapterContent = newBookChapterContent.value.trim() || "<h1>Rozdział 1</h1><p>Treść książki.</p>";

  const fileBase = slugify(title);

  currentEditableBook = {
    fileName: fileBase,
    title,
    author,
    language,
    description,
    category,
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
        content: `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(firstChapterTitle)}</title>
</head>
<body>
  ${firstChapterContent}
</body>
</html>`
      }
    ]
  };

  openEditor();
});

exportEpubBtn?.addEventListener("click", async () => {
  if (!currentEditableBook) return;

  syncFormToBook();

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
    const coverBase64 = currentEditableBook.coverDataUrl.split(",")[1];
    images.file("cover.jpg", coverBase64, { base64: true });
    coverManifestItem = `<item id="cover-image" href="images/cover.jpg" media-type="image/jpeg"/>`;
    coverMeta = `<meta name="cover" content="cover-image"/>`;
  }

  let illustrationManifestItem = "";
  if (currentEditableBook.illustrationDataUrl && currentEditableBook.illustrationDataUrl.startsWith("data:")) {
    const illustrationBase64 = currentEditableBook.illustrationDataUrl.split(",")[1];
    images.file("illustration.jpg", illustrationBase64, { base64: true });
    illustrationManifestItem = `<item id="illustration-image" href="images/illustration.jpg" media-type="image/jpeg"/>`;
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

refreshRepoBtn?.addEventListener("click", loadAdminLibrary);

function syncFormToBook() {
  currentEditableBook.title = metaTitle.value.trim() || "Bez tytułu";
  currentEditableBook.author = metaAuthor.value.trim() || "Nieznany autor";
  currentEditableBook.language = metaLang.value.trim() || "pl";
  currentEditableBook.fileName = slugify(metaFileName.value.trim() || currentEditableBook.title);
  currentEditableBook.bookId = slugify(metaBookId.value.trim() || currentEditableBook.title);
  currentEditableBook.category = metaCategory.value.trim() || "";
  currentEditableBook.description = metaDescription.value.trim() || "";
  currentEditableBook.repoCoverPath = coverRepoPath.value.trim() || `covers/${currentEditableBook.fileName}.jpg`;

  const selectedIndex = Number(chapterSelect.value);
  if (currentEditableBook.chapters[selectedIndex]) {
    currentEditableBook.chapters[selectedIndex].title = chapterTitle.value.trim() || `Rozdział ${selectedIndex + 1}`;
    currentEditableBook.chapters[selectedIndex].content = chapterContent.value;
  }
}

async function findOpfPath(zip) {
  const containerText = await zip.file("META-INF/container.xml").async("string");
  const parser = new DOMParser();
  const xml = parser.parseFromString(containerText, "application/xml");
  return xml.querySelector("rootfile").getAttribute("full-path");
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

loadAdminLibrary();
