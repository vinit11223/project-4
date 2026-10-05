import { getProducts, getCategories } from "./api.js";

const state = {
  products: [],
  categories: [],
  activeCategory: "all",
  search: "",
  sort: "featured",
  cart: loadCart()
};

const elements = {
  grid: document.querySelector("#product-grid"),
  loading: document.querySelector("#loading-state"),
  empty: document.querySelector("#empty-state"),
  categories: document.querySelector("#category-tabs"),
  search: document.querySelector("#search"),
  clearSearch: document.querySelector("#clear-search"),
  sort: document.querySelector("#sort"),
  resultCount: document.querySelector("#result-count"),
  errorBanner: document.querySelector("#error-banner"),
  errorMessage: document.querySelector("#error-message"),
  retry: document.querySelector("#retry-button"),
  connection: document.querySelector("#connection-status"),
  cartButton: document.querySelector("#cart-button"),
  cartCount: document.querySelector("#cart-count"),
  cartPanel: document.querySelector("#cart-panel"),
  cartBackdrop: document.querySelector("#cart-backdrop"),
  closeCart: document.querySelector("#close-cart"),
  cartItems: document.querySelector("#cart-items"),
  cartTotal: document.querySelector("#cart-total"),
  checkout: document.querySelector("#checkout-button"),
  reset: document.querySelector("#reset-filters")
};

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("dynamic-store-cart")) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("dynamic-store-cart", JSON.stringify(state.cart));
}

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatCategory(category) {
  return category
    .replace(/^men's/i, "Men's")
    .replace(/^women's/i, "Women's")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function setLoading(isLoading) {
  elements.loading.hidden = !isLoading;
  if (isLoading) {
    elements.grid.innerHTML = "";
    elements.empty.hidden = true;
    elements.resultCount.textContent = "Loading products…";
  }
}

function showError(error) {
  elements.errorBanner.hidden = false;
  elements.errorMessage.textContent =
    error?.message || "The catalog could not be loaded. Please try again.";
  elements.connection.textContent = "Offline";
}

function hideError() {
  elements.errorBanner.hidden = true;
}

function renderCategories() {
  const categories = ["all", ...state.categories];

  elements.categories.innerHTML = categories.map((category, index) => `
    <button
      class="category-tab ${state.activeCategory === category ? "active" : ""}"
      type="button"
      role="tab"
      aria-selected="${state.activeCategory === category}"
      tabindex="${state.activeCategory === category ? "0" : "-1"}"
      data-category="${escapeAttribute(category)}">
      ${category === "all" ? "All products" : formatCategory(category)}
    </button>
  `).join("");

  elements.categories.querySelectorAll("[role=tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      state.activeCategory = tab.dataset.category;
      renderCategories();
      renderProducts();
    });

    tab.addEventListener("keydown", event => {
      const tabs = [...elements.categories.querySelectorAll("[role=tab]")];
      const current = tabs.indexOf(tab);

      if (event.key === "ArrowRight") {
        event.preventDefault();
        tabs[(current + 1) % tabs.length].focus();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        tabs[(current - 1 + tabs.length) % tabs.length].focus();
      }
    });
  });
}

