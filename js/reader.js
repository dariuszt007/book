const booksList = document.getElementById("booksList");
const readerBooksList = document.getElementById("readerBooksList");
const refreshLibraryBtn = document.getElementById("refreshLibraryBtn");
const searchBooksInput = document.getElementById("searchBooksInput");
const categoryFilterSelect = document.getElementById("categoryFilterSelect");
const authorFilterSelect = document.getElementById("authorFilterSelect");
const sortBooksSelect = document.getElementById("sortBooksSelect");

const categoryFilterSelect = document.getElementById("categoryFilterSelect");

const libraryPage = document.getElementById("libraryPage");
const readerScreen = document.getElementById("readerScreen");

const readerBookTitle = document.getElementById("readerBookTitle");
const readerBookAuthor = document.getElementById("readerBookAuthor");
const readingProgressText = document.getElementById("readingProgressText");

const viewer = document.getElementById("viewer");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

const openMenuBtn = document.getElementById("openMenuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const menuDrawer = document.getElementById("menuDrawer");

const toggleLibraryBtn = document.getElementById("toggleLibraryBtn");
const toggleTocBtn = document.getElementById("toggleTocBtn");
const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
const closeReaderBtn = document.getElementById("closeReaderBtn");
const toggleUiZone = document.getElementById("toggleUiZone");

const readerLibraryPanel = document.getElementById("readerLibraryPanel");
const tocPanel = document.getElementById("tocPanel");
const readerSettingsPanel = document.getElementById("readerSettingsPanel");
const tocList = document.getElementById("tocList");

const fontMinusBtn = document.getElementById("fontMinusBtn");
const fontPlusBtn = document.getElementById("fontPlusBtn");
const spreadOneBtn = document.getElementById("spreadOneBtn");
const spreadTwoBtn = document.getElementById("spreadTwoBtn");

const themeButtons = document.querySelectorAll(".theme-tile");

let libraryBooks = [];
let currentBookMeta = null;
let currentBook = null;
let rendition = null;

let currentTheme = "sepia";
let currentFontSize = 100;
let currentMargin = 20;
let currentSpread = "none";
let uiVisible = true;

async function loadLibrary() {
  booksList.innerHTML = "<p>Ładowanie biblioteki...</p>";
  readerBooksList.innerHTML = "<p>Ładowanie biblioteki...</p>";

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`);
    const data = await response.json();
    libraryBooks = data.books || [];

    populateCategoryFilter(libraryBooks);
    populateAuthorFilter(libraryBooks);
    filterAndRenderBooks();
  } catch (error) {
    booksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    readerBooksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    console.error(error);
  }
}

function populateCategoryFilter(books) {
  if (!categoryFilterSelect) return;

  const currentValue = categoryFilterSelect.value;

  const categories = [...new Set(
    books
      .map(book => (book.category || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base" }));

  categoryFilterSelect.innerHTML = `<option value="">Wszystkie kategorie</option>`;

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilterSelect.appendChild(option);
  });

  if (categories.includes(currentValue)) {
    categoryFilterSelect.value = currentValue;
  } else {
    categoryFilterSelect.value = "";
  }
}

function populateAuthorFilter(books) {
  if (!authorFilterSelect) return;

  const currentValue = authorFilterSelect.value;

  const authors = [...new Set(
    books
      .map(book => (book.author || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base" }));

  authorFilterSelect.innerHTML = `<option value="">Wszyscy autorzy</option>`;

  authors.forEach(author => {
    const option = document.createElement("option");
    option.value = author;
    option.textContent = author;
    authorFilterSelect.appendChild(option);
  });

  if (authors.includes(currentValue)) {
    authorFilterSelect.value = currentValue;
  } else {
    authorFilterSelect.value = "";
  }
}

function filterAndRenderBooks() {
  const q = (searchBooksInput?.value || "").trim().toLowerCase();
  const selectedCategory = (categoryFilterSelect?.value || "").trim().toLowerCase();
  const selectedAuthor = (authorFilterSelect?.value || "").trim().toLowerCase();
  const sortValue = sortBooksSelect?.value || "title-asc";

  const filtered = libraryBooks.filter(book => {
    const matchesSearch = [book.title, book.author, book.category, book.description || ""]
      .join(" ")
      .toLowerCase()
      .includes(q);

    const matchesCategory =
      !selectedCategory ||
      (book.category || "").trim().toLowerCase() === selectedCategory;

    const matchesAuthor =
      !selectedAuthor ||
      (book.author || "").trim().toLowerCase() === selectedAuthor;

    return matchesSearch && matchesCategory && matchesAuthor;
  });

  filtered.sort((a, b) => {
    const titleA = (a.title || "").trim();
    const titleB = (b.title || "").trim();
    const authorA = (a.author || "").trim();
    const authorB = (b.author || "").trim();

    switch (sortValue) {
      case "title-desc":
        return titleB.localeCompare(titleA, "pl", { sensitivity: "base" });
      case "author-asc":
        return authorA.localeCompare(authorB, "pl", { sensitivity: "base" }) ||
          titleA.localeCompare(titleB, "pl", { sensitivity: "base" });
      case "author-desc":
        return authorB.localeCompare(authorA, "pl", { sensitivity: "base" }) ||
          titleA.localeCompare(titleB, "pl", { sensitivity: "base" });
      case "title-asc":
      default:
        return titleA.localeCompare(titleB, "pl", { sensitivity: "base" });
    }
  });

  renderBooks(filtered, booksList);
  renderBooks(filtered, readerBooksList);
}


function populateCategoryFilter(books) {
  if (!categoryFilterSelect) return;

  const currentValue = categoryFilterSelect.value;

  const categories = [...new Set(
    books
      .map(book => (book.category || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "pl", { sensitivity: "base" }));

  categoryFilterSelect.innerHTML = `<option value="">Wszystkie kategorie</option>`;

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilterSelect.appendChild(option);
  });

  if (categories.includes(currentValue)) {
    categoryFilterSelect.value = currentValue;
  } else {
    categoryFilterSelect.value = "";
  }
}

function filterAndRenderBooks() {
  const q = (searchBooksInput?.value || "").trim().toLowerCase();
  const selectedCategory = (categoryFilterSelect?.value || "").trim().toLowerCase();

  const filtered = libraryBooks.filter(book => {
    const matchesSearch = [book.title, book.author, book.category, book.description || ""]
      .join(" ")
      .toLowerCase()
      .includes(q);

    const matchesCategory =
      !selectedCategory ||
      (book.category || "").trim().toLowerCase() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  renderBooks(filtered, booksList);
  renderBooks(filtered, readerBooksList);
}

function renderBooks(books, container) {
  if (!books.length) {
    container.innerHTML = "<p>Brak książek w bibliotece.</p>";
    return;
  }

  container.innerHTML = "";

  books.forEach(book => {
    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img src="${book.cover || "assets/no-cover.svg"}" alt="${escapeHtml(book.title)}" />
      <div>
        <h3>${escapeHtml(book.title)}</h3>
        <p>${escapeHtml(book.author || "Nieznany autor")}</p>
        <p>${escapeHtml(book.category || "")}</p>
      </div>
    `;
    card.addEventListener("click", () => openBook(book));
    container.appendChild(card);
  });
}

