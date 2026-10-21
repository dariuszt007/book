const readerBooksList = document.getElementById("readerBooksList");
const readerSearchInput = document.getElementById("readerSearchInput");
const readerCategoryFilterSelect = document.getElementById("readerCategoryFilterSelect");
const readerSortSelect = document.getElementById("readerSortSelect");
const readerResultsCount = document.getElementById("readerResultsCount");
const readerClearFiltersBtn = document.getElementById("readerClearFiltersBtn");

let libraryBooks = [];

function compareStringsLocale(a, b) {
  return String(a || "").localeCompare(String(b || ""), "pl", { sensitivity: "base" });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildReaderCategoryOptions(books) {
  const currentValue = readerCategoryFilterSelect.value || "";
  const categories = Array.from(
    new Set(
      books
        .map((book) => String(book.category || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => compareStringsLocale(a, b));

  readerCategoryFilterSelect.innerHTML = `<option value="">Wszystkie kategorie</option>`;

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    readerCategoryFilterSelect.appendChild(option);
  });

  readerCategoryFilterSelect.value = categories.includes(currentValue) ? currentValue : "";
}

function getFilteredReaderBooks() {
  const textQuery = readerSearchInput.value.trim().toLowerCase();
  const categoryQuery = readerCategoryFilterSelect.value.trim();
  const sortMode = readerSortSelect.value;

  let result = [...libraryBooks];

  if (textQuery) {
    result = result.filter((book) =>
      [book.title, book.author, book.category, book.description || ""]
        .join(" ")
        .toLowerCase()
        .includes(textQuery)
    );
  }

  if (categoryQuery) {
    result = result.filter((book) => String(book.category || "").trim() === categoryQuery);
  }

  result.sort((a, b) => {
    if (sortMode === "title-asc") return compareStringsLocale(a.title, b.title);
    if (sortMode === "title-desc") return compareStringsLocale(b.title, a.title);

    if (sortMode === "author-asc") {
      const byAuthor = compareStringsLocale(a.author, b.author);
      return byAuthor !== 0 ? byAuthor : compareStringsLocale(a.title, b.title);
    }

    if (sortMode === "author-desc") {
      const byAuthor = compareStringsLocale(b.author, a.author);
      return byAuthor !== 0 ? byAuthor : compareStringsLocale(a.title, b.title);
    }

    if (sortMode === "category-asc") {
      const byCategory = compareStringsLocale(a.category, b.category);
      return byCategory !== 0 ? byCategory : compareStringsLocale(a.title, b.title);
    }

    if (sortMode === "category-desc") {
      const byCategory = compareStringsLocale(b.category, a.category);
      return byCategory !== 0 ? byCategory : compareStringsLocale(a.title, b.title);
    }

    return compareStringsLocale(a.title, b.title);
  });

  return result;
}

function updateReaderResultsCount(count) {
  readerResultsCount.textContent = `Wyniki: ${count}`;
}

function renderReaderBooks() {
  const books = getFilteredReaderBooks();
  updateReaderResultsCount(books.length);

  if (!books.length) {
    readerBooksList.innerHTML = `<div class="reader-empty">Brak książek spełniających kryteria.</div>`;
    return;
  }

  readerBooksList.innerHTML = "";

  books.forEach((book) => {
    const card = document.createElement("article");
    card.className = "reader-book-card";
    card.innerHTML = `
      <img
        class="reader-book-card__cover"
        src="${book.cover || "assets/no-cover.svg"}"
        alt="${escapeHtml(book.title || "Okładka")}"
      />
      <div class="reader-book-card__content">
        <h3>${escapeHtml(book.title || "Bez tytułu")}</h3>
        <p>${escapeHtml(book.author || "Nieznany autor")}</p>
        <p>${escapeHtml(book.category || "Brak kategorii")}</p>
        <a class="reader-open-btn" href="${book.epub || "#"}">Otwórz</a>
      </div>
    `;
    readerBooksList.appendChild(card);
  });
}

function clearReaderFilters() {
  readerSearchInput.value = "";
  readerCategoryFilterSelect.value = "";
  readerSortSelect.value = "title-asc";
  renderReaderBooks();
}

async function loadReaderLibrary() {
  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    libraryBooks = Array.isArray(data.books) ? data.books : [];
    buildReaderCategoryOptions(libraryBooks);
    renderReaderBooks();
  } catch (error) {
    console.error(error);
    readerBooksList.innerHTML = `<div class="reader-empty">Nie udało się wczytać biblioteki.</div>`;
  }
}

readerSearchInput?.addEventListener("input", renderReaderBooks);
readerCategoryFilterSelect?.addEventListener("change", renderReaderBooks);
readerSortSelect?.addEventListener("change", renderReaderBooks);
readerClearFiltersBtn?.addEventListener("click", clearReaderFilters);

loadReaderLibrary();
