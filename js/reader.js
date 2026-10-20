const booksList = document.getElementById("booksList");
const readerBooksList = document.getElementById("readerBooksList");
const refreshLibraryBtn = document.getElementById("refreshLibraryBtn");
const searchBooksInput = document.getElementById("searchBooksInput");

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
const closeReaderBtn = document.getElementById("closeReaderBtn");
const toggleUiZone = document.getElementById("toggleUiZone");

const readerLibraryPanel = document.getElementById("readerLibraryPanel");
const tocPanel = document.getElementById("tocPanel");
const tocList = document.getElementById("tocList");

const openSettingsModalBtn = document.getElementById("openSettingsModalBtn");
const closeSettingsModalBtn = document.getElementById("closeSettingsModalBtn");
const settingsModal = document.getElementById("settingsModal");

const fontMinusBtn = document.getElementById("fontMinusBtn");
const fontPlusBtn = document.getElementById("fontPlusBtn");
const spreadOneBtn = document.getElementById("spreadOneBtn");
const spreadTwoBtn = document.getElementById("spreadTwoBtn");
const marginRange = document.getElementById("marginRange");

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
    renderBooks(libraryBooks, booksList);
    renderBooks(libraryBooks, readerBooksList);
  } catch (error) {
    booksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    readerBooksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    console.error(error);
  }
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
    case "dark":
      return {
        background: "#2f3138",
        color: "#f3f4f6",
        link: "#93c5fd"
      };
    case "paper":
      return {
        background: "#f7f1e3",
        color: "#2f241a",
        link: "#7c4f2a"
      };
    case "contrast":
      return {
        background: "#ffffff",
        color: "#000000",
        link: "#0033cc"
      };
    case "focus":
      return {
        background: "#fffdf5",
        color: "#222222",
        link: "#8b5e00"
      };
    case "light":
      return {
        background: "#ffffff",
        color: "#111827",
        link: "#2563eb"
      };
    case "sepia":
    default:
      return {
        background: "#f4ecd8",
        color: "#3f2f1d",
        link: "#8b5e00"
      };
  }
}

function applyThemeSelectionUi() {
  themeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === currentTheme);
  });
}

function applyReaderSettings() {
  if (!rendition) return;

  const theme = getThemeStyles(currentTheme);

  rendition.themes.default({
    body: {
      background: theme.background,
      color: theme.color,
      "font-family": "Georgia, serif",
      "line-height": "1.8",
      padding: `${currentMargin}px`
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
  settingsModal.classList.add("hidden");
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

  if (section) {
    section.classList.remove("hidden");
  }
}

function toggleUi() {
  if (!menuDrawer.classList.contains("hidden")) return;
  if (!settingsModal.classList.contains("hidden")) return;

  uiVisible = !uiVisible;
  readerScreen.classList.toggle("reader-ui-hidden", !uiVisible);
}

function closeReader() {
  readerScreen.classList.add("hidden");
  libraryPage.classList.remove("hidden");
  menuDrawer.classList.add("hidden");
  settingsModal.classList.add("hidden");
}

function getLocationStorageKey(bookId) {
  return `reader_location_${bookId}`;
}

refreshLibraryBtn?.addEventListener("click", loadLibrary);

searchBooksInput?.addEventListener("input", () => {
  const q = searchBooksInput.value.trim().toLowerCase();

  const filtered = libraryBooks.filter(book =>
    [book.title, book.author, book.category, book.description || ""]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );

  renderBooks(filtered, booksList);
  renderBooks(filtered, readerBooksList);
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

openSettingsModalBtn?.addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
});

closeSettingsModalBtn?.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

settingsModal?.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.add("hidden");
  }
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
  await rebuildRendition();
});

spreadTwoBtn?.addEventListener("click", async () => {
  currentSpread = "always";
  await rebuildRendition();
});

marginRange?.addEventListener("input", () => {
  currentMargin = Number(marginRange.value);
  applyReaderSettings();
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
    if (!settingsModal.classList.contains("hidden")) {
      settingsModal.classList.add("hidden");
    } else if (!menuDrawer.classList.contains("hidden")) {
      menuDrawer.classList.add("hidden");
    } else {
      closeReader();
    }
  }
});

applyThemeSelectionUi();
loadLibrary();
