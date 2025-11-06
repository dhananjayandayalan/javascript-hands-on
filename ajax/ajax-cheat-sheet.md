# AJAX Quick Reference Cheat Sheet

## Table of Contents
1. [HTTP Methods Overview](#http-methods-overview)
2. [Fetch API Quick Reference](#fetch-api-quick-reference)
3. [Async/Await Patterns](#asyncawait-patterns)
4. [Error Handling](#error-handling)
5. [Common Patterns](#common-patterns)
6. [Status Codes](#status-codes)
7. [When to Use What](#when-to-use-what)

---

## HTTP Methods Overview

| Method | Purpose | Idempotent | Safe | Body |
|--------|---------|-----------|------|------|
| GET | Retrieve data | ✅ | ✅ | ❌ |
| POST | Create resource | ❌ | ❌ | ✅ |
| PUT | Replace entire resource | ✅ | ❌ | ✅ |
| PATCH | Partial update | ❌ | ❌ | ✅ |
| DELETE | Remove resource | ✅ | ❌ | Optional |

---

## Fetch API Quick Reference

### Basic GET Request
```javascript
fetch('https://api.example.com/users')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### POST Request
```javascript
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### PUT Request (Full Update)
```javascript
fetch('https://api.example.com/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    name: 'Updated Name',
    email: 'updated@example.com'
  })
});
```

### PATCH Request (Partial Update)
```javascript
fetch('https://api.example.com/users/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newemail@example.com' // Only update email
  })
});
```

### DELETE Request
```javascript
fetch('https://api.example.com/users/1', {
  method: 'DELETE'
})
.then(response => {
  if (response.ok) console.log('Deleted!');
});
```

---

## Async/Await Patterns

### Basic Async/Await
```javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### Parallel Requests (Independent)
```javascript
async function loadAllData() {
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);

  return { users, posts, comments };
}
```

### Sequential Requests (Dependent)
```javascript
async function loadUserData() {
  // Step 1: Get user
  const user = await fetch('/api/user/1').then(r => r.json());

  // Step 2: Get user's posts (depends on user.id)
  const posts = await fetch(`/api/posts?userId=${user.id}`).then(r => r.json());

  // Step 3: Get comments (depends on posts[0].id)
  const comments = await fetch(`/api/comments?postId=${posts[0].id}`).then(r => r.json());

  return { user, posts, comments };
}
```

---

## Error Handling

### Comprehensive Error Handling
```javascript
async function fetchWithErrorHandling() {
  try {
    const response = await fetch('/api/data');

    // Check HTTP status
    if (!response.ok) {
      switch (response.status) {
        case 400: throw new Error('Bad Request');
        case 401: throw new Error('Unauthorized - Please login');
        case 403: throw new Error('Forbidden');
        case 404: throw new Error('Not Found');
        case 500: throw new Error('Server Error');
        default: throw new Error(`HTTP ${response.status}`);
      }
    }

    return await response.json();

  } catch (error) {
    // Handle different error types
    if (error.name === 'TypeError') {
      console.error('Network Error - Check connection');
    } else if (error.name === 'AbortError') {
      console.error('Request Cancelled');
    } else if (error.name === 'SyntaxError') {
      console.error('Invalid JSON');
    } else {
      console.error('Error:', error.message);
    }

    throw error;
  }
}
```

### Retry Logic
```javascript
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}
```

---

## Common Patterns

### Request with Timeout
```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

### Cancellable Request
```javascript
class CancellableRequest {
  constructor() {
    this.controller = null;
  }

  async fetch(url) {
    // Cancel previous request
    if (this.controller) {
      this.controller.abort();
    }

    this.controller = new AbortController();

    try {
      const response = await fetch(url, {
        signal: this.controller.signal
      });
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Request was cancelled
      }
      throw error;
    }
  }
}

// Usage
const request = new CancellableRequest();
await request.fetch('/api/search?q=term1');
await request.fetch('/api/search?q=term2'); // Cancels previous
```

### Debounced Search
```javascript
function debounce(func, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

const debouncedSearch = debounce(async (query) => {
  const response = await fetch(`/api/search?q=${query}`);
  const results = await response.json();
  displayResults(results);
}, 300);

// Usage with input
input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### Caching
```javascript
class RequestCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async fetch(url) {
    const cached = this.cache.get(url);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data; // Return cached
    }

    const response = await fetch(url);
    const data = await response.json();

    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new RequestCache(60000); // 1 minute
const users = await cache.fetch('/api/users');
```

### Authentication Headers
```javascript
async function fetchWithAuth(url) {
  const token = localStorage.getItem('token');

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    window.location.href = '/login';
    return;
  }

  return await response.json();
}
```

### Form Data Upload
```javascript
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', '123');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
    // Don't set Content-Type - browser sets it with boundary
  });

  return await response.json();
}
```

### File Upload with Progress (XHR)
```javascript
function uploadWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

// Usage
await uploadWithProgress(file, (percent) => {
  console.log(`Uploaded: ${percent.toFixed(2)}%`);
});
```

### API Service Class
```javascript
class APIService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  patch(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Usage
const api = new APIService('https://api.example.com');
const users = await api.get('/users');
const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' });
```

---

## Status Codes

### Success (2xx)
- **200 OK** - Request succeeded
- **201 Created** - Resource created successfully
- **204 No Content** - Success, but no response body

### Client Errors (4xx)
- **400 Bad Request** - Invalid request data
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - No permission
- **404 Not Found** - Resource doesn't exist
- **422 Unprocessable Entity** - Validation failed
- **429 Too Many Requests** - Rate limit exceeded

### Server Errors (5xx)
- **500 Internal Server Error** - Server error
- **502 Bad Gateway** - Invalid response from upstream
- **503 Service Unavailable** - Server temporarily down
- **504 Gateway Timeout** - Upstream timeout

---

## When to Use What

### XMLHttpRequest vs Fetch
```
┌────────────────────────────────────────────────────────┐
│ XMLHttpRequest                                         │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Need upload/download progress tracking             │
│   - Legacy browser support (IE10 and below)            │
│   - Working with old codebases                         │
│                                                         │
│ ❌ Avoid when:                                         │
│   - Building new modern applications                   │
│   - Want cleaner, promise-based syntax                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Fetch API                                              │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Modern browsers (95%+ support)                     │
│   - Want promise-based syntax                          │
│   - Building new applications                          │
│   - Need cleaner error handling                        │
│                                                         │
│ ❌ Limitations:                                        │
│   - No built-in progress tracking                      │
│   - Requires polyfill for older browsers               │
└────────────────────────────────────────────────────────┘
```

### Promises vs Async/Await
```
┌────────────────────────────────────────────────────────┐
│ Promises (.then/.catch)                                │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Simple one-off requests                            │
│   - Parallel requests with Promise.all()               │
│   - Chaining multiple operations                       │
│                                                         │
│ fetch('/api/users')                                    │
│   .then(r => r.json())                                 │
│   .then(data => console.log(data))                     │
│   .catch(error => console.error(error));               │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Async/Await                                            │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Complex logic with multiple requests               │
│   - Sequential dependent requests                      │
│   - Need cleaner, more readable code                   │
│   - Error handling with try/catch                      │
│                                                         │
│ async function loadData() {                            │
│   try {                                                │
│     const response = await fetch('/api/users');        │
│     const data = await response.json();                │
│     return data;                                       │
│   } catch (error) {                                    │
│     console.error(error);                              │
│   }                                                    │
│ }                                                      │
└────────────────────────────────────────────────────────┘
```

### PUT vs PATCH
```
┌────────────────────────────────────────────────────────┐
│ PUT - Replace Entire Resource                          │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Updating all fields of a resource                  │
│   - Replacing entire object                            │
│   - Have complete data available                       │
│                                                         │
│ Example:                                               │
│ PUT /api/users/1                                       │
│ {                                                      │
│   "id": 1,                                             │
│   "name": "Updated Name",                              │
│   "email": "updated@example.com",                      │
│   "age": 30,                                           │
│   "address": "..."                                     │
│ }                                                      │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ PATCH - Partial Update                                 │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Updating only specific fields                      │
│   - Don't want to send entire object                   │
│   - Bandwidth optimization                             │
│                                                         │
│ Example:                                               │
│ PATCH /api/users/1                                     │
│ {                                                      │
│   "email": "newemail@example.com"                      │
│ }                                                      │
│                                                         │
│ Only email is updated, other fields remain unchanged   │
└────────────────────────────────────────────────────────┘
```

### Parallel vs Sequential Requests
```
┌────────────────────────────────────────────────────────┐
│ Parallel (Promise.all)                                 │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Requests are independent                           │
│   - Want fastest execution time                        │
│   - Data doesn't depend on each other                  │
│                                                         │
│ const [users, posts, settings] = await Promise.all([   │
│   fetch('/api/users').then(r => r.json()),             │
│   fetch('/api/posts').then(r => r.json()),             │
│   fetch('/api/settings').then(r => r.json())           │
│ ]);                                                    │
│                                                         │
│ ⚡ All requests start simultaneously                   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Sequential (await one by one)                          │
├────────────────────────────────────────────────────────┤
│ ✅ Use when:                                           │
│   - Requests depend on previous responses              │
│   - Need data from first request for second            │
│   - Order matters                                      │
│                                                         │
│ const user = await fetch('/api/user/1').then(r => r.json());│
│ const posts = await fetch(`/api/posts?userId=${user.id}`)   │
│                     .then(r => r.json());              │
│ const comments = await fetch(`/api/comments?postId=${posts[0].id}`)│
│                     .then(r => r.json());              │
│                                                         │
│ ⏱️ Each request waits for previous to complete         │
└────────────────────────────────────────────────────────┘
```

---

## Real-World Use Cases

### E-commerce
```javascript
// Add to cart
await api.post('/cart/items', { productId: 123, quantity: 2 });

// Update cart item quantity
await api.patch('/cart/items/456', { quantity: 5 });

// Remove from cart
await api.delete('/cart/items/456');

// Checkout
await api.post('/orders', { cartId: 789, paymentMethod: 'card' });
```

### User Authentication
```javascript
// Login
const { token, user } = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});
localStorage.setItem('token', token);

