# AJAX Challenge Solutions & Patterns

> **⚠️ WARNING**: Only look at these AFTER attempting the challenges yourself!
>
> These are reference implementations. Your solutions might differ and that's OK!
> Focus on understanding the patterns, not memorizing code.

---

## Level 1 Solutions: Foundation

### Solution 1.1: Smart Fetch Wrapper

```javascript
async function safeFetch(url, options = {}) {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Check if response is OK
    if (!response.ok) {
      throw new Error(
        `HTTP Error ${response.status}: ${response.statusText}`
      );
    }

    // Parse JSON
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 5 seconds');
    }

    throw error;
  }
}

// Usage
safeFetch('/api/users')
  .then(data => console.log(data))
  .catch(err => console.error(err.message));
```

**Key Concepts**:
- AbortController for timeout
- Proper error handling
- JSON parsing
- Clear timeout cleanup

---

### Solution 1.2: Parallel Data Fetching

```javascript
async function fetchDashboardData() {
  const endpoints = {
    users: 'https://jsonplaceholder.typicode.com/users',
    posts: 'https://jsonplaceholder.typicode.com/posts',
    comments: 'https://jsonplaceholder.typicode.com/comments'
  };

  // Wrap each fetch in a promise that never rejects
  const fetchSafe = async (key, url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${key}`);
      return { key, data: await response.json(), error: null };
    } catch (error) {
      return { key, data: null, error: error.message };
    }
  };

  // Fetch all in parallel
  const results = await Promise.all([
    fetchSafe('users', endpoints.users),
    fetchSafe('posts', endpoints.posts),
    fetchSafe('comments', endpoints.comments)
  ]);

  // Organize results
  const output = { errors: [] };
  results.forEach(({ key, data, error }) => {
    if (error) {
      output.errors.push({ [key]: error });
      output[key] = null;
    } else {
      output[key] = data;
    }
  });

  return output;
}

// Usage
const data = await fetchDashboardData();
console.log(data.users, data.posts, data.comments, data.errors);
```

**Key Concepts**:
- Promise.all for parallel execution
- Error isolation (one failure doesn't block others)
- Structured error reporting

---

### Solution 1.3: Sequential Dependent Requests

```javascript
async function fetchUserPostComments(userId) {
  try {
    // Step 1: Fetch user
    const userResponse = await fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`
    );
    if (!userResponse.ok) throw new Error('Failed to fetch user');
    const user = await userResponse.json();

    // Step 2: Fetch user's posts
    const postsResponse = await fetch(
      `https://jsonplaceholder.typicode.com/posts?userId=${user.id}`
    );
    if (!postsResponse.ok) throw new Error('Failed to fetch posts');
    const posts = await postsResponse.json();

    if (posts.length === 0) {
      return { user, posts, comments: [] };
    }

    // Step 3: Fetch comments for first post
    const commentsResponse = await fetch(
      `https://jsonplaceholder.typicode.com/comments?postId=${posts[0].id}`
    );
    if (!commentsResponse.ok) throw new Error('Failed to fetch comments');
    const comments = await commentsResponse.json();

    return { user, posts, comments };
  } catch (error) {
    throw new Error(`Sequential fetch failed: ${error.message}`);
  }
}

// Usage
const result = await fetchUserPostComments(1);
console.log(result);
```

**Key Concepts**:
- Sequential async/await
- Data dependency between requests
- Error handling at each step

---

## Level 2 Solutions: Real-World Patterns

### Solution 2.1: Debounced Search

```javascript
class DebouncedSearch {
  constructor(apiUrl, delay = 300) {
    this.apiUrl = apiUrl;
    this.delay = delay;
    this.timeoutId = null;
    this.abortController = null;
  }