function getViewerSize() {
  const rect = viewer.getBoundingClientRect();
  return {
    width: Math.max(320, Math.floor(rect.width || window.innerWidth || 390)),
    height: Math.max(420, Math.floor(rect.height || window.innerHeight || 700))
  };
}

function getThemeStyles(theme) {
  switch (theme) {
    case "night":
      return {
        background: "#2f3138",
        color: "#f3f4f6",
        link: "#93c5fd",
        fontFamily: "Georgia, serif"
      };
    case "console":
      return {
        background: "#101410",
        color: "#7CFC98",
        link: "#9effb6",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
      };
    case "day":
      return {
        background: "#ffffff",
        color: "#111827",
        link: "#2563eb",
        fontFamily: "Georgia, serif"
      };
    case "sepia":
    default:
      return {
        background: "#f4ecd8",
        color: "#3f2f1d",
        link: "#8b5e00",
        fontFamily: "Georgia, serif"
      };
  }
}

function applyThemeSelectionUi() {
  themeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === currentTheme);
  });

  spreadOneBtn?.classList.toggle("active", currentSpread === "none");
  spreadTwoBtn?.classList.toggle("active", currentSpread === "always");
}

function applyReaderSettings() {
  if (!rendition) return;

  const theme = getThemeStyles(currentTheme);

  rendition.themes.default({
    body: {
      background: theme.background,
      color: theme.color,
      "font-family": theme.fontFamily,
      "line-height": "1.8",
      padding: `${currentMargin}px`
    },
    p: {
      color: theme.color
    },
    div: {
      color: theme.color
    },
    span: {
      color: theme.color
    },
    h1: {
      color: theme.color
    },
    h2: {
      color: theme.color
    },
    h3: {
      color: theme.color
    },
    h4: {
      color: theme.color
    },
    h5: {
      color: theme.color
    },
    h6: {
      color: theme.color
    },
    li: {
      color: theme.color
    },
    blockquote: {
      color: theme.color
    },
    a: {
      color: theme.link
    }
  });

  rendition.themes.fontSize(`${currentFontSize}%`);

  try {
    rendition.spread(currentSpread);
  } catch (error) {
    console.warn(error);
  }

  applyThemeSelectionUi();

  requestAnimationFrame(() => {
    rendition?.resize();
  });
}

