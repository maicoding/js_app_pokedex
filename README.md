# Pokédex

Responsive, dependency-free explorer for the original 151 Pokémon.

- Search by name or number; sort by name or Pokédex number.
- Save favourites on this device.
- Open details with metric height, weight, types and base stats.
- Keyboard-accessible native dialog, visible focus and mobile layout.
- Explicit network errors, retry controls, request timeout and cached details.

## Run

Serve the repository with any static server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`.

The entry point is `index.html`, loading `css/style.css` and `js/script.js`. Historical `dist/` files are not used by the page.

## Data and privacy

Pokémon data comes from [PokéAPI](https://pokeapi.co/); artwork is requested from the PokeAPI sprites repository on GitHub. Both require a network connection. Only favourite IDs are stored in localStorage (`pokedex.favorites.v1`). Storage failures are reported visibly. No account, tracking or backend is configured. Unofficial fan project; Pokémon belongs to its respective owners.

## Validation

Browser-tested search, sorting, favourites across reloads, dialog details, Escape/focus restoration, HTTP failures and retry using controlled API responses. Desktop 1440px and mobile 390px checked. A separate live API check is required for service availability; fixture tests do not establish it. Full WCAG conformance and cross-browser support are not certified.
