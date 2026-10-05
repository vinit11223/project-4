const API_BASE = "https://fakestoreapi.com";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Accept": "application/json" }
  });

  if (!response.ok) {
    throw new Error(`API request failed with HTTP ${response.status}.`);
  }

  return response.json();
}

export async function getProducts() {
  return request("/products");
}

export async function getCategories() {
  return request("/products/categories");
}

export async function getProductsByCategory(category) {
  return request(`/products/category/${encodeURIComponent(category)}`);
}