  search(query) {
    // Clear previous timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Handle empty query
    if (!query || query.trim() === '') {
      this.clear();
      return Promise.resolve([]);
    }

    // Return a promise that resolves after debounce
    return new Promise((resolve, reject) => {
      this.timeoutId = setTimeout(async () => {
        try {
          this.abortController = new AbortController();

          console.log('Searching for:', query);

          const response = await fetch(
            `${this.apiUrl}?q=${encodeURIComponent(query)}`,
            { signal: this.abortController.signal }
          );

          if (!response.ok) {
            throw new Error('Search failed');
          }

          const results = await response.json();
          resolve(results);
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Search cancelled');
            resolve([]);
          } else {
            reject(error);
          }
        }
      }, this.delay);
    });
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Usage
const search = new DebouncedSearch('https://api.example.com/search');

// User types: j -> ja -> jav -> java -> javas -> javasc -> javascript
// Only the last search (after 300ms of no typing) is executed

search.search('javascript').then(results => {
  console.log('Search results:', results);
});
```

**Key Concepts**:
- setTimeout for debouncing
- AbortController for request cancellation
- Promise wrapper for async timing
- Cleanup of previous operations

---

### Solution 2.2: Smart Cache with TTL

```javascript
class CachedFetch {
  constructor(ttl = 60000) {
    this.ttl = ttl;
    this.cache = new Map();
  }

