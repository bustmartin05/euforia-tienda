(() => {
  const STORAGE_KEYS = {
    products: "euforia-demo-products",
    reservations: "euforia-demo-reservations",
    settings: "euforia-demo-settings",
    favorites: "euforia-demo-favorites"
  };

  const defaultProducts = [
    { id: "dress-violet", name: "Vestido violeta", type: "vestidos", color: "Violeta estampado", sizes: ["S", "M", "L"], detail: "Largo · fiesta", image: "IMG/Captura de pantalla 2026-10-29 121750.png" },
    { id: "suit-blue", name: "Traje azul", type: "trajes", color: "Azul eléctrico", sizes: ["S", "M", "L"], detail: "Traje de fiesta", image: "IMG/Captura de pantalla 2026-10-29 121758.png" },
    { id: "dress-fuchsia", name: "Vestido fucsia", type: "vestidos", color: "Fucsia", sizes: ["S", "M", "L"], detail: "Largo · fiesta", image: "IMG/Captura de pantalla 2026-10-29 121812.png" },
    { id: "suit-black", name: "Traje negro con brillo", type: "trajes", color: "Negro con brillo", sizes: ["S", "M", "L"], detail: "Gala · lentejuelas", image: "IMG/Captura de pantalla 2026-10-29 121959.png" },
    { id: "suit-collection", name: "Trajes de colección", type: "trajes", color: "Negro", sizes: ["S", "M", "L"], detail: "Desfile · fiesta", image: "IMG/Captura de pantalla 2026-10-29 122008.png" },
    { id: "suit-runway", name: "Traje de gala", type: "trajes", color: "Azul y rosa", sizes: ["S", "M", "L"], detail: "Gala · desfile", image: "IMG/Captura de pantalla 2026-10-29 122017.png" },
    { id: "suit-gray", name: "Traje gris", type: "trajes", color: "Gris", sizes: ["S", "M", "L"], detail: "Traje de fiesta", image: "IMG/Captura de pantalla 2026-10-29 122025.png" },
    { id: "dress-navy", name: "Vestido azul noche", type: "vestidos", color: "Azul noche", sizes: ["S", "M", "L"], detail: "Largo · bordado", image: "IMG/Captura de pantalla 2026-10-29 122052.png" }
  ];

  const defaultSettings = {
    bank: "DATO DE MUESTRA",
    alias: "ALIAS-DE-EJEMPLO",
    holder: "TITULAR DE EJEMPLO",
    phone: ""
  };
  const typeNames = { vestidos: "Vestido", trajes: "Traje" };
  const reservationStatuses = {
    pending_payment: "Seña pendiente",
    reserved: "Reservado",
    delivered: "Retirado",
    returned: "Devuelto",
    cancelled: "Cancelado"
  };
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "Único"];

  const elements = {
    catalog: document.getElementById("product-grid"),
    emptyState: document.getElementById("empty-state"),
    filterButtons: [...document.querySelectorAll(".filter")],
    colorFilter: document.getElementById("filter-color"),
    sizeFilter: document.getElementById("filter-size"),
    bookingDialog: document.getElementById("booking-dialog"),
    bookingForm: document.getElementById("booking-form"),
    bookingFormStage: document.getElementById("booking-form-stage"),
    paymentStage: document.getElementById("payment-stage"),
    paymentDescription: document.getElementById("payment-description"),
    bookingProductName: document.getElementById("booking-product-name"),
    bookingSize: document.getElementById("booking-size"),
    eventDate: document.getElementById("booking-event-date"),
    fittingDate: document.getElementById("fitting-date"),
    bookingError: document.getElementById("booking-error"),
    paymentAlias: document.getElementById("payment-alias"),
    paymentBank: document.getElementById("payment-bank"),
    paymentHolder: document.getElementById("payment-holder"),
    paymentProof: document.getElementById("payment-proof"),
    whatsappNotice: document.getElementById("whatsapp-notice"),
    sendWhatsapp: document.getElementById("send-whatsapp"),
    paymentMessage: document.getElementById("payment-message"),
    adminPanel: document.getElementById("admin-panel"),
    rentalList: document.getElementById("rental-list"),
    inventoryList: document.getElementById("inventory-list"),
    productForm: document.getElementById("product-form"),
    productMessage: document.getElementById("product-message"),
    settingsForm: document.getElementById("settings-form"),
    settingsMessage: document.getElementById("settings-message"),
    storageError: document.getElementById("storage-error"),
    menuToggle: document.querySelector(".menu-toggle"),
    nav: document.getElementById("primary-nav")
  };

  function showStorageError(message) {
    elements.storageError.textContent = message;
    elements.storageError.hidden = false;
  }

  function readStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? fallback : JSON.parse(saved);
    } catch (error) {
      console.error(`No se pudo leer ${key} desde el almacenamiento local.`, error);
      showStorageError("No se pudieron leer los datos guardados en este navegador. La demo continúa con valores iniciales.");
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`No se pudo guardar ${key} en el almacenamiento local.`, error);
      showStorageError("No se pudieron guardar los cambios en este navegador. Liberá espacio o probá con menos datos.");
      return false;
    }
  }

  let products = readStorage(STORAGE_KEYS.products, defaultProducts);
  let reservations = readStorage(STORAGE_KEYS.reservations, []);
  let settings = { ...defaultSettings, ...readStorage(STORAGE_KEYS.settings, {}) };
  const favorites = new Set(readStorage(STORAGE_KEYS.favorites, []));
  let activeTypeFilter = "todos";
  let selectedProductId = null;
  let activeReservationId = null;
  let lastFocusedElement = null;
  let activeDialog = null;

  if (!Array.isArray(products)) products = defaultProducts;
  if (!Array.isArray(reservations)) reservations = [];

  function getProduct(productId) {
    return products.find((product) => product.id === productId);
  }

  function formatDate(value) {
    if (!value) return "A confirmar";
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }

  function addDays(value, days) {
    const date = new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function normalizedText(value) {
    return String(value || "").trim().toLocaleLowerCase("es-AR");
  }

  function createIconHeart() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M20.8 8.7c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z");
    svg.append(path);
    return svg;
  }

  function renderCatalog() {
    elements.catalog.replaceChildren();
    products.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.dataset.productId = product.id;
      card.dataset.type = product.type;

      const photo = document.createElement("div");
      photo.className = "product-photo";
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = `${product.name}, ${product.color}`;
      image.loading = "lazy";
      photo.append(image);

      const tag = document.createElement("span");
      tag.className = "product-tag";
      tag.textContent = typeNames[product.type] || "Prenda";
      photo.append(tag);

      const favorite = document.createElement("button");
      favorite.className = "favorite";
      favorite.type = "button";
      favorite.setAttribute("aria-label", `Agregar ${product.name} a favoritos`);
      favorite.setAttribute("aria-pressed", String(favorites.has(product.id)));
      favorite.dataset.favoriteId = product.id;
      favorite.append(createIconHeart());
      photo.append(favorite);

      const info = document.createElement("div");
      info.className = "product-info";
      const title = document.createElement("h3");
      title.textContent = product.name;
      info.append(title);

      const details = document.createElement("div");
      details.className = "product-details";
      const color = document.createElement("span");
      color.className = "product-detail";
      color.textContent = product.color;
      details.append(color);
      const sizes = document.createElement("span");
      sizes.className = "product-detail";
      sizes.textContent = `Talle ${product.sizes.length ? product.sizes.join(" · ") : "a confirmar"}`;
      details.append(sizes);
      if (product.detail) {
        const detail = document.createElement("span");
        detail.className = "product-detail";
        detail.textContent = product.detail;
        details.append(detail);
      }
      info.append(details);

      const description = document.createElement("p");
      description.textContent = "Talles y disponibilidad de muestra · Confirmar con Euforia";
      info.append(description);

      const reserve = document.createElement("button");
      reserve.className = "button product-contact";
      reserve.type = "button";
      reserve.dataset.reserveId = product.id;
      reserve.append(document.createTextNode("Consultar alquiler "));
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      reserve.append(arrow);
      info.append(reserve);

      card.append(photo, info);
      elements.catalog.append(card);
    });
    updateFilterOptions();
    updateCatalog();
  }

  function updateFilterOptions() {
    const selectedColor = elements.colorFilter.value;
    const selectedSize = elements.sizeFilter.value;
    const colors = [...new Set(products.map((product) => product.color).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"));
    const sizes = [...new Set(products.flatMap((product) => product.sizes || []))]
      .sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));

    elements.colorFilter.replaceChildren(new Option("Todos los colores", "todos"));
    colors.forEach((color) => elements.colorFilter.add(new Option(color, color)));
    if (colors.includes(selectedColor)) elements.colorFilter.value = selectedColor;

    elements.sizeFilter.replaceChildren(new Option("Todos los talles", "todos"));
    sizes.forEach((size) => elements.sizeFilter.add(new Option(size, size)));
    if (sizes.includes(selectedSize)) elements.sizeFilter.value = selectedSize;
  }

  function updateCatalog() {
    let visibleCount = 0;
    const chosenColor = normalizedText(elements.colorFilter.value);
    const chosenSize = elements.sizeFilter.value;
    const cards = [...elements.catalog.querySelectorAll(".product-card")];

    cards.forEach((card) => {
      const product = getProduct(card.dataset.productId);
      if (!product) {
        card.hidden = true;
        return;
      }
      const matchesType = activeTypeFilter === "todos" || activeTypeFilter === "favoritos" ||
        product.type === activeTypeFilter;
      const matchesFavorite = activeTypeFilter !== "favoritos" || favorites.has(product.id);
      const matchesColor = chosenColor === "todos" || normalizedText(product.color) === chosenColor;
      const matchesSize = chosenSize === "todos" || product.sizes.includes(chosenSize);
      card.hidden = !(matchesType && matchesFavorite && matchesColor && matchesSize);
      if (!card.hidden) visibleCount += 1;
    });

    elements.emptyState.style.display = visibleCount === 0 ? "block" : "none";
    elements.emptyState.textContent = activeTypeFilter === "favoritos"
      ? "No hay favoritos que coincidan con estos filtros."
      : "No encontramos prendas con esos filtros. Consultá talles y colores disponibles.";
    elements.filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeTypeFilter));
    });
  }

  function closeMenu() {
    elements.menuToggle.setAttribute("aria-expanded", "false");
    elements.nav.classList.remove("is-open");
  }

  function setTypeFilter(filter) {
    activeTypeFilter = filter;
    updateCatalog();
    closeMenu();
  }

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => setTypeFilter(button.dataset.filter));
  });
  elements.colorFilter.addEventListener("change", updateCatalog);
  elements.sizeFilter.addEventListener("change", updateCatalog);
  document.querySelectorAll("[data-filter-link]").forEach((link) => {
    link.addEventListener("click", () => {
      setTypeFilter(link.dataset.filterLink);
    });
  });

  function openDialog(dialog) {
    lastFocusedElement = document.activeElement;
    activeDialog = dialog;
    dialog.classList.add("is-open");
    document.body.style.overflow = "hidden";
    dialog.querySelector(".dialog-close").focus();
  }

  function closeDialog() {
    if (!activeDialog) return;
    activeDialog.classList.remove("is-open");
    activeDialog = null;
    document.body.style.overflow = "";
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  document.querySelectorAll(".dialog-close").forEach((button) => {
    button.addEventListener("click", closeDialog);
  });
  document.querySelectorAll(".dialog-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeDialog();
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeDialog) closeDialog();
    if (event.key !== "Tab" || !activeDialog) return;
    const focusable = [...activeDialog.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]")]
      .filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  function openBooking(productId, button) {
    const product = getProduct(productId);
    if (!product) {
      showStorageError("No encontramos esa prenda. Actualizá el catálogo e intentá de nuevo.");
      return;
    }
    selectedProductId = product.id;
    elements.bookingProductName.textContent = product.name;
    elements.bookingSize.replaceChildren();
    const sizes = product.sizes.length ? product.sizes : ["A confirmar"];
    sizes.forEach((size) => elements.bookingSize.add(new Option(size, size)));
    elements.bookingForm.reset();
    elements.bookingSize.value = sizes[0];
    elements.bookingError.textContent = "";
    elements.paymentMessage.textContent = "";
    elements.bookingFormStage.hidden = false;
    elements.paymentStage.hidden = true;
    elements.paymentProof.value = "";
    const minimumDate = addDays(new Date().toISOString().slice(0, 10), 2);
    elements.eventDate.min = minimumDate;
    elements.eventDate.value = "";
    elements.fittingDate.textContent = "Elegí la fecha para calcular el día sugerido de prueba.";
    openDialog(elements.bookingDialog);
    elements.bookingForm.querySelector("input").focus();
    if (button) button.dataset.lastOpened = product.id;
  }

  elements.catalog.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-favorite-id]");
    if (favoriteButton) {
      const id = favoriteButton.dataset.favoriteId;
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      if (!saveStorage(STORAGE_KEYS.favorites, [...favorites])) return;
      favoriteButton.setAttribute("aria-pressed", String(favorites.has(id)));
      updateCatalog();
      return;
    }
    const reserveButton = event.target.closest("[data-reserve-id]");
    if (reserveButton) openBooking(reserveButton.dataset.reserveId, reserveButton);
  });

  elements.eventDate.addEventListener("change", () => {
    if (!elements.eventDate.value) return;
    elements.fittingDate.textContent = `Día sugerido para probarlo: ${formatDate(addDays(elements.eventDate.value, -2))} (dos días antes del evento).`;
  });

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  elements.bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    elements.bookingError.textContent = "";
    const formData = new FormData(elements.bookingForm);
    const eventDate = String(formData.get("eventDate") || "");
    const product = getProduct(selectedProductId);
    if (!product || !eventDate) {
      elements.bookingError.textContent = "Revisá la prenda y la fecha elegida.";
      return;
    }
    const blockedStatuses = new Set(["pending_payment", "reserved", "delivered"]);
    const alreadyRequested = reservations.some((reservation) =>
      reservation.productId === product.id &&
      reservation.eventDate === eventDate &&
      blockedStatuses.has(reservation.status)
    );
    if (alreadyRequested) {
      elements.bookingError.textContent = "Ya hay una solicitud para esa prenda y fecha en esta demo. Elegí otra fecha o consultá con Euforia.";
      return;
    }

    const reservation = {
      id: createId("reservation"),
      productId: product.id,
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      size: String(formData.get("size") || ""),
      eventDate,
      fittingDate: addDays(eventDate, -2),
      status: "pending_payment",
      paymentStatus: "pending",
      createdAt: new Date().toISOString()
    };
    const updatedReservations = [reservation, ...reservations];
    if (!saveStorage(STORAGE_KEYS.reservations, updatedReservations)) return;
    reservations = updatedReservations;
    activeReservationId = reservation.id;
    renderAdmin();
    elements.paymentBank.textContent = settings.bank || "A configurar";
    elements.paymentHolder.textContent = settings.holder || "A configurar";
    elements.paymentAlias.textContent = settings.alias || "ALIAS-A-CONFIGURAR";
    elements.paymentDescription.textContent =
      `Solicitud para ${product.name} el ${formatDate(reservation.eventDate)}; prueba sugerida ${formatDate(reservation.fittingDate)}. ` +
      "Euforia debe confirmar disponibilidad y el monto de la seña antes de transferir.";
    elements.bookingFormStage.hidden = true;
    elements.paymentStage.hidden = false;
    elements.paymentStage.querySelector("h2").focus();
    updateWhatsAppState();
  });

  function activeReservation() {
    return reservations.find((reservation) => reservation.id === activeReservationId);
  }

  function buildWhatsAppMessage(reservation) {
    const product = getProduct(reservation.productId);
    const name = `${reservation.firstName} ${reservation.lastName}`.trim();
    return [
      `Hola Euforia, soy ${name}.`,
      `Quiero consultar mi solicitud de alquiler de ${product ? product.name : "una prenda"}.`,
      `Evento: ${formatDate(reservation.eventDate)}.`,
      `Prueba sugerida: ${formatDate(reservation.fittingDate)}.`,
      `Talle: ${reservation.size}.`,
      "Adjunto el comprobante de transferencia para que puedan verificarlo.",
      "Entiendo que la fecha queda pendiente de confirmación."
    ].join("\n");
  }

  function updateWhatsAppState() {
    const hasPhone = settings.phone.replace(/\D/g, "").length >= 8;
    const hasProof = elements.paymentProof.files.length > 0;
    elements.sendWhatsapp.disabled = !(hasPhone && hasProof);
    elements.whatsappNotice.textContent = hasPhone
      ? (hasProof
        ? "Se abrirá WhatsApp con el mensaje. Adjuntá allí el comprobante seleccionado; este prototipo no puede adjuntarlo automáticamente."
        : "Seleccioná el comprobante y luego adjuntalo manualmente en WhatsApp.")
      : "El WhatsApp de Euforia todavía no está configurado. Copiá el mensaje o completá el número de ejemplo en Administración.";
  }

  elements.paymentProof.addEventListener("change", updateWhatsAppState);
  document.getElementById("send-whatsapp").addEventListener("click", () => {
    const reservation = activeReservation();
    if (!reservation || !elements.paymentProof.files.length) return;
    const phone = settings.phone.replace(/\D/g, "");
    if (phone.length < 8) {
      elements.paymentMessage.textContent = "Falta configurar un WhatsApp válido en Administración.";
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(reservation))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    elements.paymentMessage.textContent = "WhatsApp se abrió. Adjuntá allí el archivo del comprobante para enviarlo.";
  });

  async function copyText(text, statusElement, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      statusElement.textContent = successMessage;
    } catch (error) {
      console.error("No se pudo copiar al portapapeles.", error);
      statusElement.textContent = "El navegador no permitió copiar. Seleccioná el texto y copialo manualmente.";
    }
  }

  document.getElementById("copy-alias").addEventListener("click", () => {
    copyText(settings.alias || "ALIAS-A-CONFIGURAR", elements.paymentMessage, "Alias de ejemplo copiado. No realizar transferencias.");
  });
  document.getElementById("copy-whatsapp-message").addEventListener("click", () => {
    const reservation = activeReservation();
    if (!reservation) return;
    copyText(buildWhatsAppMessage(reservation), elements.paymentMessage, "Mensaje copiado. Recordá adjuntar el comprobante manualmente.");
  });

  const rentalStatusOptions = Object.entries(reservationStatuses);

  function makeFieldSelect(label, value, options, onChange) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field";
    const labelElement = document.createElement("label");
    const select = document.createElement("select");
    const id = createId("field");
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    select.id = id;
    options.forEach(([optionValue, optionLabel]) => select.add(new Option(optionLabel, optionValue)));
    select.value = value;
    select.addEventListener("change", () => onChange(select.value));
    wrapper.append(labelElement, select);
    return wrapper;
  }

  function updateReservation(id, changes) {
    reservations = reservations.map((reservation) =>
      reservation.id === id ? { ...reservation, ...changes } : reservation
    );
    if (saveStorage(STORAGE_KEYS.reservations, reservations)) {
      renderAdmin();
      updateCatalog();
    }
  }

  function renderReservations() {
    elements.rentalList.replaceChildren();
    const visibleReservations = reservations.filter((reservation) => reservation.status !== "cancelled");
    if (visibleReservations.length === 0) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "Todavía no hay solicitudes. Las reservas de muestra aparecerán aquí.";
      elements.rentalList.append(empty);
      return;
    }

    visibleReservations.forEach((reservation) => {
      const product = getProduct(reservation.productId);
      const row = document.createElement("article");
      row.className = "admin-row";
      const image = document.createElement("img");
      image.src = product ? product.image : "";
      image.alt = product ? product.name : "Prenda eliminada del catálogo";
      image.loading = "lazy";

      const productInfo = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = product ? product.name : "Prenda eliminada";
      const eventInfo = document.createElement("small");
      eventInfo.textContent = `Evento ${formatDate(reservation.eventDate)} · Prueba ${formatDate(reservation.fittingDate)} · Talle ${reservation.size}`;
      productInfo.append(title, eventInfo);

      const customerInfo = document.createElement("div");
      const customer = document.createElement("strong");
      customer.textContent = `${reservation.firstName} ${reservation.lastName}`.trim();
      const phone = document.createElement("small");
      phone.textContent = `Celular: ${reservation.phone}`;
      customerInfo.append(customer, phone);

      const payment = makeFieldSelect("Pago", reservation.paymentStatus || "pending", [
        ["pending", "Seña pendiente"],
        ["paid", "Seña verificada"]
      ], (value) => updateReservation(reservation.id, { paymentStatus: value }));
      const status = makeFieldSelect("Estado", reservation.status, rentalStatusOptions,
        (value) => updateReservation(reservation.id, { status: value }));
      const rowActions = document.createElement("div");
      rowActions.className = "row-actions";
      const dateNote = document.createElement("small");
      dateNote.textContent = `Solicitud ${formatDate(reservation.createdAt.slice(0, 10))}`;
      rowActions.append(dateNote);
      row.append(image, productInfo, customerInfo, payment, status, rowActions);
      elements.rentalList.append(row);
    });
  }

  function removeProduct(productId) {
    const hasActiveReservation = reservations.some((reservation) =>
      reservation.productId === productId &&
      !["returned", "cancelled"].includes(reservation.status)
    );
    if (hasActiveReservation) {
      elements.productMessage.textContent = "No se puede quitar una prenda con reservas activas. Marcá primero el alquiler como devuelto o cancelado.";
      return;
    }
    if (!window.confirm("¿Querés quitar esta prenda del catálogo de demostración?")) return;
    products = products.filter((product) => product.id !== productId);
    favorites.delete(productId);
    if (!saveStorage(STORAGE_KEYS.products, products) ||
        !saveStorage(STORAGE_KEYS.favorites, [...favorites])) return;
    renderCatalog();
    renderAdmin();
    elements.productMessage.textContent = "Prenda quitada del catálogo.";
  }

  function renderInventory() {
    elements.inventoryList.replaceChildren();
    if (products.length === 0) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "El catálogo está vacío. Agregá una prenda con el formulario.";
      elements.inventoryList.append(empty);
      return;
    }
    products.forEach((product) => {
      const row = document.createElement("article");
      row.className = "admin-row admin-product-row";
      const image = document.createElement("img");
      image.src = product.image;
      image.alt = product.name;
      image.loading = "lazy";

      const title = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const kind = document.createElement("small");
      kind.textContent = typeNames[product.type] || "Prenda";
      title.append(name, kind);

      const color = document.createElement("small");
      color.textContent = `Color: ${product.color}`;
      const sizes = document.createElement("small");
      sizes.textContent = `Talles: ${product.sizes.join(", ") || "A confirmar"}`;
      const actions = document.createElement("div");
      actions.className = "row-actions";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button button-outline";
      remove.textContent = "Quitar";
      remove.addEventListener("click", () => removeProduct(product.id));
      actions.append(remove);
      row.append(image, title, color, sizes, actions);
      elements.inventoryList.append(row);
    });
  }

  function renderAdmin() {
    const active = reservations.filter((reservation) => reservation.status !== "cancelled");
    document.getElementById("stat-pending").textContent = String(
      active.filter((reservation) => reservation.paymentStatus !== "paid").length
    );
    document.getElementById("stat-rented").textContent = String(
      active.filter((reservation) => reservation.status === "delivered").length
    );
    document.getElementById("stat-returned").textContent = String(
      active.filter((reservation) => reservation.status === "returned").length
    );
    renderReservations();
    renderInventory();
  }

  elements.productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.productForm);
    const image = String(formData.get("image") || "").trim();
    if (!image || (!image.startsWith("IMG/") && !/^https?:\/\//i.test(image))) {
      elements.productMessage.textContent = "Usá una ruta dentro de IMG/ o una dirección HTTPS válida.";
      return;
    }
    const newProduct = {
      id: createId("product"),
      name: String(formData.get("name") || "").trim(),
      type: String(formData.get("type") || "vestidos"),
      color: String(formData.get("color") || "").trim(),
      sizes: String(formData.get("sizes") || "").split(",").map((size) => size.trim()).filter(Boolean),
      detail: String(formData.get("detail") || "").trim(),
      image
    };
    products = [newProduct, ...products];
    if (!saveStorage(STORAGE_KEYS.products, products)) return;
    renderCatalog();
    renderAdmin();
    elements.productForm.reset();
    elements.productMessage.textContent = "Prenda agregada al catálogo de muestra.";
  });

  function populateSettingsForm() {
    elements.settingsForm.elements.bank.value = settings.bank;
    elements.settingsForm.elements.alias.value = settings.alias;
    elements.settingsForm.elements.holder.value = settings.holder;
    elements.settingsForm.elements.phone.value = settings.phone;
  }

  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.settingsForm);
    const phone = String(formData.get("phone") || "").trim();
    const digits = phone.replace(/\D/g, "");
    if (phone && (digits.length < 8 || digits.length > 15)) {
      elements.settingsMessage.textContent = "El número de WhatsApp debe tener entre 8 y 15 dígitos con código de país.";
      return;
    }
    settings = {
      bank: String(formData.get("bank") || "").trim(),
      alias: String(formData.get("alias") || "").trim(),
      holder: String(formData.get("holder") || "").trim(),
      phone
    };
    if (!saveStorage(STORAGE_KEYS.settings, settings)) return;
    elements.settingsMessage.textContent = "Datos guardados solo en este navegador de demostración.";
    if (!elements.paymentStage.hidden) {
      elements.paymentBank.textContent = settings.bank || "A configurar";
      elements.paymentHolder.textContent = settings.holder || "A configurar";
      elements.paymentAlias.textContent = settings.alias || "ALIAS-A-CONFIGURAR";
      updateWhatsAppState();
    }
  });

  function showAdmin() {
    elements.adminPanel.hidden = false;
    elements.adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    renderAdmin();
    closeMenu();
  }

  document.getElementById("admin-open").addEventListener("click", showAdmin);
  document.getElementById("admin-close").addEventListener("click", () => {
    elements.adminPanel.hidden = true;
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.menuToggle.addEventListener("click", () => {
    const isOpen = elements.menuToggle.getAttribute("aria-expanded") === "true";
    elements.menuToggle.setAttribute("aria-expanded", String(!isOpen));
    elements.nav.classList.toggle("is-open", !isOpen);
  });

  document.querySelectorAll("[data-contact]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = document.getElementById("contact-dialog");
      openDialog(dialog);
    });
  });
  const video = document.querySelector(".hero-video");
  video.addEventListener("canplay", () => video.classList.add("is-ready"), { once: true });
  video.addEventListener("error", () => {
    document.querySelector(".hero").classList.add("video-fallback");
  }, { once: true });

  document.getElementById("year").textContent = String(new Date().getFullYear());
  populateSettingsForm();
  renderCatalog();
  renderAdmin();
  updateWhatsAppState();
})();
