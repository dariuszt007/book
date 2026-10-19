const booksList = document.getElementById("booksList");
const refreshLibraryBtn = document.getElementById("refreshLibraryBtn");
const bookInfo = document.getElementById("bookInfo");
const viewer = document.getElementById("viewer");
const readerControls = document.getElementById("readerControls");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const increaseFontBtn = document.getElementById("increaseFontBtn");
const decreaseFontBtn = document.getElementById("decreaseFontBtn");

let rendition = null;
let currentFontSize = 100;

async function loadLibrary() {
  booksList.innerHTML = "<p>Ładowanie biblioteki...</p>";

  try {
    const response = await fetch(`data/library.json?v=${Date.now()}`);
    const data = await response.json();
    renderBooks(data.books || []);
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

function openBook(book) {
  bookInfo.classList.remove("empty");
  bookInfo.innerHTML = `
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;">
      <img src="${book.cover || 'assets/no-cover.svg'}"
           alt="${escapeHtml(book.title)}"
           style="width:120px;height:170px;object-fit:cover;border-radius:10px;background:#fff;" />
      <div>
        <h2 style="margin-top:0;">${escapeHtml(book.title)}</h2>
        <p><strong>Autor:</strong> ${escapeHtml(book.author || "Nieznany")}</p>
        <p><strong>Język:</strong> ${escapeHtml(book.language || "-")}</p>
        <p><strong>Kategoria:</strong> ${escapeHtml(book.category || "-")}</p>
        <p>${escapeHtml(book.description || "")}</p>
      </div>
    </div>
  `;

  viewer.innerHTML = "";

  const bookInstance = ePub(book.epub);
  rendition = bookInstance.renderTo("viewer", {
    width: "100%",
    height: "100%",
    spread: "auto"
  });

  rendition.display();
  rendition.themes.fontSize(`${currentFontSize}%`);
  readerControls.classList.remove("hidden");
}

refreshLibraryBtn?.addEventListener("click", loadLibrary);
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

loadLibrary();
