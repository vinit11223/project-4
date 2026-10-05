# Dynamic JavaScript DOM Logic & RESTful API Client

A modular ES6+ JavaScript application that consumes the public Fake Store API and demonstrates asynchronous REST calls, dynamic DOM rendering, search/category/sort filters, localStorage state caching, loading skeletons, and user-friendly error handling.

## Assignment requirements

- `async/await` + `fetch()` against a public REST API
- Real-time search filtering without page reload
- Category tabs
- Sorting logic
- Dynamic DOM updates
- Client-side localStorage cart state
- Error banner and retry action
- Loading skeleton state
- Modular JavaScript files: `app.js` and `api.js`

## Run locally

This is a static frontend.

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

The browser needs internet access because products are loaded from the Fake Store API.

## API

The client uses:

```text
https://fakestoreapi.com/products
https://fakestoreapi.com/products/categories
```

## Features

### Search
Type in the search box. Results update immediately in the DOM.

### Categories
Select All, Electronics, Jewelry, Men's clothing, or Women's clothing.

### Sort
Sort by price ascending/descending or rating.

### Cart
Add/remove products and adjust quantities. The cart is persisted in `localStorage` under:

```text
dynamic-store-cart
```

### Error handling
If the API request fails, a visible error banner appears with a Retry button.

## Expected proof

GitHub repository containing:
- `index.html`
- `styles.css`
- `api.js`
- `app.js`
- working REST API integration
- screenshots of loading, filtering, sorting and cart behavior
