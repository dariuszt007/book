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
const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
const closeReaderBtn = document.getElementById("closeReaderBtn");
const toggleUiZone = document.getElementById("toggleUiZone");

const readerTopBar = document.getElementById("readerTopBar");
const readerBottomBar = document.getElementById("readerBottomBar");

const readerSettingsBar = document.getElementById("readerSettingsBar");
const readerLibraryPanel = document.getElementById("readerLibraryPanel");
const tocPanel = document.getElementById("tocPanel");
const tocList = document.getElementById("tocList");

const themeSelect = document.getElementById("themeSelect");
const spreadSelect = document.getElementById("spreadSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const marginSelect = document.getElementById("marginSelect");

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

async function openBook(bookMeta) {
  currentBookMeta = bookMeta;
  readerBookTitle.textContent = bookMeta.title || "Bez tytułu";
  readerBookAuthor.textContent = bookMeta.author || "Nieznany autor";

  libraryPage.classList.add("hidden");
  readerScreen.classList.remove("hidden");
  menuDrawer.classList.add("hidden");
  readerSettingsBar.classList.add("hidden");
  readerLibraryPanel.classList.add("hidden");
  tocPanel.classList.add("hidden");
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

    viewer.innerHTML = "";

    rendition = currentBook.renderTo("viewer", {
      width: viewer.clientWidth || window.innerWidth,
      height: viewer.clientHeight || window.innerHeight,
      spread: currentSpread,
      flow: "paginated",
      manager: "default"
    });

    applyReaderSettings();

    const savedLocation = localStorage.getItem(getLocationStorageKey(bookMeta.id));
    await rendition.display(savedLocation || undefined);

    currentBook.ready.then(() => {
      loadTableOfContents();
      setTimeout(() => rendition?.resize(), 100);
    });

    rendition.on("relocated", (location) => {
      if (location?.start?.cfi) {
        localStorage.setItem(getLocationStorageKey(bookMeta.id), location.start.cfi);
      }

      const percentage = location?.start?.percentage || 0;
      readingProgressText.textContent = `Postęp: ${Math.round(percentage * 100)}%`;
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

function applyReaderSettings() {
  if (!rendition) return;

  rendition.themes.default({
    body: {
      background:
        currentTheme === "dark"
          ? "#111827"
          : currentTheme === "sepia"
          ? "#f4ecd8"
          : "#ffffff",
      color:
        currentTheme === "dark"
          ? "#f9fafb"
          : currentTheme === "sepia"
          ? "#3f2f1d"
          : "#111827",
      "font-family": "Georgia, serif",
      "line-height": "1.8",
      padding: `${currentMargin}px`
    },
    a: {
      color: currentTheme === "dark" ? "#93c5fd" : "#2563eb"
    }
  });

  rendition.themes.fontSize(`${currentFontSize}%`);

  try {
    rendition.spread(currentSpread);
  } catch (error) {
    console.warn(error);
  }

  setTimeout(() => rendition?.resize(), 100);
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

    viewer.innerHTML = "";

    rendition = currentBook.renderTo("viewer", {
      width: viewer.clientWidth || window.innerWidth,
      height: viewer.clientHeight || window.innerHeight,
      spread: currentSpread,
      flow: "paginated",
      manager: "default"
    });

    applyReaderSettings();
    await rendition.display(savedLocation);

    rendition.on("relocated", (location) => {
      if (location?.start?.cfi) {
        localStorage.setItem(getLocationStorageKey(currentBookMeta.id), location.start.cfi);
      }

      const percentage = location?.start?.percentage || 0;
      readingProgressText.textContent = `Postęp: ${Math.round(percentage * 100)}%`;
    });

    currentBook.ready.then(() => {
      loadTableOfContents();
      setTimeout(() => rendition?.resize(), 100);
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
  readerSettingsBar.classList.add("hidden");
  readerLibraryPanel.classList.add("hidden");
  tocPanel.classList.add("hidden");

  if (section) {
    section.classList.remove("hidden");
  }
}

function toggleUi() {
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

prevPageBtn?.addEventListener("click", () => rendition?.prev());
nextPageBtn?.addEventListener("click", () => rendition?.next());

openMenuBtn?.addEventListener("click", () => {
  menuDrawer.classList.remove("hidden");
});

closeMenuBtn?.addEventListener("click", () => {
  menuDrawer.classList.add("hidden");
});

toggleSettingsBtn?.addEventListener("click", () => {
  showOnlySection(readerSettingsBar);
});

toggleLibraryBtn?.addEventListener("click", () => {
  showOnlySection(readerLibraryPanel);
});

toggleTocBtn?.addEventListener("click", () => {
  showOnlySection(tocPanel);
});

closeReaderBtn?.addEventListener("click", closeReader);

toggleUiZone?.addEventListener("click", toggleUi);

themeSelect?.addEventListener("change", () => {
  currentTheme = themeSelect.value;
  applyReaderSettings();
});

fontSizeSelect?.addEventListener("change", () => {
  currentFontSize = Number(fontSizeSelect.value);
  applyReaderSettings();
});

marginSelect?.addEventListener("change", () => {
  currentMargin = Number(marginSelect.value);
  applyReaderSettings();
});

spreadSelect?.addEventListener("change", async () => {
  currentSpread = spreadSelect.value;
  await rebuildRendition();
});

window.addEventListener("resize", debounce(() => {
  rendition?.resize();
}, 150));

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

loadLibrary();
