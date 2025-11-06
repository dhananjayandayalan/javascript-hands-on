# AJAX Quick Reference - Senior Dev Cheat Sheet

> Print this out or keep it open during practice sessions
> All patterns you need to know in one place

---

## 1. Core Fetch Patterns (Memorize These)

### Basic GET with Error Handling
```javascript
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
```

### POST with JSON Body
```javascript
const response = await fetch('/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', age: 30 })
});
```

### With Timeout
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  return await response.json();
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    throw new Error('Request timeout');
  }
  throw error;
}
```

---

## 2. Common Patterns

### Debounce
```javascript
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Usage
const debouncedSearch = debounce((query) => {
  fetch(`/search?q=${query}`);
}, 300);
```

### Retry with Exponential Backoff
```javascript
async function retry(fn, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### Simple Cache
```javascript
const cache = new Map();
function cachedFetch(url, ttl = 60000) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.time < ttl) {
    return Promise.resolve(cached.data);
  }

  return fetch(url)
    .then(r => r.json())
    .then(data => {
      cache.set(url, { data, time: Date.now() });
      return data;
    });
}
```

### Request Cancellation
```javascript
let controller = new AbortController();

function search(query) {
  controller.abort(); // Cancel previous
  controller = new AbortController();

  return fetch(`/search?q=${query}`, {
    signal: controller.signal
  });
}
```

---

## 3. Parallel vs Sequential

### Parallel (Promise.all)
```javascript
// All start at the same time
const [users, posts, comments] = await Promise.all([
  fetch('/users').then(r => r.json()),
  fetch('/posts').then(r => r.json()),
  fetch('/comments').then(r => r.json())
]);
// Total time: ~same as slowest request
```

### Sequential (await)
```javascript
// One after another
const user = await fetch('/users/1').then(r => r.json());
const posts = await fetch(`/posts?userId=${user.id}`).then(r => r.json());
const comments = await fetch(`/comments?postId=${posts[0].id}`).then(r => r.json());
// Total time: sum of all requests
```

---

## 4. HTTP Methods Quick Guide

```javascript
// GET - Retrieve data
fetch('/api/users')

// POST - Create new resource
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
})

// PUT - Replace entire resource
fetch('/api/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 1, name: 'John', email: 'john@example.com' })
})

// PATCH - Partial update
fetch('/api/users/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Jane' }) // Only changed field
})

// DELETE - Remove resource
fetch('/api/users/1', { method: 'DELETE' })
```

---

## 5. Authentication Pattern

```javascript
class AuthAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      await this.refreshToken();
      return this.request(endpoint, options); // Retry
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email, password) {
    const { token } = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.token = token;
    localStorage.setItem('token', token);
  }
}
```

---

## 6. File Upload with Progress

```javascript
function uploadFile(file, url, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));

    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', url);
    xhr.send(formData);
  });
}

// Usage
uploadFile(file, '/api/upload', (percent) => {
  progressBar.style.width = `${percent}%`;
});
```

---

## 7. Race Condition Prevention

```javascript
class SearchManager {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.latestId = 0;
    this.controller = null;
  }

  async search(query) {
    const searchId = ++this.latestId;

    // Cancel previous request
    if (this.controller) {
      this.controller.abort();
    }
    this.controller = new AbortController();

    try {
      const response = await fetch(
        `${this.apiUrl}?q=${query}`,
        { signal: this.controller.signal }
      );
      const results = await response.json();

      // Only return if still latest
      if (searchId === this.latestId) {
        return results;
      }
      return null;
    } catch (error) {
      if (error.name === 'AbortError') return null;
      throw error;
    }
  }
}
```

---

## 8. Infinite Scroll

```javascript
class InfiniteScroll {
  constructor(apiUrl, pageSize = 20) {
    this.apiUrl = apiUrl;
    this.pageSize = pageSize;
    this.page = 0;
    this.items = [];
    this.isLoading = false;
    this.hasMore = true;
  }

  async loadNext() {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.page++;

    try {
      const response = await fetch(
        `${this.apiUrl}?page=${this.page}&limit=${this.pageSize}`
      );
      const newItems = await response.json();

      if (newItems.length === 0) {
        this.hasMore = false;
      } else {
        this.items.push(...newItems);
      }

      return newItems;
    } finally {
      this.isLoading = false;
    }
  }
}

// Setup scroll listener
window.addEventListener('scroll', () => {
  const nearBottom = window.innerHeight + window.scrollY >=
                     document.body.offsetHeight - 200;
  if (nearBottom) {
    feed.loadNext().then(renderItems);
  }
});
```

---

## 9. Error Handling Decision Tree

```
Fetch Request
    │
    ├─ Network Error (TypeError)
    │  └─> Retry with backoff
    │
    ├─ 2xx Success
    │  └─> Parse response
    │
    ├─ 4xx Client Error
    │  ├─ 401 Unauthorized → Refresh token, retry
    │  ├─ 403 Forbidden → Show error, don't retry
    │  ├─ 404 Not Found → Show error, don't retry
    │  └─ 400/422 → Validation error, don't retry
    │
    └─ 5xx Server Error
       └─> Retry with backoff
```

---

## 10. Common Pitfalls to Avoid

❌ **Not checking response.ok**
```javascript
const data = await fetch(url).then(r => r.json()); // BAD
```

✅ **Always check response.ok**
```javascript
const response = await fetch(url);
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
```

---

❌ **Forgetting to clear timeouts**
```javascript
setTimeout(() => controller.abort(), 5000); // Memory leak!
```

✅ **Always clear timeouts**
```javascript
const timeoutId = setTimeout(() => controller.abort(), 5000);
try {
  // ... fetch
} finally {
  clearTimeout(timeoutId);
}
```

---

❌ **Not handling AbortError**
```javascript
catch (error) {
  console.error(error); // Treats cancellation as error
}
```

✅ **Check error type**
```javascript
catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request cancelled');
    return;
  }
  console.error('Real error:', error);
}
```

---

❌ **Retry on 4xx errors**
```javascript
catch (error) {
  retry(); // BAD - don't retry client errors
}
```

✅ **Only retry network/5xx errors**
```javascript
if (response.status >= 500 || error.name === 'TypeError') {
  retry();
}
```

---

## 11. Promise Methods Quick Ref

```javascript
// Promise.all - Wait for all, fail if any fail
const [a, b, c] = await Promise.all([p1, p2, p3]);

// Promise.allSettled - Wait for all, never fails
const results = await Promise.allSettled([p1, p2, p3]);
// [{ status: 'fulfilled', value: ... }, { status: 'rejected', reason: ... }]

// Promise.race - First to settle wins
const first = await Promise.race([p1, p2, p3]);

// Promise.any - First to fulfill wins (ignores rejections)
const first = await Promise.any([p1, p2, p3]);
```

---

## 12. Status Codes Cheat Sheet

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Parse response |
| 201 | Created | Success |
| 204 | No Content | Success, no body |
| 400 | Bad Request | Don't retry |
| 401 | Unauthorized | Refresh token, retry |
| 403 | Forbidden | Don't retry |
| 404 | Not Found | Don't retry |
| 422 | Validation Error | Don't retry |
| 429 | Rate Limit | Wait, then retry |
| 500 | Server Error | Retry |
| 502 | Bad Gateway | Retry |
| 503 | Service Unavailable | Retry |
| 504 | Gateway Timeout | Retry |

---

## 13. Interview Quick Answers

**Q: Promises vs async/await?**
A: async/await is syntactic sugar over Promises. Use async/await for cleaner code, Promises for complex chaining or Promise.all.

**Q: PUT vs PATCH?**
A: PUT replaces entire resource (idempotent), PATCH updates specific fields.

**Q: How to prevent race conditions?**
A: Request cancellation (AbortController) or request IDs.

**Q: How to handle CORS?**
A: Server adds CORS headers. Frontend can use proxy in dev.

**Q: When to retry?**
A: Network errors and 5xx. Never retry 4xx (except 401).

**Q: Debounce vs Throttle?**
A: Debounce: wait for inactivity. Throttle: execute at most once per interval.

---

## 14. Code Templates for Interviews

### Template 1: Fetch Wrapper
```javascript
async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

### Template 2: API Service Class
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

    return response.json();
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
```

---

## 15. Last-Minute Checklist

Before the interview:
- [ ] Can write debounce from memory
- [ ] Know difference between PUT and PATCH
- [ ] Understand race conditions and solutions
- [ ] Can implement retry logic
- [ ] Know when to use Promise.all vs sequential await
- [ ] Can explain CORS
- [ ] Understand authentication flow with JWT
- [ ] Can implement simple caching

During coding:
- [ ] Start with error handling
- [ ] Check response.ok
- [ ] Clear timeouts/intervals
- [ ] Handle AbortError separately
- [ ] Consider edge cases
- [ ] Explain your thinking

---

## 16. Time Complexity Reference

| Operation | Time | Space |
|-----------|------|-------|
| Fetch request | O(1) API call | O(n) response size |
| Map cache lookup | O(1) | O(n) cache size |
| Debounce | O(1) | O(1) |
| Promise.all with n promises | O(n) setup | O(n) results |
| Array.forEach | O(n) | O(1) |

---

## Print This Section for Interviews

### Top 5 Patterns to Memorize

1. **Fetch with timeout**
2. **Debounce function**
3. **Retry with backoff**
4. **Simple cache**
5. **Request cancellation**

### Top 5 Interview Questions

1. Implement debounce
2. Handle race conditions
3. Parallel vs sequential
4. Authentication flow
5. Error handling strategy

### Top 5 Mistakes to Avoid

1. Not checking `response.ok`
2. Not clearing timeouts
3. Retry on 4xx errors
4. Ignore AbortError
5. No duplicate request prevention

---

**Good luck! You've got this! 🚀**

*Keep this handy during practice. Refer back to your complete guides for detailed explanations.*
