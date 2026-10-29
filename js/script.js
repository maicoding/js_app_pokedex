(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    key = "pokedex.favorites.v1";
  let pokemon = [],
    favorites = [],
    onlyFavorites = false,
    request = 0,
    storageMessage = "";
  const cache = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(saved)) favorites = saved.filter(Number.isInteger);
  } catch {
    storageMessage = "Saved favourites could not be read.";
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(favorites));
      storageMessage = "";
    } catch {
      storageMessage =
        "Browser storage is unavailable. Favourites will last until this page is closed.";
    }
  }
  async function fetchJson(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  }
  const art = (id) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  function image(id, name) {
    const img = document.createElement("img");
    img.src = art(id);
    img.alt = name;
    img.width = 256;
    img.height = 256;
    img.loading = "lazy";
    img.onerror = () => {
      img.removeAttribute("src");
      img.alt = name + " · image unavailable";
      img.onerror = null;
    };
    return img;
  }
  function render() {
    const q = $("poke-search").value.trim().toLowerCase();
    let list = pokemon.filter(
      (p) =>
        (p.name.includes(q) ||
          String(p.id) === q ||
          String(p.id).padStart(3, "0") === q) &&
        (!onlyFavorites || favorites.includes(p.id)),
    );
    if ($("sort").value === "name")
      list.sort((a, b) => a.name.localeCompare(b.name));
    $("pokemonList").replaceChildren();
    $("count").textContent = `${list.length} Pokémon`;
    $("all").setAttribute("aria-pressed", !onlyFavorites);
    $("favorites").setAttribute("aria-pressed", onlyFavorites);
    $("status").textContent =
      storageMessage ||
      (!list.length
        ? onlyFavorites
          ? "No favourites in this view. Save a Pokémon using its heart button."
          : "No Pokémon match your search."
        : "");
    for (const p of list) {
      const li = document.createElement("li");
      li.className = "pokemon-card";
      const open = document.createElement("button");
      open.className = "pokemon-open";
      const img = image(p.id, p.name);
      img.className = "pokemon-art";
      const id = document.createElement("span");
      id.className = "pokemon-id";
      id.textContent = "#" + String(p.id).padStart(3, "0");
      const name = document.createElement("strong");
      name.textContent = p.name;
      open.append(img, id, name);
      open.setAttribute("aria-label", "View " + p.name);
      open.onclick = () => show(p);
      const fav = document.createElement("button");
      fav.className = "favorite";
      fav.textContent = favorites.includes(p.id) ? "♥" : "♡";
      fav.setAttribute("aria-label", "Favourite " + p.name);
      fav.setAttribute("aria-pressed", favorites.includes(p.id));
      fav.onclick = () => {
        favorites = favorites.includes(p.id)
          ? favorites.filter((id) => id !== p.id)
          : [...favorites, p.id];
        save();
        render();
        const replacement = document.querySelector(
          `[aria-label="Favourite ${p.name}"]`,
        );
        (replacement || $("favorites")).focus();
      };
      li.append(open, fav);
      $("pokemonList").append(li);
    }
  }
  async function load() {
    $("retry").hidden = true;
    $("status").textContent = "Loading Pokémon…";
    try {
      const data = await fetchJson(
        "https://pokeapi.co/api/v2/pokemon?limit=151",
      );
      if (!Array.isArray(data.results) || data.results.length === 0)
        throw new Error();
      pokemon = data.results.map((p) => ({
        name: p.name,
        id: Number(p.url.split("/").filter(Boolean).pop()),
      }));
      render();
    } catch {
      $("status").textContent =
        "Pokémon could not be loaded. Check your connection and try again.";
      $("retry").hidden = false;
    }
  }
  async function show(p) {
    const token = ++request;
    $("detail-title").textContent = p.name[0].toUpperCase() + p.name.slice(1);
    $("details").textContent = "Loading details…";
    if (!$("poke-modal").open) $("poke-modal").showModal();
    try {
      let d = cache.get(p.id);
      if (!d) {
        d = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        if (!d.types || !d.stats) throw new Error();
        cache.set(p.id, d);
      }
      if (token !== request || !$("poke-modal").open) return;
      const content = $("details");
      content.replaceChildren(image(p.id, p.name));
      const types = document.createElement("p");
      for (const t of d.types) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = t.type.name;
        types.append(tag);
      }
      const size = document.createElement("p");
      size.textContent = `#${String(p.id).padStart(3, "0")} · ${(d.height / 10).toFixed(1)} m · ${(d.weight / 10).toFixed(1)} kg`;
      const stats = document.createElement("ul");
      stats.className = "detail-stats";
      for (const s of d.stats) {
        const row = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = s.stat.name.replaceAll("-", " ");
        const val = document.createElement("strong");
        val.textContent = s.base_stat;
        row.append(label, val);
        stats.append(row);
      }
      content.append(types, size, stats);
    } catch {
      if (token !== request || !$("poke-modal").open) return;
      $("details").textContent = "Details could not be loaded. ";
      const retry = document.createElement("button");
      retry.textContent = "Try again";
      retry.onclick = () => show(p);
      $("details").append(retry);
    }
  }
  $("close").onclick = () => $("poke-modal").close();
  $("poke-modal").addEventListener("close", () => {
    request++;
  });
  $("poke-search").oninput = () => {
    if (pokemon.length) render();
  };
  $("sort").onchange = () => {
    if (pokemon.length) render();
  };
  $("all").onclick = () => {
    onlyFavorites = false;
    if (pokemon.length) render();
  };
  $("favorites").onclick = () => {
    onlyFavorites = true;
    if (pokemon.length) render();
  };
  $("retry").onclick = load;
  load();
})();
