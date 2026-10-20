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
const toggleSettingsBtn = document.getElementById("toggleSettingsBtn");
const readerSettingsBar = document.getElementById("readerSettingsBar");

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

let currentTheme = "sepia";
let currentFontSize = 100;
let currentMargin = 20;
let currentSpread = "none";

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
  readerSettingsBar.classList.add("hidden");
  tocPanel.classList.add("hidden");
  readerLibraryPanel.classList.add("hidden");
  tocList.innerHTML = "";
  viewer.innerHTML = `
    <div style="padding:24px;color:#111827;background:#fff;height:100%;overflow:auto;">
      <p>Ładowanie książki...</p>
    </div>
  `;

  try {
    console.log("Fetching EPUB:", bookMeta.epub);

    const response = await fetch(`${bookMeta.epub}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Nie udało się pobrać EPUB. HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log("EPUB fetched, size:", arrayBuffer.byteLength);

    currentBook = ePub(arrayBuffer);

    viewer.innerHTML = "";

    rendition = currentBook.renderTo("viewer", {
      width: viewer.clientWidth || window.innerWidth,
      height: viewer.clientHeight || 600,
      spread: currentSpread,
      flow: "paginated",
      manager: "default"
    });

    applyReaderSettings();

    const savedLocation = localStorage.getItem(getLocationStorageKey(bookMeta.id));

    await rendition.display(savedLocation || undefined);

    console.log("Rendition display done");

    currentBook.ready.then(() => {
      console.log("EPUB ready");
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
    console.error("EPUB open error:", error);

    viewer.innerHTML = `
      <div style="padding:24px;color:#111827;background:#fff;height:100%;overflow:auto;">
        <h2>Nie udało się otworzyć książki</h2>
        <p><strong>Plik:</strong> ${bookMeta.epub}</p>
        <p><strong>Błąd:</strong> ${error?.message || error}</p>
        <p>Sprawdź poprawność pliku EPUB oraz ścieżkę w <code>data/library.json</code>.</p>
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

  viewer.innerHTML = `
    <div style="padding:24px;color:#111827;background:#fff;height:100%;overflow:auto;">
      <p>Odświeżanie widoku książki...</p>
    </div>
  `;

  try {
    const response = await fetch(`${currentBookMeta.epub}?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Nie udało się pobrać EPUB. HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    currentBook = ePub(arrayBuffer);

    viewer.innerHTML = "";

    rendition = currentBook.renderTo("viewer", {
      width: viewer.clientWidth || window.innerWidth,
      height: viewer.clientHeight || 600,
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
    console.error("EPUB rebuild error:", error);

    viewer.innerHTML = `
      <div style="padding:24px;color:#111827;background:#fff;height:100%;overflow:auto;">
        <h2>Nie udało się odświeżyć książki</h2>
        <p><strong>Błąd:</strong> ${error?.message || error}</p>
      </div>
    `;
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

  const filtered = libraryBooks.filter(book =>
    [book.title, book.author, book.category, book.description]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );

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
  await rebuildRendition();
});

toggleSettingsBtn?.addEventListener("click", () => {
  readerSettingsBar.classList.toggle("hidden");
});

toggleLibraryBtn?.addEventListener("click", () => {
  readerLibraryPanel.classList.toggle("hidden");
  tocPanel.classList.add("hidden");
});

toggleTocBtn?.addEventListener("click", () => {
  tocPanel.classList.toggle("hidden");
  readerLibraryPanel.classList.add("hidden");
});

hideLibraryBtn?.addEventListener("click", () => {
  readerLibraryPanel.classList.add("hidden");
});

hideTocBtn?.addEventListener("click", () => {
  tocPanel.classList.add("hidden");
});

closeReaderBtn?.addEventListener("click", closeReader);

window.addEventListener("resize", debounce(() => {
  rendition?.resize();
}, 150));

document.addEventListener("keydown", (event) => {
  if (readerScreen.classList.contains("hidden")) return;

  if (event.key === "ArrowLeft") rendition?.prev();
  if (event.key === "ArrowRight") rendition?.next();
  if (event.key === "Escape") closeReader();
});

loadLibrary();