function filteredProducts() {
  let result = [...state.products];

  if (state.activeCategory !== "all") {
    result = result.filter(product => product.category === state.activeCategory);
  }

  const query = state.search.trim().toLowerCase();
  if (query) {
    result = result.filter(product =>
      product.title.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }

  switch (state.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      result.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
      break;
    case "name":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
  }

  return result;
}

function renderProducts() {
  const products = filteredProducts();
  elements.loading.hidden = true;
  elements.resultCount.textContent =
    `${products.length} ${products.length === 1 ? "product" : "products"}`;

  elements.empty.hidden = products.length !== 0;

  if (!products.length) {
    elements.grid.innerHTML = "";
    return;
  }

  elements.grid.innerHTML = products.map(product => {
    const rating = product.rating?.rate ?? 0;
    const count = product.rating?.count ?? 0;

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img
            src="${escapeAttribute(product.image)}"
            alt="${escapeAttribute(product.title)}"
            loading="lazy">
          <span class="category-badge">${escapeHTML(formatCategory(product.category))}</span>
        </div>
        <div class="product-body">
          <p class="product-category">${escapeHTML(formatCategory(product.category))}</p>
          <h3>${escapeHTML(product.title)}</h3>
          <div class="rating" aria-label="Rated ${rating} out of 5 from ${count} reviews">
            <span aria-hidden="true">★</span>
            <strong>${rating.toFixed(1)}</strong>
            <span>(${count})</span>
          </div>
          <div class="product-bottom">
            <strong class="price">${money(product.price)}</strong>
            <button class="add-button" type="button" data-add="${product.id}">
              Add to cart
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  elements.grid.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });
}

function addToCart(productId) {
  const product = state.products.find(item => item.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  saveCart();
  renderCart();
}

function changeQuantity(productId, amount) {
  const item = state.cart.find(entry => entry.id === productId);
  if (!item) return;

  item.quantity += amount;
  if (item.quantity <= 0) removeFromCart(productId);
  else {
    saveCart();
    renderCart();
  }
}

function renderCart() {
  const count = state.cart.reduce((total, item) => total + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  elements.cartCount.textContent = count;
  elements.cartTotal.textContent = money(total);

  if (!state.cart.length) {
    elements.cartItems.innerHTML = `<p class="cart-empty">Your cart is empty.</p>`;
    return;
  }

  elements.cartItems.innerHTML = state.cart.map(item => `
    <article class="cart-item">
      <img src="${escapeAttribute(item.image)}" alt="" loading="lazy">
      <div class="cart-item-info">
        <h3>${escapeHTML(item.title)}</h3>
        <strong>${money(item.price * item.quantity)}</strong>
        <div class="quantity-controls">
          <button type="button" aria-label="Decrease quantity of ${escapeAttribute(item.title)}" data-decrease="${item.id}">−</button>
          <span aria-label="Quantity">${item.quantity}</span>
          <button type="button" aria-label="Increase quantity of ${escapeAttribute(item.title)}" data-increase="${item.id}">+</button>
          <button class="remove-button" type="button" data-remove="${item.id}">Remove</button>
        </div>
      </div>
    </article>
  `).join("");

  elements.cartItems.querySelectorAll("[data-decrease]").forEach(button => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.decrease), -1));
  });

  elements.cartItems.querySelectorAll("[data-increase]").forEach(button => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.increase), 1));
  });

  elements.cartItems.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => removeFromCart(Number(button.dataset.remove)));
  });
}

function openCart() {
  elements.cartPanel.classList.add("open");
  elements.cartPanel.setAttribute("aria-hidden", "false");
  elements.cartButton.setAttribute("aria-expanded", "true");
  elements.cartBackdrop.hidden = false;
  elements.closeCart.focus();
}

function closeCart() {
  elements.cartPanel.classList.remove("open");
  elements.cartPanel.setAttribute("aria-hidden", "true");
  elements.cartButton.setAttribute("aria-expanded", "false");
  elements.cartBackdrop.hidden = true;
  elements.cartButton.focus();
}

function resetFilters() {
  state.activeCategory = "all";
  state.search = "";
  state.sort = "featured";
  elements.search.value = "";
  elements.sort.value = "featured";
  elements.clearSearch.hidden = true;
  renderCategories();
  renderProducts();
}

async function loadCatalog() {
  setLoading(true);
  hideError();

  try {
    const [products, categories] = await Promise.all([
      getProducts(),
      getCategories()
    ]);

    state.products = products;
    state.categories = categories;
    elements.connection.textContent = "API connected";
    renderCategories();
    renderProducts();
  } catch (error) {
    setLoading(false);
    showError(error);
  }
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

elements.search.addEventListener("input", event => {
  state.search = event.target.value;
  elements.clearSearch.hidden = !state.search;
  renderProducts();
});

elements.clearSearch.addEventListener("click", () => {
  state.search = "";
  elements.search.value = "";
  elements.clearSearch.hidden = true;
  elements.search.focus();
  renderProducts();
});

elements.sort.addEventListener("change", event => {
  state.sort = event.target.value;
  renderProducts();
});

elements.retry.addEventListener("click", loadCatalog);
elements.reset.addEventListener("click", resetFilters);
elements.cartButton.addEventListener("click", openCart);
elements.closeCart.addEventListener("click", closeCart);
elements.cartBackdrop.addEventListener("click", closeCart);

elements.checkout.addEventListener("click", () => {
  if (!state.cart.length) return;
  alert("Demo checkout: no payment is processed.");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && elements.cartPanel.classList.contains("open")) {
    closeCart();
  }
});

renderCart();
loadCatalog();