// Fetch protected resource
const profile = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json());

// Logout
localStorage.removeItem('token');
await api.post('/auth/logout');
```

### Search & Filter
```javascript
// Search with debouncing
const searchInput = document.getElementById('search');
const debouncedSearch = debounce(async (query) => {
  const results = await api.get(`/search?q=${encodeURIComponent(query)}`);
  displayResults(results);
}, 300);

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});

// Filter products
const filters = {
  category: 'electronics',
  minPrice: 100,
  maxPrice: 500,
  inStock: true
};

const params = new URLSearchParams(filters);
const products = await api.get(`/products?${params}`);
```

### Pagination
```javascript
async function loadPage(page = 1, pageSize = 10) {
  const response = await fetch(
    `/api/posts?_page=${page}&_limit=${pageSize}`
  );

  const data = await response.json();
  const totalCount = response.headers.get('X-Total-Count');

  return {
    data,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}
```

### File Upload
```javascript
// Single file upload
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/users/avatar', {
    method: 'POST',
    body: formData
  });

  return await response.json();
}

// Multiple file upload
async function uploadFiles(files) {
  const formData = new FormData();

  for (let file of files) {
    formData.append('files', file);
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  return await response.json();
}
```

---

## Best Practices

### ✅ Do's
- Always check `response.ok` before parsing
- Use async/await for cleaner code
- Implement proper error handling
- Add request timeouts
- Use debouncing for search inputs
- Cache responses when appropriate
- Set appropriate headers
- Use AbortController for cancellation
- Implement retry logic for failed requests
- Handle loading states in UI

### ❌ Don'ts
- Don't forget to handle errors
- Don't make unnecessary duplicate requests
- Don't ignore HTTP status codes
- Don't send sensitive data in GET params
- Don't forget CORS considerations
- Don't block UI without loading indicators
- Don't retry indefinitely
- Don't expose API keys in client code
- Don't parse response without checking status
- Don't forget to validate user input

---

## Performance Tips

1. **Use Parallel Requests** when possible
```javascript
// ❌ Slow - Sequential
const users = await fetch('/users').then(r => r.json());
const posts = await fetch('/posts').then(r => r.json());

// ✅ Fast - Parallel
const [users, posts] = await Promise.all([
  fetch('/users').then(r => r.json()),
  fetch('/posts').then(r => r.json())
]);
```

2. **Implement Caching**
```javascript
const cache = new Map();
function getCachedData(url) {
  if (cache.has(url)) return cache.get(url);
  return fetch(url).then(r => r.json()).then(data => {
    cache.set(url, data);
    return data;
  });
}
```

3. **Debounce User Input**
```javascript
// Prevents excessive API calls
const debouncedSearch = debounce(searchFunction, 300);
```

4. **Use Pagination**
```javascript
// Don't load all data at once
fetch('/api/posts?page=1&limit=20');
```

5. **Compress Request/Response**
```javascript
// Server-side compression
headers: {
  'Accept-Encoding': 'gzip, deflate, br'
}
```

---

## Testing & Debugging

### Log All Requests
```javascript
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('🔍 Request:', args[0]);
  const response = await originalFetch(...args);
  console.log('📥 Response:', response.status);
  return response;
};
```

### Mock Fetch for Testing
```javascript
function mockFetch(data, delay = 100) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data)
  });
}

// Usage in tests
global.fetch = jest.fn(() => mockFetch({ id: 1, name: 'Test' }));
```

### Network Tab
- Open DevTools → Network tab
- Monitor all AJAX requests
- Check request/response headers
- View payload and response data
- Measure request timing

---

## Resources

- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
- [HTTP Status Codes](https://httpstatuses.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) - Free fake API for testing

---

**Last Updated:** 2025
**Author:** JavaScript Instructor
**Version:** 1.0.0