  _getCacheKey(url, options = {}) {
    // Create unique key from URL + method + body
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${body}`;
  }

  _isCacheValid(entry) {
    return Date.now() - entry.timestamp < this.ttl;
  }

  async fetch(url, options = {}) {
    const cacheKey = this._getCacheKey(url, options);

    // Check cache
    if (this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      if (this._isCacheValid(entry)) {
        console.log('Cache HIT:', cacheKey);
        return entry.data;
      } else {
        console.log('Cache EXPIRED:', cacheKey);
        this.cache.delete(cacheKey);
      }
    }

    // Cache miss - make request
    console.log('Cache MISS:', cacheKey);

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Store in cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      throw error;
    }
  }

  clear() {
    this.cache.clear();
  }

  clearKey(url, options = {}) {
    const cacheKey = this._getCacheKey(url, options);
    this.cache.delete(cacheKey);
  }
}

// Usage
const cache = new CachedFetch(30000); // 30 second TTL

await cache.fetch('/api/users'); // Network request
await cache.fetch('/api/users'); // Cached (instant!)

// Wait 31 seconds...
await cache.fetch('/api/users'); // Network request (cache expired)
```

**Key Concepts**:
- Map for cache storage
- Timestamp tracking
- Cache key generation
- TTL validation

---

### Solution 2.3: Retry with Exponential Backoff

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries + 1}`);
      const startTime = Date.now();

      const response = await fetch(url, options);

      // Don't retry on 4xx errors (client errors)
      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          throw new Error(
            `Client error ${response.status}: ${response.statusText}`
          );
        }
        // 5xx errors are retryable
        throw new Error(
          `Server error ${response.status}: ${response.statusText}`
        );
      }

      const elapsed = Date.now() - startTime;
      console.log(`Success in ${elapsed}ms`);

      return await response.json();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) or non-network errors
      if (
        error.message.includes('Client error') ||
        (error.name !== 'TypeError' && !error.message.includes('Server error'))
      ) {
        throw error;
      }

      // If we've exhausted retries, throw
      if (attempt === maxRetries) {
        throw new Error(
          `Failed after ${maxRetries + 1} attempts: ${error.message}`
        );
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
try {
  const data = await fetchWithRetry('https://flaky-api.com/data');
  console.log(data);
} catch (err) {
  console.error('Failed after retries:', err);
}
```

**Key Concepts**:
- Loop-based retry logic
- Exponential backoff calculation
- Status code-based retry decisions
- Error type discrimination

---

### Solution 2.4: Request Batching

```javascript
class RequestBatcher {
  constructor(batchUrl, delay = 100) {
    this.batchUrl = batchUrl;
    this.delay = delay;
    this.queue = [];
    this.timeoutId = null;
  }

  async fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      // Add to queue
      this.queue.push({ url, options, resolve, reject });

      // Clear existing timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Schedule batch processing
      this.timeoutId = setTimeout(() => {
        this._processBatch();
      }, this.delay);
    });
  }

  async _processBatch() {
    const currentBatch = [...this.queue];
    this.queue = [];
    this.timeoutId = null;

    if (currentBatch.length === 0) return;

    console.log(`Batching ${currentBatch.length} requests`);

    try {
      // Create batch request
      const batchRequest = currentBatch.map(({ url, options }) => ({
        url,
        method: options.method || 'GET',
        body: options.body
      }));

      // Send batch
      const response = await fetch(this.batchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: batchRequest })
      });

      if (!response.ok) {
        throw new Error('Batch request failed');
      }

      const results = await response.json();

      // Distribute responses
      currentBatch.forEach((item, index) => {
        const result = results.responses[index];

        if (result.error) {
          item.reject(new Error(result.error));
        } else {
          item.resolve(result.data);
        }
      });
    } catch (error) {
      // Reject all on batch failure
      currentBatch.forEach(item => item.reject(error));
    }
  }
}

// Usage
const batcher = new RequestBatcher('/api/batch');

const [user, posts, comments] = await Promise.all([
  batcher.fetch('/api/users/1'),
  batcher.fetch('/api/posts'),
  batcher.fetch('/api/comments')
]);

// All 3 are batched into ONE network request!
console.log(user, posts, comments);
```

**Key Concepts**:
- Queue management
- Delayed batch processing
- Promise resolution distribution
- Error handling for partial failures

---

## Level 3 Solutions: Advanced Scenarios

### Solution 3.1: Authenticated API Service

```javascript
class AuthAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;
    this.refreshPromise = null;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { token } = await response.json();
    this.token = token;

    // Store in localStorage for persistence
    localStorage.setItem('auth_token', token);

    return token;
  }

  logout() {
    this.token = null;
    this.refreshPromise = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated() {
    return !!this.token || !!localStorage.getItem('auth_token');
  }

  async _request(endpoint, options = {}) {
    // Load token from storage if not in memory
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }

    // Add auth header
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

    // Handle token expiration
    if (response.status === 401) {
      console.log('Token expired, refreshing...');
      await this._refreshToken();
      // Retry request with new token
      return this._request(endpoint, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async _refreshToken() {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const { token } = await response.json();
        this.token = token;
        localStorage.setItem('auth_token', token);

        return token;
      } catch (error) {
        this.logout();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async get(endpoint) {
    return this._request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this._request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this._request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this._request(endpoint, { method: 'DELETE' });
  }
}

// Usage
const api = new AuthAPI('https://api.example.com');

await api.login('user@example.com', 'password');
const users = await api.get('/users');
const newPost = await api.post('/posts', { title: 'Hello', body: 'World' });
await api.logout();
```

**Key Concepts**:
- Token storage (memory + localStorage)
- Automatic token refresh on 401
- Request queuing during refresh
- Centralized auth logic

---

### Solution 3.2: File Upload with Progress

```javascript
function uploadFile(file, url, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
    }

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage
        });
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);

    // Send request
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
const progressBar = document.querySelector('.progress-bar');
const file = fileInput.files[0];
const controller = new AbortController();

uploadFile(file, '/api/upload', {
  onProgress: ({ loaded, total, percentage }) => {
    console.log(`${percentage}% uploaded (${loaded}/${total} bytes)`);
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
  },
  signal: controller.signal
})
  .then(response => {
    console.log('Upload complete:', response);
    alert('File uploaded successfully!');
  })
  .catch(err => {
    console.error('Upload failed:', err);
    alert(err.message);
  });

// To cancel: controller.abort();
```

**Key Concepts**:
- XMLHttpRequest for progress tracking
- FormData for file uploads
- Progress event handling
- AbortController integration
- Promise wrapper for XHR

---

### Solution 3.3: Infinite Scroll / Pagination

```javascript
class PaginatedFeed {
  constructor(apiUrl, pageSize = 20) {
    this.apiUrl = apiUrl;
    this.pageSize = pageSize;
    this._currentPage = 0;
    this._items = [];
    this._isLoading = false;
    this._hasMore = true;
  }

  async loadNext() {
    // Prevent duplicate requests
    if (this._isLoading || !this._hasMore) {
      return;
    }

    this._isLoading = true;
    const nextPage = this._currentPage + 1;

    try {
      const response = await fetch(
        `${this.apiUrl}?page=${nextPage}&limit=${this.pageSize}`
      );

      if (!response.ok) {
        throw new Error('Failed to load page');
      }

      const data = await response.json();

      // Handle end of data
      if (data.length === 0) {
        this._hasMore = false;
        return;
      }

      // Check if we got less than requested (might be last page)
      if (data.length < this.pageSize) {
        this._hasMore = false;
      }

      // Add to items
      this._items.push(...data);
      this._currentPage = nextPage;

      console.log(`Loaded page ${nextPage}, total items: ${this._items.length}`);
    } catch (error) {
      console.error('Failed to load next page:', error);
      throw error;
    } finally {
      this._isLoading = false;
    }
  }

  reset() {
    this._currentPage = 0;
    this._items = [];
    this._isLoading = false;
    this._hasMore = true;
  }

  get hasMore() {
    return this._hasMore;
  }

  get isLoading() {
    return this._isLoading;
  }

  get items() {
    return this._items;
  }

  get currentPage() {
    return this._currentPage;
  }
}

// Usage
const feed = new PaginatedFeed('https://api.example.com/posts', 10);

// Load first page
await feed.loadNext();
console.log(feed.items); // [10 posts]

// Load second page
await feed.loadNext();
console.log(feed.items); // [20 posts]

// Continue loading while there's more data
while (feed.hasMore && !feed.isLoading) {
  await feed.loadNext();
}

// Infinite scroll integration
window.addEventListener('scroll', async () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const bottomPosition = document.body.offsetHeight;

  if (scrollPosition >= bottomPosition - 100 && feed.hasMore && !feed.isLoading) {
    await feed.loadNext();
    renderItems(feed.items);
  }
});
```

**Key Concepts**:
- State management (page, items, loading, hasMore)
- Duplicate request prevention
- End-of-data detection
- Incremental data accumulation

---

### Solution 3.4: Race Conditions in Search

```javascript
class SearchManager {
  constructor(apiUrl, debounceDelay = 300) {
    this.apiUrl = apiUrl;
    this.debounceDelay = debounceDelay;
    this.timeoutId = null;
    this.abortController = null;
    this.latestSearchId = 0;
  }

  async search(query) {
    // Clear previous timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Empty query
    if (!query || query.trim() === '') {
      this.clear();
      return null;
    }

    // Increment search ID for this query
    const searchId = ++this.latestSearchId;

    return new Promise((resolve) => {
      this.timeoutId = setTimeout(async () => {
        try {
          this.abortController = new AbortController();
          const timestamp = Date.now();

          console.log(`[${searchId}] Searching for: "${query}"`);

          const response = await fetch(
            `${this.apiUrl}?q=${encodeURIComponent(query)}`,
            { signal: this.abortController.signal }
          );

          if (!response.ok) {
            throw new Error('Search failed');
          }

          const results = await response.json();

          // Only return results if this is still the latest search
          if (searchId === this.latestSearchId) {
            console.log(`[${searchId}] Results returned`);
            resolve({ query, results, timestamp });
          } else {
            console.log(`[${searchId}] Results discarded (stale)`);
            resolve(null);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log(`[${searchId}] Search cancelled`);
          } else {
            console.error(`[${searchId}] Search error:`, error);
          }
          resolve(null);
        }
      }, this.debounceDelay);
    });
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.latestSearchId = 0;
  }
}

// Usage
const searchMgr = new SearchManager('https://api.example.com/search');

// Simulate fast typing
const results1 = searchMgr.search('j');      // [1] Request ID
const results2 = searchMgr.search('ja');     // [2] Request ID
const results3 = searchMgr.search('jav');    // [3] Request ID (latest)

// Even if responses come back: [2] -> [3] -> [1]
// Only [3] results will be displayed

const finalResults = await results3;
if (finalResults) {
  console.log('Showing results for:', finalResults.query);
  displayResults(finalResults.results);
}
```

**Key Concepts**:
- Sequential ID assignment
- Latest-request validation
- Stale response discarding
- Combined debouncing + cancellation

---

## Key Patterns Summary

### 1. Error Handling Pattern
```javascript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    // Handle cancellation
  } else if (error.name === 'TypeError') {
    // Handle network error
  } else {
    // Handle other errors
  }
}
```

### 2. Timeout Pattern
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  clearTimeout(timeoutId);
  // ...
}
```

### 3. Debounce Pattern
```javascript
let timeoutId;
function debounce(fn, delay) {
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

### 4. Cache Pattern
```javascript
const cache = new Map();
const key = `${url}:${method}`;

if (cache.has(key)) {
  const { data, timestamp } = cache.get(key);
  if (Date.now() - timestamp < TTL) {
    return data;
  }
}

// Fetch and cache
cache.set(key, { data, timestamp: Date.now() });
```

### 5. Retry Pattern
```javascript
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    return await fetch(url);
  } catch (error) {
    if (attempt === maxRetries) throw error;
    const delay = Math.pow(2, attempt) * 1000;
    await new Promise(r => setTimeout(r, delay));
  }
}
```

---

## Testing Your Solutions

```javascript
// Test parallel execution
console.time('parallel');
const [a, b, c] = await Promise.all([fetch1(), fetch2(), fetch3()]);
console.timeEnd('parallel'); // Should be ~same as slowest

// Test sequential execution
console.time('sequential');
const a = await fetch1();
const b = await fetch2();
const c = await fetch3();
console.timeEnd('sequential'); // Should be ~sum of all

// Test debouncing
const search = new DebouncedSearch('/api/search', 300);
search.search('a'); // Cancelled
search.search('ab'); // Cancelled
search.search('abc'); // This one executes after 300ms

// Test caching
const cache = new CachedFetch(5000);
console.time('first');
await cache.fetch('/api/data'); // Network
console.timeEnd('first'); // ~500ms

console.time('second');
await cache.fetch('/api/data'); // Cached
console.timeEnd('second'); // ~0ms
```

---

## Common Mistakes to Avoid

1. ❌ **Not checking response.ok**
   ```javascript
   const data = await fetch(url).then(r => r.json()); // BAD
   ```

2. ❌ **Forgetting to clear timeouts**
   ```javascript
   setTimeout(() => controller.abort(), 5000); // BAD - leak!
   ```

3. ❌ **Not handling AbortError**
   ```javascript
   catch (error) {
     console.error(error); // BAD - treats abort as error
   }
   ```

4. ❌ **Retry on 4xx errors**
   ```javascript
   if (!response.ok) { retry(); } // BAD - don't retry client errors
   ```

5. ❌ **Not preventing duplicate requests**
   ```javascript
   async loadMore() {
     // Missing: if (this.isLoading) return;
     this.isLoading = true;
     // ...
   }
   ```

---

## Interview Tips

1. **Start with error handling** - Always show you think about edge cases
2. **Explain your approach** - Talk through the problem before coding
3. **Ask clarifying questions** - Don't assume requirements
4. **Consider performance** - Mention caching, debouncing, batching
5. **Think about UX** - Loading states, optimistic updates, error messages
6. **Discuss trade-offs** - Every solution has pros/cons

---

## Next Steps

1. ✅ Implement all solutions yourself (don't copy-paste!)
2. ✅ Test in browser console or CodeSandbox
3. ✅ Create variations (different TTLs, retry strategies, etc.)
4. ✅ Combine patterns (cached + retried + authenticated fetch)
5. ✅ Build the integration projects
6. ✅ Explain solutions out loud (whiteboard practice)

**Remember**: Understanding > Memorization

Good luck! 🚀
