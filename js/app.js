/**
 * ==========================================================================
 * BIBLIOTECA DE RUBÉN - APLICACIÓN WEB DE CATÁLOGO (FASES 1-4)
 * Búsqueda, altas, edición, orden CDU, filtro de datos incompletos,
 * enlaces directos BNE/GBooks, etiquetas temáticas, páginas, portadas y Glosario CDU
 * ==========================================================================
 */

(function () {
  "use strict";

  const STORAGE_KEY = "BIBLIOTECA_RUBEN_CUSTOM_DATA";

  // 1. CARGA INICIAL Y PERSISTENCIA
  function loadInitialData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("No se pudo leer localStorage, cargando datos base:", e);
    }
    return window.BIBLIOTECA_DATA || [];
  }

  // 2. ESTADO GLOBAL DE LA APLICACIÓN
  const state = {
    allBooks: loadInitialData(),
    filteredBooks: [],
    activeLocation: "ALL", // 'ALL' | 'Marina' | 'Terrassa' | 'Ribera' | 'Diagonal'
    activeType: "ALL",     // 'ALL' | 'LIBROS' | 'COMICS' | 'IMPRESOS'
    activeStatus: "ALL",   // 'ALL' | 'leido' | 'leyendo' | 'no_leido'
    activeTag: "",         // '' | etiqueta temática (Fase 4)
    missingDataOnly: false,
    searchQuery: "",
    sortBy: "id-asc",
    currentView: "cards",  // 'cards' | 'table'
    selectedModalIndex: 0,
    isEditMode: false
  };

  // 3. REFERENCIAS AL DOM
  const dom = {
    // Estados de lectura en cabecera
    statLeidos: document.getElementById("statLeidos"),
    statLeyendo: document.getElementById("statLeyendo"),
    statPendientes: document.getElementById("statPendientes"),
    headerFilterChips: document.querySelectorAll(".header-filter-chip"),

    // Contadores de ubicación y filtros
    countAll: document.getElementById("countAll"),
    countMarina: document.getElementById("countMarina"),
    countTerrassa: document.getElementById("countTerrassa"),
    countRibera: document.getElementById("countRibera"),
    countDiagonal: document.getElementById("countDiagonal"),
    countMissing: document.getElementById("countMissing"),
    btnFilterMissing: document.getElementById("btnFilterMissing"),

    // Acciones de cabecera
    btnOpenNewBookModal: document.getElementById("btnOpenNewBookModal"),
    btnExportJson: document.getElementById("btnExportJson"),
    btnOpenCduGuide: document.getElementById("btnOpenCduGuide"),

    // Búsqueda
    searchInput: document.getElementById("searchInput"),
    searchClearBtn: document.getElementById("searchClearBtn"),
    searchDropdown: document.getElementById("searchDropdown"),

    // Controles de navegación y ordenación
    locationGroup: document.getElementById("locationFilterGroup"),
    btnQuickCduSort: document.getElementById("btnQuickCduSort"),
    sortSelect: document.getElementById("sortSelect"),
    btnViewCards: document.getElementById("btnViewCards"),
    btnViewTable: document.getElementById("btnViewTable"),
    btnPrint: document.getElementById("btnPrint"),
    btnResetFilters: document.getElementById("btnResetFilters"),

    // Vistas y Resultados
    filterDescription: document.getElementById("filterDescription"),
    visibleCount: document.getElementById("visibleCount"),
    activeViewName: document.getElementById("activeViewName"),
    booksGrid: document.getElementById("booksGrid"),
    tableContainer: document.getElementById("tableContainer"),
    catalogTableBody: document.getElementById("catalogTableBody"),
    emptyState: document.getElementById("emptyState"),
    printMetaText: document.getElementById("printMetaText"),
    printDateText: document.getElementById("printDateText"),

    // Modal de Ficha Individual
    modalOverlay: document.getElementById("bookModalOverlay"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),
    modalToggleEditBtn: document.getElementById("modalToggleEditBtn"),
    modalViewSection: document.getElementById("modalViewSection"),
    modalEditSection: document.getElementById("modalEditSection"),
    modalNavBar: document.getElementById("modalNavBar"),

    modalCoverBox: document.getElementById("modalCoverBox"),
    modalBookTitle: document.getElementById("modalBookTitle"),
    modalAuthorsList: document.getElementById("modalAuthorsList"),
    modalEditorial: document.getElementById("modalEditorial"),
    modalAno: document.getElementById("modalAno"),
    modalCdu: document.getElementById("modalCdu"),
    modalPaginas: document.getElementById("modalPaginas"),
    modalIsbn: document.getElementById("modalIsbn"),
    modalLocalizacion: document.getElementById("modalLocalizacion"),
    modalTipologia: document.getElementById("modalTipologia"),
    modalStatusBadge: document.getElementById("modalStatusBadge"),
    modalLocationBadge: document.getElementById("modalLocationBadge"),
    modalTagsBox: document.getElementById("modalTagsBox"),
    modalPrevBtn: document.getElementById("modalPrevBtn"),
    modalNextBtn: document.getElementById("modalNextBtn"),
    modalCounterIndex: document.getElementById("modalCounterIndex"),

    // CDU Guide modal (Fase 4)
    cduGuideOverlay: document.getElementById("cduGuideOverlay"),
    cduGuideCloseBtn: document.getElementById("cduGuideCloseBtn"),

    // Enlaces externos a BNE y Google Books (Fase 3 simplificada)
    linkBneSearch: document.getElementById("linkBneSearch"),
    linkGoogleBooksSearch: document.getElementById("linkGoogleBooksSearch"),

    // Formulario de edición
    editTitle: document.getElementById("editTitle"),
    editAuthors: document.getElementById("editAuthors"),
    editEditorial: document.getElementById("editEditorial"),
    editAno: document.getElementById("editAno"),
    editCdu: document.getElementById("editCdu"),
    editIsbn: document.getElementById("editIsbn"),
    editLocation: document.getElementById("editLocation"),
    editStatus: document.getElementById("editStatus"),
    editType: document.getElementById("editType"),
    editTags: document.getElementById("editTags"),
    btnCancelEdit: document.getElementById("btnCancelEdit"),

    // Modal de Alta de Nuevo Libro
    newBookModalOverlay: document.getElementById("newBookModalOverlay"),
    newBookCloseBtn: document.getElementById("newBookCloseBtn"),
    newBookForm: document.getElementById("newBookForm"),
    newTitle: document.getElementById("newTitle"),
    newAuthors: document.getElementById("newAuthors"),
    newEditorial: document.getElementById("newEditorial"),
    newAno: document.getElementById("newAno"),
    newCdu: document.getElementById("newCdu"),
    newIsbn: document.getElementById("newIsbn"),
    newLocation: document.getElementById("newLocation"),
    newStatus: document.getElementById("newStatus"),
    newType: document.getElementById("newType"),
    newTags: document.getElementById("newTags"),
    btnCancelNewBook: document.getElementById("btnCancelNewBook"),

    // Toast
    toast: document.getElementById("toastNotification")
  };

  // 4. INICIALIZACIÓN
  function init() {
    setupStats();
    setupEventListeners();
    // Detectar si la BD fue actualizada con nuevos campos (páginas, etiquetas) y el
    // localStorage tiene la versión antigua: si el primer libro no tiene paginas pero
    // la fuente base sí, resetear para adoptar los datos frescos.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const baseHasPaginas = window.BIBLIOTECA_DATA && window.BIBLIOTECA_DATA.length > 0 && window.BIBLIOTECA_DATA[0].paginas !== undefined;
        const storedMissingPaginas = parsed.length > 0 && parsed[0].paginas === undefined;
        if (baseHasPaginas && storedMissingPaginas) {
          // Merge: mantener ediciones del usuario (isbn, cdu, localizacion, estadoLectura)
          // pero adoptar nuevos campos (paginas, portadaUrl, etiquetas) de la base
          const baseMap = {};
          window.BIBLIOTECA_DATA.forEach(b => { baseMap[b.id] = b; });
          state.allBooks = parsed.map(b => {
            const base = baseMap[b.id];
            if (!base) return b;
            return Object.assign({}, base, {
              titulo: b.titulo || base.titulo,
              autoresStr: b.autoresStr || base.autoresStr,
              autores: b.autores || base.autores,
              editorial: b.editorial || base.editorial,
              ano: b.ano || base.ano,
              cdu: b.cdu !== undefined ? b.cdu : base.cdu,
              isbn: b.isbn || base.isbn,
              localizacion: b.localizacion || base.localizacion,
              estadoLectura: b.estadoLectura || base.estadoLectura,
              esComic: b.esComic !== undefined ? b.esComic : base.esComic,
              esImpreso: b.esImpreso !== undefined ? b.esImpreso : base.esImpreso,
              etiquetas: (base.etiquetas && base.etiquetas.length > 0) ? base.etiquetas : (b.etiquetas || []),
              paginas: base.paginas || b.paginas || null,
              portadaUrl: base.portadaUrl || b.portadaUrl || ""
            });
          });
          persistData();
        }
      } catch (e) {
        console.warn("No se pudo migrar datos de localStorage:", e);
      }
    }
    applyFiltersAndRender();
  }

  // 5. CRITERIO DE LIBROS CON DATOS FALTANTES (REVISIÓN)
  function isBookMissingData(book) {
    if (!book) return false;
    // Falta CDU (el campo principal solicitado) o falta año, editorial o autor
    const missingCdu = !book.cdu || String(book.cdu).trim() === "";
    const missingAno = !book.ano || String(book.ano).trim() === "" || book.ano === "S.A.";
    const missingEd = !book.editorial || String(book.editorial).trim() === "" || book.editorial === "S.E.";
    const manualFlag = book.necesitaRevision || (book.etiquetas && book.etiquetas.includes("Revisión manual"));

    return missingCdu || missingAno || missingEd || manualFlag;
  }

  // 6. ACTUALIZACIÓN DE ESTADÍSTICAS Y CONTADORES
  function setupStats() {
    const leidos = state.allBooks.filter(b => b.estadoLectura === "leido").length;
    const leyendo = state.allBooks.filter(b => b.estadoLectura === "leyendo").length;
    const pendientes = state.allBooks.filter(b => b.estadoLectura === "no_leido").length;

    dom.statLeidos.textContent = leidos;
    dom.statLeyendo.textContent = leyendo;
    dom.statPendientes.textContent = pendientes;

    dom.countAll.textContent = state.allBooks.length;
    dom.countMarina.textContent = state.allBooks.filter(b => b.localizacion === "Marina").length;
    dom.countTerrassa.textContent = state.allBooks.filter(b => b.localizacion === "Terrassa").length;
    dom.countRibera.textContent = state.allBooks.filter(b => b.localizacion === "Ribera").length;
    dom.countDiagonal.textContent = state.allBooks.filter(b => b.localizacion === "Diagonal").length;

    const missingTotal = state.allBooks.filter(isBookMissingData).length;
    if (dom.countMissing) {
      dom.countMissing.textContent = missingTotal;
    }
  }

  function persistData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.allBooks));
    } catch (e) {
      console.error("Error guardando en localStorage:", e);
    }
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    setTimeout(() => {
      dom.toast.classList.remove("show");
    }, 3200);
  }

  // 7. UTILIDADES DE AUTORES
  function getAuthorsArray(book) {
    if (!book) return [];
    if (Array.isArray(book.autores)) {
      return book.autores;
    }
    if (typeof book.autores === "string" && book.autores.trim() !== "") {
      return [book.autores.trim()];
    }
    if (book.autoresStr && typeof book.autoresStr === "string") {
      return book.autoresStr.split(";").map(s => s.trim()).filter(Boolean);
    }
    if (book.autorRaw && typeof book.autorRaw === "string") {
      return [book.autorRaw.trim()];
    }
    return [];
  }

  function normalizeInputAuthors(inputStr) {
    if (!inputStr || !inputStr.trim()) return [];
    const rawList = inputStr.split(/;/);
    const result = [];

    rawList.forEach(raw => {
      let name = raw.trim();
      if (!name) return;
      if (/^(VVAA|V\.V\.A\.A\.|Varios Autores|Varios autores|Varios|VV\.AA\.)$/i.test(name)) {
        result.push("VVAA");
        return;
      }
      if (name.includes(",")) {
        const parts = name.split(",");
        const ap = parts[0].trim();
        const nom = parts.slice(1).join(" ").trim();
        result.push(`${ap}, ${nom}`);
      } else {
        const words = name.split(/\s+/).filter(Boolean);
        if (words.length <= 1) {
          result.push(name);
        } else if (words.length === 2) {
          result.push(`${words[1]}, ${words[0]}`);
        } else {
          const last = words[words.length - 1];
          const rest = words.slice(0, words.length - 1).join(" ");
          result.push(`${last}, ${rest}`);
        }
      }
    });

    return result;
  }

  // ==========================================================================
  // ENLACES DIRECTOS A CATÁLOGOS PÚBLICOS (BNE PRIMO DISCOVERY & GOOGLE BOOKS)
  // ==========================================================================
  function generateBneDiscoveryUrl(title, author) {
    const cleanTitle = (title || "").replace(/\[.*?\]|\(.*?\)|-.*$/g, "").trim();
    const firstAuthor = (author || "").split(";")[0].replace(/,.*/, "").trim();
    const query = cleanTitle + (firstAuthor ? " " + firstAuthor : "");
    // Formato exacto del motor Discovery / Primo del catálogo de la BNE facilitado por el usuario
    return `https://catalogo.bne.es/discovery/search?query=any,contains,${encodeURIComponent(query)}&tab=LibraryCatalog&search_scope=MyInstitution&vid=34BNE_INST:CATALOGO&offset=0`;
  }

  function generateGoogleBooksUrl(title, author) {
    const cleanTitle = (title || "").replace(/\[.*?\]|\(.*?\)|-.*$/g, "").trim();
    const firstAuthor = (author || "").split(";")[0].replace(/,.*/, "").trim();
    const query = cleanTitle + (firstAuthor ? " " + firstAuthor : "");
    return `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(query)}`;
  }

  // 8. FILTRADO, BÚSQUEDA Y ORDENACIÓN
  function applyFiltersAndRender() {
    const q = state.searchQuery.trim().toLowerCase();

    state.filteredBooks = state.allBooks.filter(book => {
      // Filtro Ubicación
      if (state.activeLocation !== "ALL" && book.localizacion !== state.activeLocation) {
        return false;
      }

      // Filtro Tipología
      if (state.activeType === "LIBROS" && book.esComic) return false;
      if (state.activeType === "COMICS" && !book.esComic) return false;
      if (state.activeType === "IMPRESOS" && !book.esImpreso) return false;

      // Filtro Estado de lectura (desde cabecera)
      if (state.activeStatus !== "ALL" && book.estadoLectura !== state.activeStatus) {
        return false;
      }

      // Filtro Datos Faltantes (CDU, año, etc.)
      if (state.missingDataOnly && !isBookMissingData(book)) {
        return false;
      }

      // Filtro por Etiqueta Temática (Fase 4)
      if (state.activeTag) {
        const tags = book.etiquetas || [];
        if (!tags.some(t => t.toLowerCase() === state.activeTag.toLowerCase())) {
          return false;
        }
      }

      // Búsqueda textual
      if (q) {
        const matchTitle = (book.titulo || "").toLowerCase().includes(q);
        const matchAuthor = (book.autoresStr || "").toLowerCase().includes(q) || (book.autorRaw || "").toLowerCase().includes(q);
        const matchEditorial = (book.editorial || "").toLowerCase().includes(q);
        const matchAno = (book.ano || "").toString().toLowerCase().includes(q);
        const matchCdu = (book.cdu || "").toLowerCase().includes(q);
        const matchIsbn = (book.isbn || "").toLowerCase().includes(q);
        const matchLoc = (book.localizacion || "").toLowerCase().includes(q);
        const matchTags = (book.etiquetas || []).some(t => t.toLowerCase().includes(q));
        const matchColeccion = (book.coleccion || "").toLowerCase().includes(q) || (book.subcoleccion || "").toLowerCase().includes(q);

        if (!matchTitle && !matchAuthor && !matchEditorial && !matchAno && !matchCdu && !matchIsbn && !matchLoc && !matchTags && !matchColeccion) {
          return false;
        }
      }

      return true;
    });

    // Ordenación
    sortBooks(state.filteredBooks, state.sortBy);

    // Actualizar metadatos
    updateResultsMeta();

    // Renderizar según vista activa
    if (state.currentView === "cards") {
      renderCards(state.filteredBooks);
      dom.booksGrid.style.display = "grid";
      dom.tableContainer.style.display = "none";
    } else {
      renderTable(state.filteredBooks);
      dom.booksGrid.style.display = "none";
      dom.tableContainer.style.display = "block";
    }

    // Estado vacío
    if (state.filteredBooks.length === 0) {
      dom.booksGrid.style.display = "none";
      dom.tableContainer.style.display = "none";
      dom.emptyState.style.display = "block";
    } else {
      dom.emptyState.style.display = "none";
    }
  }

  function compareCDU(a, b) {
    const cduA = (a.cdu || "").trim();
    const cduB = (b.cdu || "").trim();

    if (!cduA && !cduB) {
      const aut = (a.autoresStr || "").localeCompare(b.autoresStr || "", "es");
      return aut !== 0 ? aut : (a.titulo || "").localeCompare(b.titulo || "", "es");
    }
    if (!cduA) return 1;
    if (!cduB) return -1;

    const cmp = cduA.localeCompare(cduB, "es", { sensitivity: "base" });
    if (cmp !== 0) return cmp;

    const autCmp = (a.autoresStr || "").localeCompare(b.autoresStr || "", "es");
    if (autCmp !== 0) return autCmp;
    return (a.titulo || "").localeCompare(b.titulo || "", "es");
  }

  function sortBooks(list, sortKey) {
    list.sort((a, b) => {
      switch (sortKey) {
        case "cdu-library":
        case "cdu-asc":
          return compareCDU(a, b);
        case "autor-asc":
          return (a.autoresStr || "").localeCompare(b.autoresStr || "", "es");
        case "titulo-asc":
          return (a.titulo || "").localeCompare(b.titulo || "", "es");
        case "ano-desc":
          return (parseInt(b.ano, 10) || 0) - (parseInt(a.ano, 10) || 0);
        case "ano-asc":
          return (parseInt(a.ano, 10) || 0) - (parseInt(b.ano, 10) || 0);
        case "id-asc":
        default:
          return a.id - b.id;
      }
    });
  }

  function updateResultsMeta() {
    dom.visibleCount.textContent = state.filteredBooks.length;
    let viewName = "Lista Total";
    if (state.activeLocation !== "ALL") {
      viewName = `Ubicación: ${state.activeLocation}`;
    }
    if (state.activeType !== "ALL") {
      viewName += ` (${state.activeType})`;
    }
    if (state.activeStatus !== "ALL") {
      viewName += ` (${formatStatusLabel(state.activeStatus)})`;
    }
    if (state.missingDataOnly) {
      viewName += ` [Faltan datos]`;
    }
    if (state.sortBy === "cdu-library") {
      viewName += " [Orden CDU]";
    }
    if (state.searchQuery) {
      viewName += ` • Búsqueda: "${state.searchQuery}"`;
    }
    dom.activeViewName.textContent = viewName;
    dom.printMetaText.textContent = `${viewName} — ${state.filteredBooks.length} registros`;

    if (dom.btnQuickCduSort) {
      dom.btnQuickCduSort.classList.toggle("active", state.sortBy === "cdu-library");
    }

    dom.headerFilterChips.forEach(chip => {
      const filter = chip.getAttribute("data-status-filter");
      chip.classList.toggle("active", state.activeStatus === filter);
    });

    if (dom.btnFilterMissing) {
      dom.btnFilterMissing.classList.toggle("active", state.missingDataOnly);
    }
  }

  // 9. RENDERIZADO: TARJETAS
  function renderCards(books) {
    dom.booksGrid.innerHTML = "";
    const fragment = document.createDocumentFragment();

    books.forEach((book, index) => {
      const card = document.createElement("article");
      card.className = `book-card status-${book.estadoLectura}`;
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("data-index", index);
      card.setAttribute("aria-label", `Ver ficha de ${book.titulo}`);

      const statusBadge = getStatusPillHtml(book.estadoLectura);
      const cduHtml = book.cdu 
        ? `<span class="cdu-badge" title="Código CDU">${escapeHtml(book.cdu)}</span>`
        : `<span class="cdu-empty-badge" title="Sin clasificar">Sin código</span>`;

      const locClass = (book.localizacion || "").toLowerCase();
      const locHtml = `<span class="loc-badge ${locClass}">📍 ${escapeHtml(book.localizacion || "Sin ubicación")}</span>`;

      let tagsHtml = "";
      if (isBookMissingData(book)) {
        tagsHtml += `<span class="tag-badge tag-review" title="Faltan datos (CDU o edición)">⚠️ Faltan datos</span>`;
      }
      if (book.esComic) {
        tagsHtml += `<span class="tag-badge tag-comic">🗯️ Cómic</span>`;
      }
      if (book.esImpreso) {
        tagsHtml += `<span class="tag-badge tag-impreso">🖨️ Impreso</span>`;
      }
      if (book.coleccion) {
        tagsHtml += `<span class="tag-badge" style="background:#e0e7ff; color:#3730a3;">🏷️ ${escapeHtml(book.coleccion)}</span>`;
      }

      card.innerHTML = `
        <div>
          <div class="card-top">
            ${cduHtml}
            ${statusBadge}
          </div>
          <h3 class="book-title" title="${escapeHtml(book.titulo)}">${escapeHtml(book.titulo)}</h3>
          <div class="book-authors" title="${escapeHtml(book.autoresStr)}">${escapeHtml(book.autoresStr || "Autor no especificado")}</div>
        </div>
        <div class="card-footer">
          <div class="card-pub-info">
            <span>${escapeHtml(book.editorial || "S.E.")}</span>
            <span><strong>${escapeHtml(book.ano || "S.A.")}</strong></span>
          </div>
          <div class="card-tags-row">
            ${locHtml}
            ${tagsHtml}
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    dom.booksGrid.appendChild(fragment);
  }

  // 10. RENDERIZADO: TABLA OPAC
  function renderTable(books) {
    dom.catalogTableBody.innerHTML = "";
    const fragment = document.createDocumentFragment();

    books.forEach((book, index) => {
      const tr = document.createElement("tr");
      tr.setAttribute("tabindex", "0");
      tr.setAttribute("role", "button");
      tr.setAttribute("data-index", index);

      const statusBadge = getStatusPillHtml(book.estadoLectura);
      const locClass = (book.localizacion || "").toLowerCase();
      const locHtml = `<span class="loc-badge ${locClass}">📍 ${escapeHtml(book.localizacion)}</span>`;
      const cduText = book.cdu || `<span style="color:#94a3b8;">-</span>`;

      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.75rem; color: #64748b;">${index + 1}</td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: #0284c7;">${cduText}</td>
        <td class="col-title">
          ${escapeHtml(book.titulo)}
          ${isBookMissingData(book) ? '<span class="tag-badge tag-review" style="margin-left:0.35rem;">⚠️ Faltan datos</span>' : ''}
        </td>
        <td class="col-author">${escapeHtml(book.autoresStr || "-")}</td>
        <td>${escapeHtml(book.editorial || "-")}</td>
        <td>${escapeHtml(book.ano || "-")}</td>
        <td>${locHtml}</td>
        <td>${statusBadge}</td>
      `;

      fragment.appendChild(tr);
    });

    dom.catalogTableBody.appendChild(fragment);
  }

  // BÚSQUEDA PREDICTIVA CON REDIRECCIÓN A FICHA
  function updateSearchDropdown() {
    const q = state.searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) {
      dom.searchDropdown.style.display = "none";
      dom.searchDropdown.innerHTML = "";
      return;
    }

    const matches = state.allBooks.filter(b => {
      return (b.titulo || "").toLowerCase().includes(q) ||
             (b.autoresStr || "").toLowerCase().includes(q) ||
             (b.editorial || "").toLowerCase().includes(q) ||
             (b.cdu || "").toLowerCase().includes(q);
    }).slice(0, 8);

    if (matches.length === 0) {
      dom.searchDropdown.style.display = "none";
      dom.searchDropdown.innerHTML = "";
      return;
    }

    let html = `<div class="search-dropdown-header">Sugerencias encontradas (clic para abrir ficha)</div>`;

    matches.forEach(book => {
      const locClass = (book.localizacion || "").toLowerCase();
      const cduText = book.cdu ? `CDU ${escapeHtml(book.cdu)}` : `Sin CDU`;

      html += `
        <div class="search-dropdown-item" data-book-id="${book.id}">
          <div class="search-item-info">
            <span class="search-item-title">${escapeHtml(book.titulo)}</span>
            <span class="search-item-sub">${escapeHtml(book.autoresStr || "Autor no especificado")} • ${escapeHtml(book.editorial || "S.E.")} (${escapeHtml(book.ano || "S.A.")})</span>
          </div>
          <div class="search-item-badges">
            <span class="loc-badge ${locClass}" style="font-size:0.7rem;">📍 ${escapeHtml(book.localizacion)}</span>
            <span class="cdu-badge" style="font-size:0.65rem;">${cduText}</span>
          </div>
        </div>
      `;
    });

    dom.searchDropdown.innerHTML = html;
    dom.searchDropdown.style.display = "block";
  }

  // 11. FICHA INDIVIDUAL DE CADA LIBRO
  function openModal(index) {
    try {
      if (index < 0 || index >= state.filteredBooks.length) return;
      state.selectedModalIndex = index;
      state.isEditMode = false;
      const book = state.filteredBooks[index];

      dom.modalViewSection.style.display = "flex";
      dom.modalEditSection.style.display = "none";
      dom.modalNavBar.style.display = "flex";
      dom.modalToggleEditBtn.textContent = "✏️ Editar";

      dom.modalBookTitle.textContent = book.titulo || "Sin título";

      dom.modalAuthorsList.innerHTML = "";
      const authors = getAuthorsArray(book);
      if (authors.length > 0) {
        authors.forEach(aut => {
          const pill = document.createElement("span");
          pill.className = "modal-author-pill";
          pill.textContent = aut;
          dom.modalAuthorsList.appendChild(pill);
        });
      } else {
        const pill = document.createElement("span");
        pill.className = "modal-author-pill";
        pill.textContent = "Autor no especificado";
        dom.modalAuthorsList.appendChild(pill);
      }

      dom.modalEditorial.textContent = book.editorial || "-";
      dom.modalAno.textContent = book.ano || "-";
      dom.modalCdu.textContent = book.cdu || "-";
      // Páginas (Fase 4)
      if (dom.modalPaginas) {
        dom.modalPaginas.textContent = book.paginas ? `${book.paginas} pág.` : "-";
      }
      dom.modalIsbn.textContent = book.isbn || "-";
      dom.modalLocalizacion.textContent = book.localizacion || "-";

      let tipoStr = "Libro";
      if (book.esComic) {
        tipoStr = book.coleccion ? `Cómic (${book.coleccion})` : "Cómic";
      }
      if (book.esImpreso) {
        tipoStr += " [Impreso]";
      }
      dom.modalTipologia.textContent = tipoStr;

      dom.modalStatusBadge.innerHTML = getStatusPillHtml(book.estadoLectura);
      const locClass = (book.localizacion || "").toLowerCase();
      dom.modalLocationBadge.innerHTML = `<span class="loc-badge ${locClass}" style="font-size:0.85rem; padding: 0.25rem 0.65rem;">📍 Ubicación: ${escapeHtml(book.localizacion)}</span>`;

      // Enlaces directos a catálogos oficiales (BNE y Google Books)
      const bneUrl = generateBneDiscoveryUrl(book.titulo, book.autoresStr);
      const gbooksUrl = generateGoogleBooksUrl(book.titulo, book.autoresStr);
      dom.linkBneSearch.href = bneUrl;
      dom.linkGoogleBooksSearch.href = gbooksUrl;

      // Portada: imagen real vía OpenLibrary si hay ISBN, placeholder si no (Fase 4)
      if (book.portadaUrl) {
        const img = new Image();
        img.onload = () => {
          dom.modalCoverBox.innerHTML = `<img src="${escapeHtml(book.portadaUrl)}" class="modal-cover-img" alt="Portada de ${escapeHtml(book.titulo)}">`;
        };
        img.onerror = () => {
          // Si la imagen falla (modo offline), mostrar placeholder con ISBN
          dom.modalCoverBox.innerHTML = `
            <div class="book-cover-placeholder">
              <span class="cover-icon">📖</span>
              <span class="cover-hint">Sin portada</span>
              ${book.isbn ? `<span class="cover-load-hint">ISBN: ${escapeHtml(book.isbn)}</span>` : ""}
            </div>
          `;
        };
        img.src = book.portadaUrl;
        // Mientras carga, mostrar placeholder
        dom.modalCoverBox.innerHTML = `
          <div class="book-cover-placeholder">
            <span class="cover-icon">🔄</span>
            <span class="cover-hint">Cargando portada…</span>
          </div>
        `;
      } else {
        dom.modalCoverBox.innerHTML = `
          <div class="book-cover-placeholder">
            <span class="cover-icon">📖</span>
            <span class="cover-hint">Sin portada</span>
          </div>
        `;
      }

      // Etiquetas y avisos de datos faltantes
      dom.modalTagsBox.innerHTML = "";
      const tags = [...(book.etiquetas || [])];
      if (book.subcoleccion && !tags.includes(book.subcoleccion)) {
        tags.push(`Subcolección: ${book.subcoleccion}`);
      }
      if (isBookMissingData(book) && !tags.includes("⚠️ Faltan datos (CDU...)")) {
        tags.unshift("⚠️ Faltan datos (CDU...)");
      }

      if (tags.length === 0) {
        dom.modalTagsBox.innerHTML = `<span style="color:#94a3b8; font-size:0.85rem;">Ninguna etiqueta asignada</span>`;
      } else {
        tags.forEach(t => {
          const span = document.createElement("span");
          span.className = t.includes("Faltan") || t.includes("Revisión") ? "tag-badge tag-review" : "tag-badge";
          span.style.fontSize = "0.825rem";
          span.style.padding = "0.2rem 0.6rem";
          span.textContent = t;
          dom.modalTagsBox.appendChild(span);
        });
      }

      dom.modalCounterIndex.textContent = `${index + 1} de ${state.filteredBooks.length}`;
      dom.modalPrevBtn.disabled = (index === 0);
      dom.modalNextBtn.disabled = (index === state.filteredBooks.length - 1);

      dom.modalOverlay.classList.add("open");
      document.body.style.overflow = "hidden";
    } catch (err) {
      console.error("Error al abrir ficha:", err);
    }
  }

  function openModalByBookId(bookId) {
    const id = parseInt(bookId, 10);
    let idx = state.filteredBooks.findIndex(b => b.id === id);
    if (idx === -1) {
      state.searchQuery = "";
      dom.searchInput.value = "";
      applyFiltersAndRender();
      idx = state.filteredBooks.findIndex(b => b.id === id);
    }
    if (idx !== -1) {
      openModal(idx);
    }
  }

  function closeModal() {
    dom.modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
    state.isEditMode = false;
  }

  // 12. EDICIÓN DE FICHA
  function toggleEditMode() {
    if (state.selectedModalIndex < 0 || state.selectedModalIndex >= state.filteredBooks.length) return;
    const book = state.filteredBooks[state.selectedModalIndex];

    state.isEditMode = !state.isEditMode;

    if (state.isEditMode) {
      dom.editTitle.value = book.titulo || "";
      dom.editAuthors.value = (book.autores && Array.isArray(book.autores)) ? book.autores.join("; ") : (book.autoresStr || "");
      dom.editEditorial.value = book.editorial || "";
      dom.editAno.value = book.ano || "";
      dom.editCdu.value = book.cdu || "";
      dom.editIsbn.value = book.isbn || "";
      dom.editLocation.value = book.localizacion || "Terrassa";
      dom.editStatus.value = book.estadoLectura || "no_leido";

      if (book.esImpreso) dom.editType.value = "impreso";
      else if (book.esComic) dom.editType.value = "comic";
      else dom.editType.value = "libro";

      dom.editTags.value = (book.etiquetas || []).join(", ");

      dom.modalViewSection.style.display = "none";
      dom.modalEditSection.style.display = "flex";
      dom.modalNavBar.style.display = "none";
      dom.modalToggleEditBtn.textContent = "👁️ Ver Ficha";
      dom.editTitle.focus();
    } else {
      dom.modalViewSection.style.display = "flex";
      dom.modalEditSection.style.display = "none";
      dom.modalNavBar.style.display = "flex";
      dom.modalToggleEditBtn.textContent = "✏️ Editar";
    }
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    if (state.selectedModalIndex < 0 || state.selectedModalIndex >= state.filteredBooks.length) return;
    const book = state.filteredBooks[state.selectedModalIndex];

    book.titulo = dom.editTitle.value.trim();
    const authorsArr = normalizeInputAuthors(dom.editAuthors.value);
    book.autores = authorsArr;
    book.autoresStr = authorsArr.join("; ");
    book.editorial = dom.editEditorial.value.trim();
    book.ano = dom.editAno.value.trim();
    book.cdu = dom.editCdu.value.trim();
    book.isbn = dom.editIsbn.value.trim();
    book.localizacion = dom.editLocation.value;
    book.estadoLectura = dom.editStatus.value;

    const tipo = dom.editType.value;
    book.esComic = (tipo === "comic");
    book.esImpreso = (tipo === "impreso");

    const tagsArr = dom.editTags.value.split(",").map(t => t.trim()).filter(Boolean);
    if (book.esComic && !tagsArr.includes("Cómic")) tagsArr.push("Cómic");
    if (book.esImpreso && !tagsArr.includes("Impreso")) tagsArr.push("Impreso");
    book.etiquetas = tagsArr;

    book.necesitaRevision = isBookMissingData(book);

    persistData();
    setupStats();
    applyFiltersAndRender();

    toggleEditMode();
    openModal(state.selectedModalIndex);
    showToast("✓ Ficha actualizada correctamente");
  }

  // 13. ALTA DE NUEVO LIBRO
  function openNewBookModal() {
    dom.newBookForm.reset();
    dom.newBookModalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    dom.newTitle.focus();
  }

  function closeNewBookModal() {
    dom.newBookModalOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function handleSaveNewBook(e) {
    e.preventDefault();
    const title = dom.newTitle.value.trim();
    if (!title) {
      alert("Por favor, introduce el título del libro.");
      return;
    }

    const authorsArr = normalizeInputAuthors(dom.newAuthors.value);
    const editorial = dom.newEditorial.value.trim();
    const ano = dom.newAno.value.trim();
    const cdu = dom.newCdu.value.trim();
    const isbn = dom.newIsbn.value.trim();
    const location = dom.newLocation.value;
    const status = dom.newStatus.value;
    const tipo = dom.newType.value;

    const tagsArr = dom.newTags.value.split(",").map(t => t.trim()).filter(Boolean);
    const esComic = (tipo === "comic");
    const esImpreso = (tipo === "impreso");
    if (esComic && !tagsArr.includes("Cómic")) tagsArr.push("Cómic");
    if (esImpreso && !tagsArr.includes("Impreso")) tagsArr.push("Impreso");

    const maxId = state.allBooks.reduce((max, b) => Math.max(max, b.id || 0), 0);
    const newBook = {
      id: maxId + 1,
      titulo: title,
      autorRaw: dom.newAuthors.value.trim(),
      autores: authorsArr,
      autoresStr: authorsArr.join("; "),
      editorial: editorial,
      ano: ano,
      cdu: cdu,
      cduCompleto: cdu,
      isbn: isbn,
      localizacion: location,
      estadoLectura: status,
      columnaH: esImpreso ? "impreso" : (esComic ? "comic" : "."),
      etiquetas: tagsArr,
      esComic: esComic,
      coleccion: "",
      subcoleccion: "",
      esImpreso: esImpreso,
      necesitaRevision: (!cdu || !ano || !editorial)
    };

    state.allBooks.unshift(newBook);
    persistData();
    setupStats();
    closeNewBookModal();

    applyFiltersAndRender();
    const newIdx = state.filteredBooks.findIndex(b => b.id === newBook.id);
    if (newIdx !== -1) {
      openModal(newIdx);
    }

    showToast("✓ Nuevo libro añadido al catálogo con éxito");
  }

  // 14. EXPORTACIÓN A JSON E IMPRESIÓN
  function exportDatabaseJson() {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.allBooks, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "biblioteca_actualizada.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("✓ Base de datos descargada como 'biblioteca_actualizada.json'");
    } catch (err) {
      console.error("Error al exportar JSON:", err);
      alert("No se pudo generar el archivo de exportación.");
    }
  }

  function triggerPrint() {
    renderTable(state.filteredBooks);
    dom.printDateText.textContent = `Fecha de impresión: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}`;
    window.print();
  }

  // 15. EVENT LISTENERS
  function setupEventListeners() {
    // Filtros de Estado en la Cabecera
    dom.headerFilterChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const filter = chip.getAttribute("data-status-filter");
        if (state.activeStatus === filter) {
          state.activeStatus = "ALL";
        } else {
          state.activeStatus = filter;
        }
        applyFiltersAndRender();
      });
    });

    // Alta de libro
    dom.btnOpenNewBookModal.addEventListener("click", openNewBookModal);
    dom.newBookCloseBtn.addEventListener("click", closeNewBookModal);
    dom.btnCancelNewBook.addEventListener("click", closeNewBookModal);
    dom.newBookForm.addEventListener("submit", handleSaveNewBook);
    dom.newBookModalOverlay.addEventListener("click", (e) => {
      if (e.target === dom.newBookModalOverlay) closeNewBookModal();
    });

    // Guía CDU (Fase 4)
    if (dom.btnOpenCduGuide) {
      dom.btnOpenCduGuide.addEventListener("click", () => {
        dom.cduGuideOverlay.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    }
    if (dom.cduGuideCloseBtn) {
      dom.cduGuideCloseBtn.addEventListener("click", () => {
        dom.cduGuideOverlay.classList.remove("open");
        document.body.style.overflow = "";
      });
    }
    if (dom.cduGuideOverlay) {
      dom.cduGuideOverlay.addEventListener("click", (e) => {
        if (e.target === dom.cduGuideOverlay) {
          dom.cduGuideOverlay.classList.remove("open");
          document.body.style.overflow = "";
        }
      });
    }

    // Filtro por etiquetas temáticas (Fase 4)
    document.querySelectorAll(".tag-filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tag = btn.getAttribute("data-tag");
        state.activeTag = tag;
        document.querySelectorAll(".tag-filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyFiltersAndRender();
      });
    });

    // Exportar JSON
    dom.btnExportJson.addEventListener("click", exportDatabaseJson);

    // Edición de ficha existente
    dom.modalToggleEditBtn.addEventListener("click", toggleEditMode);
    dom.btnCancelEdit.addEventListener("click", toggleEditMode);
    dom.modalEditSection.addEventListener("submit", handleSaveEdit);

    // Clic en tarjetas
    dom.booksGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".book-card");
      if (!card) return;
      const index = parseInt(card.getAttribute("data-index"), 10);
      if (!isNaN(index)) openModal(index);
    });

    dom.booksGrid.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const card = e.target.closest(".book-card");
        if (!card) return;
        e.preventDefault();
        const index = parseInt(card.getAttribute("data-index"), 10);
        if (!isNaN(index)) openModal(index);
      }
    });

    // Clic en tabla OPAC
    dom.catalogTableBody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr");
      if (!tr) return;
      const index = parseInt(tr.getAttribute("data-index"), 10);
      if (!isNaN(index)) openModal(index);
    });

    dom.catalogTableBody.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const tr = e.target.closest("tr");
        if (!tr) return;
        e.preventDefault();
        const index = parseInt(tr.getAttribute("data-index"), 10);
        if (!isNaN(index)) openModal(index);
      }
    });

    // Búsqueda en tiempo real
    dom.searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      dom.searchClearBtn.style.display = state.searchQuery ? "block" : "none";
      updateSearchDropdown();
      applyFiltersAndRender();
    });

    dom.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (state.filteredBooks.length > 0) {
          dom.searchDropdown.style.display = "none";
          openModal(0);
        }
      } else if (e.key === "Escape") {
        dom.searchDropdown.style.display = "none";
      }
    });

    dom.searchDropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".search-dropdown-item");
      if (!item) return;
      const bookId = item.getAttribute("data-book-id");
      dom.searchDropdown.style.display = "none";
      if (bookId) openModalByBookId(bookId);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-box-wrapper")) {
        dom.searchDropdown.style.display = "none";
      }
    });

    dom.searchClearBtn.addEventListener("click", () => {
      dom.searchInput.value = "";
      state.searchQuery = "";
      dom.searchClearBtn.style.display = "none";
      dom.searchDropdown.style.display = "none";
      dom.searchInput.focus();
      applyFiltersAndRender();
    });

    // Filtros de Ubicación
    dom.locationGroup.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-location]");
      if (!btn) return;
      const loc = btn.getAttribute("data-location");
      state.activeLocation = loc;

      dom.locationGroup.querySelectorAll("button[data-location]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      applyFiltersAndRender();
    });

    // Botón rápido de ordenación CDU
    if (dom.btnQuickCduSort) {
      dom.btnQuickCduSort.addEventListener("click", () => {
        if (state.sortBy === "cdu-library") {
          state.sortBy = "id-asc";
          dom.sortSelect.value = "id-asc";
        } else {
          state.sortBy = "cdu-library";
          dom.sortSelect.value = "cdu-library";
        }
        applyFiltersAndRender();
      });
    }

    // Filtros secundarios (Tipología y Datos Faltantes)
    document.querySelectorAll(".status-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-type");
        const missing = btn.getAttribute("data-missing");

        if (type !== null) {
          state.activeType = type;
          document.querySelectorAll(".status-btn[data-type]").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        } else if (missing !== null) {
          state.missingDataOnly = !state.missingDataOnly;
          btn.classList.toggle("active", state.missingDataOnly);
        }

        applyFiltersAndRender();
      });
    });

    // Ordenación
    dom.sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      applyFiltersAndRender();
    });

    // Vistas
    dom.btnViewCards.addEventListener("click", () => {
      state.currentView = "cards";
      dom.btnViewCards.classList.add("active");
      dom.btnViewTable.classList.remove("active");
      applyFiltersAndRender();
    });

    dom.btnViewTable.addEventListener("click", () => {
      state.currentView = "table";
      dom.btnViewTable.classList.add("active");
      dom.btnViewCards.classList.remove("active");
      applyFiltersAndRender();
    });

    // Imprimir
    dom.btnPrint.addEventListener("click", triggerPrint);

    // Restablecer filtros
    dom.btnResetFilters.addEventListener("click", () => {
      state.activeLocation = "ALL";
      state.activeType = "ALL";
      state.activeStatus = "ALL";
      state.activeTag = "";
      state.missingDataOnly = false;
      state.searchQuery = "";
      state.sortBy = "id-asc";
      dom.sortSelect.value = "id-asc";
      dom.searchInput.value = "";
      dom.searchClearBtn.style.display = "none";
      dom.searchDropdown.style.display = "none";

      dom.locationGroup.querySelectorAll("button[data-location]").forEach(b => b.classList.remove("active"));
      dom.locationGroup.querySelector("button[data-location='ALL']").classList.add("active");

      document.querySelectorAll(".status-btn[data-type]").forEach(b => b.classList.remove("active"));
      document.querySelector(".status-btn[data-type='ALL']").classList.add("active");

      // Resetear filtro de etiquetas (Fase 4)
      document.querySelectorAll(".tag-filter-btn").forEach(b => b.classList.remove("active"));
      const allTagBtn = document.querySelector(".tag-filter-btn[data-tag='']");
      if (allTagBtn) allTagBtn.classList.add("active");

      if (dom.btnFilterMissing) dom.btnFilterMissing.classList.remove("active");
      dom.headerFilterChips.forEach(c => c.classList.remove("active"));

      applyFiltersAndRender();
    });

    // Navegación secuencial dentro del modal
    dom.modalCloseBtn.addEventListener("click", closeModal);
    dom.modalOverlay.addEventListener("click", (e) => {
      if (e.target === dom.modalOverlay) closeModal();
    });

    dom.modalPrevBtn.addEventListener("click", () => {
      if (state.selectedModalIndex > 0) {
        openModal(state.selectedModalIndex - 1);
      }
    });

    dom.modalNextBtn.addEventListener("click", () => {
      if (state.selectedModalIndex < state.filteredBooks.length - 1) {
        openModal(state.selectedModalIndex + 1);
      }
    });

    // Atajos de teclado
    window.addEventListener("keydown", (e) => {
      if (dom.cduGuideOverlay && dom.cduGuideOverlay.classList.contains("open")) {
        if (e.key === "Escape") {
          dom.cduGuideOverlay.classList.remove("open");
          document.body.style.overflow = "";
        }
        return;
      }
      if (dom.newBookModalOverlay.classList.contains("open")) {
        if (e.key === "Escape") closeNewBookModal();
        return;
      }
      if (!dom.modalOverlay.classList.contains("open")) return;
      if (e.key === "Escape") {
        closeModal();
      } else if (!state.isEditMode) {
        if (e.key === "ArrowLeft") {
          if (state.selectedModalIndex > 0) openModal(state.selectedModalIndex - 1);
        } else if (e.key === "ArrowRight") {
          if (state.selectedModalIndex < state.filteredBooks.length - 1) openModal(state.selectedModalIndex + 1);
        }
      }
    });
  }

  // 16. HELPERS DE FORMATO
  function getStatusPillHtml(status) {
    switch (status) {
      case "leido":
        return `<span class="status-pill leido">🟢 Leído</span>`;
      case "leyendo":
        return `<span class="status-pill leyendo">🟠 Empezado</span>`;
      default:
        return `<span class="status-pill no_leido">⚪ Pendiente</span>`;
    }
  }

  function formatStatusLabel(status) {
    switch (status) {
      case "leido": return "Leídos";
      case "leyendo": return "Empezados";
      default: return "Pendientes";
    }
  }

  function escapeHtml(text) {
    if (!text && text !== 0) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
