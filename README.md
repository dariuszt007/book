# EPUB Library PRO

Statyczna aplikacja do:
- czytania książek EPUB online
- importowania plików EPUB
- edycji istniejących EPUB z repo
- tworzenia nowych książek od zera
- eksportu gotowego EPUB
- generowania wpisu do `data/library.json`

## Struktura

- `index.html` - panel czytelnika
- `admin.html` - panel administratora
- `data/library.json` - lista książek
- `books/` - pliki EPUB
- `covers/` - okładki
- `js/reader.js` - logika czytnika
- `js/admin.js` - logika panelu administratora
- `js/utils.js` - funkcje pomocnicze

## Jak dodać książkę

1. Wrzuć plik `.epub` do folderu `books/`
2. Wrzuć okładkę do folderu `covers/`
3. Dodaj wpis do `data/library.json`

## Jak edytować książkę z repo

1. Wejdź do `admin.html`
2. Otwórz książkę z listy
3. Zmień metadane, rozdziały, okładkę lub ilustracje
4. Kliknij `Pobierz EPUB`
5. Podmień plik w folderze `books/`
6. Jeśli trzeba, zaktualizuj wpis w `data/library.json`

## Ważne

To projekt bez backendu, więc:
- aplikacja nie zapisuje automatycznie pliku do repo
- po edycji pobierasz EPUB ręcznie
- potem ręcznie wrzucasz go z powrotem do repo

## Zalecenia

- używaj rozszerzenia `.epub` małymi literami
- używaj prostych nazw plików, np. `bocian.epub`
- po zmianach na GitHub Pages wykonaj twarde odświeżenie strony
