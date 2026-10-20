const booksList = document.getElementById("booksList");
const refreshLibraryBtn = document.getElementById("refreshLibraryBtn");
const searchBooksInput = document.getElementById("searchBooksInput");
const bookInfo = document.getElementById("bookInfo");
const viewer = document.getElementById("viewer");
const readerToolbar = document.getElementById("readerToolbar");
const readerStatus = document.getElementById("readerStatus");
const readingProgressText = document.getElementById("readingProgressText");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const decreaseFontBtn = document.getElementById("decreaseFontBtn");
const increaseFontBtn = document.getElementById("increaseFontBtn");
const themeSelect = document.getElementById("themeSelect");
const toggleTocBtn = document.getElementById("toggleTocBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const tocPanel = document.getElementById("tocPanel");
const tocList = document.getElementById("tocList");

let libraryBooks = [];
let currentBookMeta = null;
let currentBook = null;
let rendition = null;
let currentFontSize = 100;
let currentTheme = "light";

async function loadLibrary() {
  booksList.innerHTML = "<p>Ładowanie biblioteki...</p>";

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`);
    const data = await response.json();
    libraryBooks = data.books || [];
    renderBooks(libraryBooks);
  } catch (error) {
    booksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    console.error(error);
  }
}

function renderBooks(books) {
  if (!books.length) {
    booksList.innerHTML = "<p>Brak książek w bibliotece.</p>";
    return;
  }

  booksList.innerHTML = "";

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
    booksList.appendChild(card);
  });
}

async function openBook(bookMeta) {
  currentBookMeta = bookMeta;

  bookInfo.classList.remove("empty");
  bookInfo.innerHTML = `
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;">
      <img src="${bookMeta.cover || 'assets/no-cover.svg'}"
           alt="${escapeHtml(bookMeta.title)}"
           style="width:120px;height:170px;object-fit:cover;border-radius:10px;background:#fff;" />
      <div>
        <h2 style="margin-top:0;">${escapeHtml(bookMeta.title)}</h2>
        <p><strong>Autor:</strong> ${escapeHtml(bookMeta.author || "Nieznany")}</p>
        <p><strong>Język:</strong> ${escapeHtml(bookMeta.language || "-")}</p>
        <p><strong>Kategoria:</strong> ${escapeHtml(bookMeta.category || "-")}</p>
        <p>${escapeHtml(bookMeta.description || "")}</p>
      </div>
    </div>
  `;

  viewer.innerHTML = "";
  tocList.innerHTML = "";
  tocPanel.classList.add("hidden");

  try {
    currentBook = ePub(bookMeta.epub);
    rendition = currentBook.renderTo("viewer", {
      width: "100%",
      height: "72vh",
      spread: "auto",
      flow: "paginated"
    });

    registerThemes();
    applyTheme(currentTheme);
    rendition.themes.fontSize(`${currentFontSize}%`);

    const savedLocation = localStorage.getItem(getLocationStorageKey(bookMeta.id));
    await rendition.display(savedLocation || undefined);

    currentBook.ready.then(() => {
      loadTableOfContents();
    });

    rendition.on("relocated", (location) => {
      localStorage.setItem(getLocationStorageKey(bookMeta.id), location.start.cfi);

      const percentage = location?.start?.percentage || 0;
      const percentText = Math.round(percentage * 100);
      readingProgressText.textContent = `Postęp: ${percentText}%`;
    });

    readerToolbar.classList.remove("hidden");
    readerStatus.classList.remove("hidden");
  } catch (error) {
    viewer.innerHTML = `
      <div style="padding:24px;color:#111;">
        <h3>Nie udało się otworzyć EPUB</h3>
        <p>Sprawdź ścieżkę pliku, nazwę rozszerzenia i poprawność pliku EPUB.</p>
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
      "line-height": "1.8"
    }
  });

  rendition.themes.register("sepia", {
    body: {
      background: "#f4ecd8",
      color: "#3f2f1d",
      "font-family": "Georgia, serif",
      "line-height": "1.8"
    }
  });

  rendition.themes.register("dark", {
    body: {
      background: "#111827",
      color: "#f9fafb",
      "font-family": "Georgia, serif",
      "line-height": "1.8"
    }
  });
}

function applyTheme(themeName) {
  currentTheme = themeName;
  if (!rendition) return;
  rendition.themes.select(themeName);
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
      }
    });
    tocList.appendChild(node);
  });
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

  renderBooks(filtered);
});

prevPageBtn?.addEventListener("click", () => rendition?.prev());
nextPageBtn?.addEventListener("click", () => rendition?.next());

increaseFontBtn?.addEventListener("click", () => {
  if (!rendition) return;
  currentFontSize += 10;
  rendition.themes.fontSize(`${currentFontSize}%`);
});

decreaseFontBtn?.addEventListener("click", () => {
  if (!rendition) return;
  currentFontSize = Math.max(70, currentFontSize - 10);
  rendition.themes.fontSize(`${currentFontSize}%`);
});

themeSelect?.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});

toggleTocBtn?.addEventListener("click", () => {
  tocPanel.classList.toggle("hidden");
});

fullscreenBtn?.addEventListener("click", async () => {
  const el = viewer;
  if (!document.fullscreenElement) {
    await el.requestFullscreen?.();
  } else {
    await document.exitFullscreen?.();
  }
});

loadLibrary();
