# EPUB Library

Projekt do:
- czytania EPUB online
- edycji książek EPUB
- tworzenia książek od zera
- eksportu EPUB
- generowania wpisu JSON do `data/library.json`

## Struktura

- `index.html` - panel czytelnika
- `admin.html` - panel administratora
- `data/library.json` - lista książek
- `books/` - pliki EPUB
- `covers/` - okładki
- `js/reader.js` - logika czytelnika
- `js/admin.js` - logika panelu admina
- `js/utils.js` - funkcje pomocnicze

## Jak dodać książkę

1. Wejdź do panelu administratora
2. Zaimportuj EPUB lub utwórz książkę od zera
3. Uzupełnij dane
4. Kliknij `Pobierz EPUB`
5. Wrzuć plik do folderu `books/`
6. Jeśli masz okładkę, wrzuć ją do folderu `covers/`
7. Kliknij `Generuj wpis do library.json`
8. Skopiuj wynik i wklej go do tablicy `books` w `data/library.json`

## Uwaga

To wersja bez backendu i bez GitHub Actions.
Dlatego:
- plik EPUB pobierasz ręcznie
- plik EPUB wrzucasz ręcznie do repo
- wpis do `library.json` wklejasz ręcznie
