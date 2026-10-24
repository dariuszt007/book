const booksList = document.getElementById("booksList");
const readerBooksList = document.getElementById("readerBooksList");
const refreshLibraryBtn = document.getElementById("refreshLibraryBtn");
const searchBooksInput = document.getElementById("searchBooksInput");
const categoryFilterSelect = document.getElementById("categoryFilterSelect");
const authorFilterSelect = document.getElementById("authorFilterSelect");
const sortBooksSelect = document.getElementById("sortBooksSelect");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

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

const fontFamilySelect = document.getElementById("fontFamilySelect");
const pageTransitionSelect = document.getElementById("pageTransitionSelect");

const themeButtons = document.querySelectorAll(".theme-tile");

let libraryBooks = [];
let currentBookMeta = null;
let currentBook = null;
let rendition = null;

let currentTheme = "sepia";
let currentFontSize = 100;
let currentMargin = 20;
let currentSpread = "none";
let currentFontFamily = "serif";
let currentPageTransition = "none";
let uiVisible = true;

const READER_SETTINGS_KEY = "reader_settings_v1";

function saveReaderPreferences() {
  const payload = {
    theme: currentTheme,
    fontSize: currentFontSize,
    margin: currentMargin,
    spread: currentSpread,
    fontFamily: currentFontFamily,
    pageTransition: currentPageTransition
  };

  localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(payload));
}

function loadReaderPreferences() {
  try {
    const raw = localStorage.getItem(READER_SETTINGS_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);

    if (saved?.theme) currentTheme = saved.theme;
    if (typeof saved?.fontSize === "number") currentFontSize = saved.fontSize;
    if (typeof saved?.margin === "number") currentMargin = saved.margin;
    if (saved?.spread) currentSpread = saved.spread;
    if (saved?.fontFamily) currentFontFamily = saved.fontFamily;
    if (saved?.pageTransition) currentPageTransition = saved.pageTransition;
  } catch (error) {
    console.warn("Nie udało się wczytać ustawień czytnika:", error);
  }
}

function syncReaderControls() {
  if (fontFamilySelect) {
    fontFamilySelect.value = currentFontFamily;
  }

  if (pageTransitionSelect) {
    pageTransitionSelect.value = currentPageTransition;
  }
}

async function loadLibrary() {
  if (booksList) booksList.innerHTML = "<p>Ładowanie biblioteki...</p>";
  if (readerBooksList) readerBooksList.innerHTML = "<p>Ładowanie biblioteki...</p>";

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      libraryBooks = data;
    } else if (Array.isArray(data?.books)) {
      libraryBooks = data.books;
    } else {
      libraryBooks = [];
    }

    populateCategoryFilter(libraryBooks);
    populateAuthorFilter(libraryBooks);
    filterAndRenderBooks();
  } catch (error) {
    if (booksList) booksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    if (readerBooksList) readerBooksList.innerHTML = "<p>Nie udało się wczytać biblioteki.</p>";
    console.error("Błąd loadLibrary:", error);
  }
}