function bindRenditionEvents(bookId) {
  if (!rendition) return;

  rendition.on("relocated", (location) => {
    if (location?.start?.cfi) {
      localStorage.setItem(getLocationStorageKey(bookId), location.start.cfi);
    }

    const percentage = location?.start?.percentage || 0;
    readingProgressText.textContent = `Postęp: ${Math.round(percentage * 100)}%`;
  });
}

async function createRenditionFromBook(book, savedLocation) {
  const size = getViewerSize();

  viewer.innerHTML = "";

  rendition = book.renderTo("viewer", {
    width: size.width,
    height: size.height,
    spread: currentSpread,
    flow: "paginated",
    manager: "default"
  });

  applyReaderSettings();
  bindRenditionEvents(currentBookMeta.id);

  await rendition.display(savedLocation || undefined);

  requestAnimationFrame(() => {
    rendition?.resize();
    setTimeout(() => rendition?.resize(), 120);
  });
}

async function openBook(bookMeta) {
  currentBookMeta = bookMeta;
  readerBookTitle.textContent = bookMeta.title || "Bez tytułu";
  readerBookAuthor.textContent = bookMeta.author || "Nieznany autor";

  libraryPage.classList.add("hidden");
  readerScreen.classList.remove("hidden");
  menuDrawer.classList.add("hidden");
  readerLibraryPanel.classList.add("hidden");
  tocPanel.classList.add("hidden");
  readerSettingsPanel.classList.add("hidden");
  uiVisible = true;
  readerScreen.classList.remove("reader-ui-hidden");

  viewer.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;background:#f4ecd8;color:#3f2f1d;">Ładowanie książki...</div>`;

  try {
    const response = await fetch(`${bookMeta.epub}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    currentBook = ePub(arrayBuffer);

    const savedLocation = localStorage.getItem(getLocationStorageKey(bookMeta.id));

    await new Promise(resolve => requestAnimationFrame(resolve));
    await createRenditionFromBook(currentBook, savedLocation);

    currentBook.ready.then(() => {
      loadTableOfContents();
      requestAnimationFrame(() => rendition?.resize());
      setTimeout(() => rendition?.resize(), 160);
    });
  } catch (error) {
    console.error(error);
    viewer.innerHTML = `
      <div style="height:100%;padding:24px;background:#fff;color:#111827;overflow:auto;">
        <h2>Nie udało się otworzyć książki</h2>
        <p><strong>Plik:</strong> ${bookMeta.epub}</p>
        <p><strong>Błąd:</strong> ${error?.message || error}</p>
      </div>
    `;
  }
}

async function rebuildRendition() {
  if (!currentBookMeta) return;

  const savedLocation =
    rendition?.currentLocation()?.start?.cfi ||
    localStorage.getItem(getLocationStorageKey(currentBookMeta.id)) ||
    undefined;

  try {
    const response = await fetch(`${currentBookMeta.epub}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    currentBook = ePub(arrayBuffer);

    await new Promise(resolve => requestAnimationFrame(resolve));
    await createRenditionFromBook(currentBook, savedLocation);

    currentBook.ready.then(() => {
      loadTableOfContents();
      requestAnimationFrame(() => rendition?.resize());
      setTimeout(() => rendition?.resize(), 160);
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadTableOfContents() {
  if (!currentBook?.navigation?.toc) return;

  const toc = currentBook.navigation.toc || [];
  tocList.innerHTML = "";

  toc.forEach(item => {
    const node = document.createElement("div");
    node.className = "toc-item";
    node.textContent = item.label;
    node.addEventListener("click", async () => {
      await rendition.display(item.href);
      tocPanel.classList.add("hidden");
      menuDrawer.classList.add("hidden");
    });
    tocList.appendChild(node);
  });
}

function showOnlySection(section) {
  readerLibraryPanel.classList.add("hidden");
  tocPanel.classList.add("hidden");
  readerSettingsPanel.classList.add("hidden");

  if (section) {
    section.classList.remove("hidden");
  }
}

function toggleUi() {
  if (!menuDrawer.classList.contains("hidden")) return;

  uiVisible = !uiVisible;
  readerScreen.classList.toggle("reader-ui-hidden", !uiVisible);
}

function closeReader() {
  readerScreen.classList.add("hidden");
  libraryPage.classList.remove("hidden");
  menuDrawer.classList.add("hidden");
}

function getLocationStorageKey(bookId) {
  return `reader_location_${bookId}`;
}

refreshLibraryBtn?.addEventListener("click", loadLibrary);

searchBooksInput?.addEventListener("input", () => {
  filterAndRenderBooks();
});

categoryFilterSelect?.addEventListener("change", () => {
  filterAndRenderBooks();
});

prevPageBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  rendition?.prev();
});

nextPageBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  rendition?.next();
});

openMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDrawer.classList.remove("hidden");
});

