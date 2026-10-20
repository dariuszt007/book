const booksList = document.getElementById("booksList");
const readerBooksList = document.getElementById("readerBooksList");
const refreshLibraryBtn = document.getElementById("refreshLibraryBtn");
const searchBooksInput = document.getElementById("searchBooksInput");

const libraryPage = document.getElementById("libraryPage");
const readerScreen = document.getElementById("readerScreen");

const readerBookTitle = document.getElementById("readerBookTitle");
const readerBookAuthor = document.getElementById("readerBookAuthor");

const viewer = document.getElementById("viewer");
const readingProgressText = document.getElementById("readingProgressText");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");

const themeSelect = document.getElementById("themeSelect");
const spreadSelect = document.getElementById("spreadSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const marginSelect = document.getElementById("marginSelect");

const toggleTocBtn = document.getElementById("toggleTocBtn");
const toggleLibraryBtn = document.getElementById("toggleLibraryBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const closeReaderBtn = document.getElementById("closeReaderBtn");

const tocPanel = document.getElementById("tocPanel");
const tocList = document.getElementById("tocList");
const readerLibraryPanel = document.getElementById("readerLibraryPanel");
const hideLibraryBtn = document.getElementById("hideLibraryBtn");
const hideTocBtn = document.getElementById("hideTocBtn");

let libraryBooks = [];
let currentBookMeta = null;
let currentBook = null;
let rendition = null;

let currentTheme = "light";
let currentFontSize = 100;
let currentMargin = 20;
let currentSpread = "auto";

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
      <img src="${book.cover || 'assets/no-cover.svg'}" alt="${escapeHtml(book.title)}" />
      <div>
        <h3>${escapeHtml(book.title)}</h3>
        <p>${escapeHtml(book.author || "Nieznany autor")}</p>
        <p>${escapeHtml(book.category || "")}</p>
        <p>${escapeHtml(book.description || "")}</p>
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
  tocPanel.classList.add("hidden");
  readerLibraryPanel.classList.add("hidden");
  tocList.innerHTML = "";
  viewer.innerHTML = "";

  try {
    currentBook = ePub(bookMeta.epub);

    rendition = currentBook.renderTo("viewer", {
      width: "100%",
      height: "100%",
      spread: currentSpread,
      flow: "paginated",
      manager: "default"
    });

    registerThemes();
    applyReaderSettings();

    const savedLocation = localStorage.getItem(getLocationStorageKey(bookMeta.id));

    await rendition.display(savedLocation || undefined);

    currentBook.ready.then(() => {
      loadTableOfContents();
    });

    rendition.on("relocated", (location) => {
      if (location?.start?.cfi) {
        localStorage.setItem(getLocationStorageKey(bookMeta.id), location.start.cfi);
      }

      const percentage = location?.start?.percentage || 0;
      const percentText = Math.round(percentage * 100);
      readingProgressText.textContent = `Postęp: ${percentText}%`;
    });

  } catch (error) {
    viewer.innerHTML = `
      <div style="padding:32px;color:#111827;">
        <h2>Nie udało się otworzyć książki</h2>
        <p>Sprawdź, czy ścieżka EPUB w <code>data/library.json</code> jest poprawna i czy plik ma rozszerzenie <code>.epub</code>.</p>
      </div>
    `;
    console.error(error);
  }
}

function registerThemes() {
  if (!rendition) return;

  rendition.themes.register("light", {
    body: {
      background: "#ffffff",
      color: "#111827",
      "font-family": "Georgia, serif",
      "line-height": "1.8",
      padding: `${currentMargin}px`
    },
    p: {
      "margin-bottom": "1em"
    }
  });

  rendition.themes.register("sepia", {
    body: {
      background: "#f4ecd8",
      color: "#3f2f1d",
      "font-family": "Georgia, serif",
      "line-height": "1.8",
      padding: `${currentMargin}px`
    },
    p: {
      "margin-bottom": "1em"
    }
  });

  rendition.themes.register("dark", {
    body: {
      background: "#111827",
      color: "#f9fafb",
      "font-family": "Georgia, serif",
      "line-height": "1.8",
      padding: `${currentMargin}px`
    },
    a: {
      color: "#93c5fd"
    },
    p: {
      "margin-bottom": "1em"
    }
  });
}

function applyReaderSettings() {
  if (!rendition) return;

  registerThemes();
  rendition.themes.select(currentTheme);
  rendition.themes.fontSize(`${currentFontSize}%`);

  try {
    rendition.spread(currentSpread);
  } catch (e) {
    console.warn("Nie udało się ustawić spread", e);
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
      if (rendition) {
        await rendition.display(item.href);
        tocPanel.classList.add("hidden");
      }
    });

    tocList.appendChild(node);
  });
}

function closeReader() {
  readerScreen.classList.add("hidden");
  libraryPage.classList.remove("hidden");
}

function getLocationStorageKey(bookId) {
  return `reader_location_${bookId}`;
}

refreshLibraryBtn?.addEventListener("click", loadLibrary);

searchBooksInput?.addEventListener("input", () => {
  const q = searchBooksInput.value.trim().toLowerCase();

  const filtered = libraryBooks.filter(book => {
    return [
      book.title,
      book.author,
      book.category,
      book.description
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  renderBooks(filtered, booksList);
  renderBooks(filtered, readerBooksList);
});

prevPageBtn?.addEventListener("click", () => rendition?.prev());
nextPageBtn?.addEventListener("click", () => rendition?.next());

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

  if (!currentBookMeta) return;
  const savedLocation = rendition?.currentLocation()?.start?.cfi || null;

  viewer.innerHTML = "";

  currentBook = ePub(currentBookMeta.epub);
  rendition = currentBook.renderTo("viewer", {
    width: "100%",
    height: "100%",
    spread: currentSpread,
    flow: "paginated",
    manager: "default"
  });

  registerThemes();
  applyReaderSettings();

  await rendition.display(savedLocation || undefined);

  rendition.on("relocated", (location) => {
    if (location?.start?.cfi) {
      localStorage.setItem(getLocationStorageKey(currentBookMeta.id), location.start.cfi);
    }

    const percentage = location?.start?.percentage || 0;
    const percentText = Math.round(percentage * 100);
    readingProgressText.textContent = `Postęp: ${percentText}%`;
  });

  currentBook.ready.then(() => {
    loadTableOfContents();
  });
});

toggleTocBtn?.addEventListener("click", () => {
  tocPanel.classList.toggle("hidden");
  readerLibraryPanel.classList.add("hidden");
});

toggleLibraryBtn?.addEventListener("click", () => {
  readerLibraryPanel.classList.toggle("hidden");
  tocPanel.classList.add("hidden");
});

hideLibraryBtn?.addEventListener("click", () => {
  readerLibraryPanel.classList.add("hidden");
});

hideTocBtn?.addEventListener("click", () => {
  tocPanel.classList.add("hidden");
});

fullscreenBtn?.addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    await readerScreen.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
});

closeReaderBtn?.addEventListener("click", closeReader);

document.addEventListener("keydown", (event) => {
  if (readerScreen.classList.contains("hidden")) return;

  if (event.key === "ArrowLeft") rendition?.prev();
  if (event.key === "ArrowRight") rendition?.next();
  if (event.key === "Escape") {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      closeReader();
    }
  }
});

loadLibrary();