function populateCategoryFilter(books) {
  if (!categoryFilterSelect) return;

  const currentValue = categoryFilterSelect.value;

  const categories = [...new Set(
    books
      .map(book => (book?.category || "").toString().trim())
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
      .map(book => (book?.author || "").toString().trim())
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
    const title = (book?.title || "").toString();
    const author = (book?.author || "").toString();
    const category = (book?.category || "").toString();
    const description = (book?.description || "").toString();

    const matchesSearch = [title, author, category, description]
      .join(" ")
      .toLowerCase()
      .includes(q);

    const matchesCategory =
      !selectedCategory ||
      category.trim().toLowerCase() === selectedCategory;

    const matchesAuthor =
      !selectedAuthor ||
      author.trim().toLowerCase() === selectedAuthor;

    return matchesSearch && matchesCategory && matchesAuthor;
  });

  filtered.sort((a, b) => {
    const titleA = ((a?.title || "").toString()).trim();
    const titleB = ((b?.title || "").toString()).trim();
    const authorA = ((a?.author || "").toString()).trim();
    const authorB = ((b?.author || "").toString()).trim();

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

function resetFiltersAndSorting() {
  if (searchBooksInput) searchBooksInput.value = "";
  if (categoryFilterSelect) categoryFilterSelect.value = "";
  if (authorFilterSelect) authorFilterSelect.value = "";
  if (sortBooksSelect) sortBooksSelect.value = "title-asc";

  filterAndRenderBooks();
}

function renderBooks(books, container) {
  if (!container) return;

  if (!books.length) {
    container.innerHTML = "<p>Brak książek w bibliotece.</p>";
    return;
  }

  container.innerHTML = "";

  books.forEach(book => {
    const title = book?.title || "Bez tytułu";
    const author = book?.author || "Nieznany autor";
    const category = book?.category || "";
    const cover = book?.cover || "assets/no-cover.svg";

    const card = document.createElement("div");
    card.className = "book-card";
    card.innerHTML = `
      <img src="${cover}" alt="${escapeHtml(title)}" />
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(author)}</p>
        <p>${escapeHtml(category)}</p>
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

function getFontFamilyValue(fontKey) {
  switch (fontKey) {
    case "arial":
      return 'Arial, Helvetica, sans-serif';
    case "times":
      return '"Times New Roman", Times, serif';
    case "sans":
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case "klee":
      return '"Klee One", "Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif';
    case "shippori":
      return '"Shippori Mincho", "Hiragino Mincho ProN", "Yu Mincho", serif';
    case "bizud":
      return '"BIZ UDPGothic", "BIZ UDGothic", "Hiragino Sans", "Yu Gothic", sans-serif';
    case "notoserifjp":
      return '"Noto Serif JP", "Source Han Serif", "Hiragino Mincho ProN", "Yu Mincho", serif';
    case "serif":
    default:
      return 'Georgia, "Times New Roman", serif';
  }
}

function applyThemeSelectionUi() {
  themeButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === currentTheme);
  });

  spreadOneBtn?.classList.toggle("active", currentSpread === "none");
  spreadTwoBtn?.classList.toggle("active", currentSpread === "always");

  syncReaderControls();
}

function applyTransitionClass() {
  if (!viewer) return;

  viewer.classList.remove(
    "transition-none",
    "transition-slide",
    "transition-fade",
    "transition-book"
  );

  switch (currentPageTransition) {
    case "slide":
      viewer.classList.add("transition-slide");
      break;
    case "fade":
      viewer.classList.add("transition-fade");
      break;
    case "book":
      viewer.classList.add("transition-book");
      break;
    case "none":
    default:
      viewer.classList.add("transition-none");
      break;
  }
}

function applyReaderSettings() {
  if (!rendition) return;

  const theme = getThemeStyles(currentTheme);
  const selectedFontFamily = getFontFamilyValue(currentFontFamily);

  rendition.themes.default({
    body: {
      background: theme.background,
      color: theme.color,
      "font-family": selectedFontFamily,
      "line-height": "1.8",
      padding: `${currentMargin}px`,
      "word-break": "normal",
      "overflow-wrap": "break-word",
      "text-rendering": "optimizeLegibility",
      "-webkit-font-smoothing": "antialiased"
    },
    html: {
      background: theme.background
    },
    p: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    div: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    span: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    h1: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    h2: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    h3: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    h4: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    h5: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    h6: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    li: {
      color: theme.color,
      "font-family": selectedFontFamily
    },
    blockquote: {
      color: theme.color,
      "font-family": selectedFontFamily
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

  applyTransitionClass();
  applyThemeSelectionUi();
  saveReaderPreferences();

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
  readerBookTitle.textContent = bookMeta?.title || "Bez tytułu";
  readerBookAuthor.textContent = bookMeta?.author || "Nieznany autor";

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
    const epubPath = bookMeta?.epub;
    if (!epubPath) {
      throw new Error("Brak ścieżki EPUB w danych książki.");
    }

    const response = await fetch(`${epubPath}?v=${Date.now()}`);
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
        <p><strong>Plik:</strong> ${bookMeta?.epub || "brak"}</p>
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
  if (!tocList) return;

  tocList.innerHTML = "";

  function normalizeLabel(value) {
    return (value || "").toString().replace(/\s+/g, " ").trim();
  }

  function isGoodLabel(text) {
    const value = normalizeLabel(text);
    if (!value) return false;
    if (/^rozdział\s+\d+$/i.test(value)) return false;
    if (/^(chap|chapter|part|section|sec|item|file|nav|toc)\s*\d*$/i.test(value)) return false;
    if (/this page contains the following errors/i.test(value)) return false;
    if (/parsererror/i.test(value)) return false;
    return true;
  }

  function flattenTocItems(items, level = 0, output = []) {
    if (!Array.isArray(items)) return output;

    items.forEach(item => {
      const label = normalizeLabel(
        item?.label ||
        item?.title ||
        item?.text ||
        item?.name ||
        ""
      );

      const href = (item?.href || item?.url || "").toString().trim();

      if (label || href) {
        output.push({
          label,
          href,
          level
        });
      }

      if (Array.isArray(item?.subitems) && item.subitems.length) {
        flattenTocItems(item.subitems, level + 1, output);
      }

      if (Array.isArray(item?.children) && item.children.length) {
        flattenTocItems(item.children, level + 1, output);
      }
    });

    return output;
  }

  const navigationCandidates = [
    currentBook?.navigation?.toc,
    currentBook?.loaded?.navigation?.toc,
    currentBook?.book?.navigation?.toc,
    currentBook?.package?.navigation?.toc
  ];

  let tocFromNavigation = [];

  for (const candidate of navigationCandidates) {
    if (Array.isArray(candidate) && candidate.length) {
      tocFromNavigation = flattenTocItems(candidate);
      if (tocFromNavigation.length) break;
    }
  }

  const validNavigationItems = tocFromNavigation.filter(item => {
    return isGoodLabel(item.label) && item.href;
  });

  if (validNavigationItems.length) {
    tocList.innerHTML = "";

    validNavigationItems.forEach(item => {
      const entry = document.createElement("button");
      entry.className = "toc-item";
      entry.textContent = item.label;
      entry.style.marginLeft = `${item.level * 12}px`;

      entry.addEventListener("click", async () => {
        try {
          await rendition?.display(item.href);
          menuDrawer.classList.add("hidden");
        } catch (error) {
          console.error("Błąd otwierania TOC:", error, item);
        }
      });

      tocList.appendChild(entry);
    });

    return;
  }

  const spineItems =
    currentBook?.spine?.spineItems ||
    currentBook?.spine?.items ||
    [];

  const contentItems = spineItems.filter(item => {
    const href = (item?.href || item?.url || "").toString().trim();
    if (!href) return false;
    if (/nav|toc/i.test(href)) return false;
    return true;
  });

  if (!contentItems.length) {
    tocList.innerHTML = "<p>Brak spisu treści.</p>";
    return;
  }

  tocList.innerHTML = "";

  contentItems.forEach((item, index) => {
    const href = (item?.href || item?.url || "").toString().trim();
    const fallbackLabel = `Rozdział ${index + 1}`;

    const entry = document.createElement("button");
    entry.className = "toc-item";
    entry.textContent = fallbackLabel;

    entry.addEventListener("click", async () => {
      try {
        await rendition?.display(href);
        menuDrawer.classList.add("hidden");
      } catch (error) {
        console.error("Błąd otwierania fallback TOC:", error, item);
      }
    });

    tocList.appendChild(entry);
  });
}

function setupSwipeNavigation() {
  if (!viewer) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  viewer.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  viewer.addEventListener("touchend", (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    touchEndX = touch.clientX;
    touchEndY = touch.clientY;

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) < 50) return;
    if (Math.abs(dy) > 80) return;

    if (dx < 0) {
      rendition?.next();
    } else {
      rendition?.prev();
    }
  }, { passive: true });
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

authorFilterSelect?.addEventListener("change", () => {
  filterAndRenderBooks();
});

sortBooksSelect?.addEventListener("change", () => {
  filterAndRenderBooks();
});

resetFiltersBtn?.addEventListener("click", () => {
  resetFiltersAndSorting();
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
  saveReaderPreferences();
  await rebuildRendition();
});

spreadTwoBtn?.addEventListener("click", async () => {
  currentSpread = "always";
  applyThemeSelectionUi();
  saveReaderPreferences();
  await rebuildRendition();
});

fontFamilySelect?.addEventListener("change", () => {
  currentFontFamily = fontFamilySelect.value || "serif";
  applyReaderSettings();
});

pageTransitionSelect?.addEventListener("change", () => {
  currentPageTransition = pageTransitionSelect.value || "none";
  applyTransitionClass();
  saveReaderPreferences();
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

loadReaderPreferences();
applyThemeSelectionUi();
syncReaderControls();
applyTransitionClass();
setupSwipeNavigation();
loadLibrary();