closeMenuBtn?.addEventListener("click", () => {
  menuDrawer.classList.add("hidden");
});

toggleLibraryBtn?.addEventListener("click", () => {
  showOnlySection(readerLibraryPanel);
});

toggleTocBtn?.addEventListener("click", () => {
  showOnlySection(tocPanel);
});

toggleSettingsBtn?.addEventListener("click", () => {
  showOnlySection(readerSettingsPanel);
});

closeReaderBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  closeReader();
});

toggleUiZone?.addEventListener("click", toggleUi);

fontMinusBtn?.addEventListener("click", () => {
  currentFontSize = Math.max(80, currentFontSize - 10);
  applyReaderSettings();
});

fontPlusBtn?.addEventListener("click", () => {
  currentFontSize = Math.min(180, currentFontSize + 10);
  applyReaderSettings();
});

spreadOneBtn?.addEventListener("click", async () => {
  currentSpread = "none";
  applyThemeSelectionUi();
  await rebuildRendition();
});

spreadTwoBtn?.addEventListener("click", async () => {
  currentSpread = "always";
  applyThemeSelectionUi();
  await rebuildRendition();
});

themeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentTheme = btn.dataset.theme;
    applyReaderSettings();
  });
});

window.addEventListener("resize", debounce(() => {
  rendition?.resize();
  setTimeout(() => rendition?.resize(), 120);
}, 180));

document.addEventListener("keydown", (event) => {
  if (readerScreen.classList.contains("hidden")) return;

  if (event.key === "ArrowLeft") rendition?.prev();
  if (event.key === "ArrowRight") rendition?.next();
  if (event.key === "Escape") {
    if (!menuDrawer.classList.contains("hidden")) {
      menuDrawer.classList.add("hidden");
    } else {
      closeReader();
    }
  }
});

applyThemeSelectionUi();
loadLibrary();
