# AJAX Mastery Challenges - Senior Dev Level

> **Purpose**: These challenges test your ability to write production-ready AJAX code from scratch. Each question requires you to write a complete, working code snippet that solves a real-world problem.

---

## How to Use This Guide

1. **Don't look at your notes** - Try solving from memory first
2. **Write complete code** - Not pseudocode, actual working JavaScript
3. **Consider edge cases** - Handle errors, edge cases, and loading states
4. **Follow best practices** - Use modern syntax, proper error handling
5. **Time yourself** - Senior devs should solve these in 5-10 minutes each

---

## Level 1: Foundation (Must solve in < 5 mins each)

### Challenge 1.1: Smart Fetch Wrapper
**Scenario**: You're tired of repeating error handling logic in every fetch call.

**Task**: Write a `safeFetch()` function that:
- Automatically checks `response.ok`
- Throws descriptive errors with status codes
- Parses JSON automatically
- Has a 5-second timeout
- Can be used like: `const data = await safeFetch('/api/users')`

```javascript
// Write your solution here
async function safeFetch(url, options = {}) {
  // Your code here
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), 5000);

  try{
    const fetchResponse = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timerId);
    
    if(!fetchResponse.ok) {
      `HTTP Error ${response.status}: ${response.statusText}`
    }

    return await fetchResponse.json();

  } catch(error) {
    clearTimeout(timerId);

    if(error.name == 'AbortError') {
      throw new Error('Request timeout after 5 seconds');
    }

    throw error;
  }
}

// Test it
safeFetch('/api/users')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

### Challenge 1.2: Parallel Data Fetching
**Scenario**: Your dashboard needs to load 3 different data sources simultaneously.

**Task**: Write code that:
- Fetches users, posts, and comments in parallel
- Waits for ALL to complete before proceeding
- Handles the case where one request fails (don't let one failure block others)
- Returns an object: `{ users, posts, comments, errors }`

```javascript
// Write your solution here
async function fetchDashboardData(url) {
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
console.log(data.users, data.posts, data.comments);
```

---

### Challenge 1.3: Sequential Dependent Requests
**Scenario**: You need to fetch a user, then their posts, then comments on the first post.

**Task**: Write code that:
- Fetches user with ID 1
- Uses that user's data to fetch their posts
- Uses the first post's ID to fetch its comments
- Each request depends on the previous one
- Handle errors at each step

```javascript
// Write your solution here
async function fetchUserPostComments(userId) {
  // Your code here
  try {
    const userResponse = await fetch(
      `https://jsonplaceholder.typicode.com/users/${userId}`
    );

    if(!userResponse.ok) {
      throw new Error('Failed to fetch user');
    }

    const user = await userResponse.json();

    const postsResponse = await fetch(
      `https://jsonplaceholder.typicode.com/posts?userId=${user.id}`
    );

    if(!postsResponse.ok) {
      throw new Error('Failed to fetch posts');
    }

    const posts = await userResponse.json();

    const commentsResponse = await fetch(
      `https://jsonplaceholder.typicode.com/comments?postId=${posts[0].id}`
    );

    if(!commentsResponse.ok) {
      throw new Error('Failed to fetch comments');
    }

    const comments = await commentsResponse.json();

    return {user, posts, comments};
  } catch (error) {
    throw new Error(`Sequential fetch failed: ${error.message}`);
  }
}

// Usage
const result = await fetchUserPostComments(1);
console.log(result); // { user, posts, comments }
```

---

## Level 2: Real-World Patterns (Must solve in < 8 mins each)

### Challenge 2.1: Debounced Search
**Scenario**: You're building a search box that hits an API on every keystroke (wasteful!).

**Task**: Write a `DebouncedSearch` class that:
- Waits 300ms after the user stops typing before searching
- Cancels the previous request if a new one comes in
- Shows "Searching..." status
- Handles empty search strings (clear results)
- Returns a promise with results

```javascript
// Write your solution here
class DebouncedSearch {
  constructor(apiUrl, delay = 300) {
    // Your code here
  }

  search(query) {
    // Your code here
  }

  clear() {
    // Your code here
  }
}

// Usage
const search = new DebouncedSearch('https://api.example.com/search');
search.search('javascript').then(results => console.log(results));
```

---

### Challenge 2.2: Smart Cache with TTL
**Scenario**: Your app makes the same API calls repeatedly. Implement caching!

**Task**: Write a `CachedFetch` class that:
- Caches responses for a specified TTL (time-to-live)
- Returns cached data if available and not expired
- Makes fresh requests when cache is stale
- Has a `clear()` method to invalidate cache
- Handles cache keys properly (URL + method + body)

```javascript
// Write your solution here
class CachedFetch {
  constructor(ttl = 60000) { // default 60 seconds
    // Your code here
  }

  async fetch(url, options = {}) {
    // Your code here
  }

  clear() {
    // Your code here
  }
}

// Usage
const cache = new CachedFetch(30000); // 30 second TTL
await cache.fetch('/api/users'); // Network request
await cache.fetch('/api/users'); // Cached (instant)
```

---

### Challenge 2.3: Retry with Exponential Backoff
**Scenario**: Your API is flaky. Implement smart retry logic.

**Task**: Write a `fetchWithRetry()` function that:
- Retries failed requests up to 3 times
- Uses exponential backoff: 1s, 2s, 4s delays
- Only retries on network errors or 5xx status codes (NOT 4xx)
- Logs each attempt with timing
- Throws after max retries exceeded

```javascript
// Write your solution here
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  // Your code here
}

// Usage
try {
  const data = await fetchWithRetry('https://flaky-api.com/data');
  console.log(data);
} catch (err) {
  console.error('Failed after retries:', err);
}
```

---

### Challenge 2.4: Request Batching
**Scenario**: Your UI makes 50 individual API calls. Batch them into fewer requests!

**Task**: Write a `RequestBatcher` class that:
- Collects requests for 100ms before sending
- Batches them into a single request: `POST /batch` with `{ requests: [...] }`
- Returns individual promises for each caller
- Handles partial failures (some requests succeed, others fail)
- Each caller gets their specific response

```javascript
// Write your solution here
class RequestBatcher {
  constructor(batchUrl, delay = 100) {
    // Your code here
  }

  async fetch(url, options = {}) {
    // Your code here - return a promise for THIS specific request
  }
}

// Usage
const batcher = new RequestBatcher('/api/batch');
const [user, posts, comments] = await Promise.all([
  batcher.fetch('/api/users/1'),
  batcher.fetch('/api/posts'),
  batcher.fetch('/api/comments')
]);
// All 3 should be batched into ONE network request!
```

---

## Level 3: Advanced Scenarios (Senior Dev Level - 10-15 mins each)

### Challenge 3.1: Authenticated API Service
**Scenario**: Build a complete API service with JWT authentication.

**Task**: Write an `AuthAPI` class that:
- Stores JWT token in memory (or localStorage)
- Automatically adds `Authorization: Bearer <token>` header to requests
- Has `login()`, `logout()`, and `isAuthenticated()` methods
- Automatically refreshes expired tokens (when you get 401, call `/refresh`)
- Queues requests during token refresh (don't make duplicate refresh calls)
- Has methods: `get()`, `post()`, `put()`, `delete()`

```javascript
// Write your solution here
class AuthAPI {
  constructor(baseURL) {
    // Your code here
  }

  async login(email, password) {
    // Your code here
  }

  logout() {
    // Your code here
  }

  isAuthenticated() {
    // Your code here
  }

  async get(endpoint) {
    // Your code here
  }

  async post(endpoint, data) {
    // Your code here
  }

  async put(endpoint, data) {
    // Your code here
  }

  async delete(endpoint) {
    // Your code here
  }

  // Private method
  async _refreshToken() {
    // Your code here
  }
}

// Usage
const api = new AuthAPI('https://api.example.com');
await api.login('user@example.com', 'password');
const users = await api.get('/users');
const newPost = await api.post('/posts', { title: 'Hello', body: 'World' });
await api.logout();
```

---

### Challenge 3.2: File Upload with Progress
**Scenario**: Users need to upload large files with a progress bar.

**Task**: Write a `uploadFile()` function that:
- Uses XMLHttpRequest (fetch doesn't support upload progress)
- Takes a File object and upload URL
- Returns a promise with `onProgress` callback support
- Progress callback receives `{ loaded, total, percentage }`
- Supports cancellation via AbortController
- Handles upload errors properly

```javascript
// Write your solution here
function uploadFile(file, url, { onProgress, signal } = {}) {
  // Your code here - return a promise
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const controller = new AbortController();

uploadFile(file, '/api/upload', {
  onProgress: ({ loaded, total, percentage }) => {
    console.log(`${percentage}% uploaded`);
    progressBar.style.width = `${percentage}%`;
  },
  signal: controller.signal
})
  .then(response => console.log('Upload complete:', response))
  .catch(err => console.error('Upload failed:', err));

// To cancel:
// controller.abort();
```

---

### Challenge 3.3: Infinite Scroll / Pagination
**Scenario**: Implement infinite scroll that loads more data as users scroll.

**Task**: Write a `PaginatedFeed` class that:
- Loads pages sequentially (page 1, 2, 3...)
- Has `loadNext()` method to fetch next page
- Keeps track of: `currentPage`, `hasMore`, `isLoading`
- Prevents duplicate requests (don't load page 2 twice)
- Handles end-of-data (when API returns empty array)
- Accumulates all loaded items in `items` array
- Has `reset()` to start over

```javascript
// Write your solution here
class PaginatedFeed {
  constructor(apiUrl, pageSize = 20) {
    // Your code here
  }

  async loadNext() {
    // Your code here
  }

  reset() {
    // Your code here
  }

  get hasMore() {
    // Your code here
  }

  get isLoading() {
    // Your code here
  }

  get items() {
    // Your code here
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

// Check if more data available
if (feed.hasMore) {
  await feed.loadNext();
}
```

---

### Challenge 3.4: Race Conditions in Search
**Scenario**: User types fast. Responses come back out of order. Last typed search should win!

**Task**: Write a `SearchManager` class that:
- Ensures only the LATEST search results are displayed
- If user searches "a", then "ab", but "a" response comes back last, ignore it
- Uses request IDs or timestamps to track order
- Cancels outdated in-flight requests
- Debounces input (300ms)
- Returns `{ query, results, timestamp }` only for the latest query

```javascript
// Write your solution here
class SearchManager {
  constructor(apiUrl, debounceDelay = 300) {
    // Your code here
  }

  async search(query) {
    // Your code here - only return results if this is still the latest query
  }

  clear() {
    // Your code here
  }
}

// Usage
const searchMgr = new SearchManager('https://api.example.com/search');

// User types quickly:
searchMgr.search('j');      // Request 1 (might come back last!)
searchMgr.search('ja');     // Request 2
searchMgr.search('jav');    // Request 3 (latest)

// Even if Request 1 comes back last, only Request 3 results should be shown
```

---

## Level 4: System Design (Architect Level - 15-20 mins each)

### Challenge 4.1: Complete API Service Layer
**Scenario**: Design a production-ready API service for a React/Vue app.

**Task**: Write a complete `APIService` that combines:
- Base URL configuration
- Automatic authentication (JWT tokens)
- Request/response interceptors
- Global error handling with custom error types
- Retry logic with exponential backoff
- Caching with TTL
- Request deduplication (don't make same request twice simultaneously)
- Request/response logging in development
- Timeout handling
- CRUD methods: `get()`, `post()`, `put()`, `patch()`, `delete()`

```javascript
// Write your solution here
class APIService {
  // Your complete implementation
}

// Usage examples:
const api = new APIService({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  cache: true,
  cacheTTL: 60000
});

// Should handle all these scenarios:
const users = await api.get('/users'); // Cached, retried, authenticated
const newUser = await api.post('/users', { name: 'John' }); // Retry on failure
const updated = await api.patch('/users/1', { name: 'Jane' }); // Partial update
await api.delete('/users/1'); // With confirmation
```

---

### Challenge 4.2: Optimistic UI Updates
**Scenario**: Users click "Like" on a post. Show instant feedback, then sync with server.

**Task**: Write an `OptimisticUpdate` class that:
- Immediately updates local state (optimistic)
- Makes async API call in background
- Reverts changes if API call fails
- Shows error message on failure
- Handles conflicts (data changed on server while request was in-flight)
- Supports undo functionality
- Queues multiple updates if user clicks rapidly

```javascript
// Write your solution here
class OptimisticUpdate {
  constructor() {
    // Your code here
  }

  async update(entity, updates, apiCall) {
    // entity: current state
    // updates: optimistic changes
    // apiCall: async function to sync with server
    // Return: updated entity or throw on error (reverting changes)
  }
}

// Usage
const updater = new OptimisticUpdate();

const post = { id: 1, likes: 10, isLiked: false };

// User clicks like button
const updatedPost = await updater.update(
  post,
  { likes: post.likes + 1, isLiked: true }, // Optimistic update
  async () => {
    // API call (might fail!)
    return await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      .then(r => r.json());
  }
);

// If API fails, post reverts to original state
console.log(updatedPost);
```

---

### Challenge 4.3: Request Queue with Priority
**Scenario**: Mobile app with slow connection. Prioritize critical requests!

**Task**: Write a `RequestQueue` class that:
- Limits concurrent requests (max 2 at a time for mobile)
- Supports priority levels: `HIGH`, `NORMAL`, `LOW`
- High priority requests jump the queue
- Queues requests when limit reached
- Automatically processes queue as requests complete
- Has `add()`, `pause()`, `resume()`, `clear()` methods
- Returns promises that resolve when request completes

```javascript
// Write your solution here
const Priority = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
};

class RequestQueue {
  constructor(maxConcurrent = 2) {
    // Your code here
  }

  add(url, options = {}, priority = Priority.NORMAL) {
    // Your code here - return a promise
  }

  pause() {
    // Your code here - stop processing queue
  }

  resume() {
    // Your code here - continue processing
  }

  clear() {
    // Your code here - cancel all pending requests
  }
}

// Usage
const queue = new RequestQueue(2); // Max 2 concurrent

// Add multiple requests
queue.add('/api/user', {}, Priority.HIGH);      // Starts immediately
queue.add('/api/posts', {}, Priority.NORMAL);   // Starts immediately
queue.add('/api/comments', {}, Priority.LOW);   // Queued (limit reached)
queue.add('/api/analytics', {}, Priority.LOW);  // Queued

// When first request finishes, comments request starts
```

---

### Challenge 4.4: Real-time Long Polling
**Scenario**: Build a notification system that polls the server for updates.

**Task**: Write a `LongPolling` class that:
- Continuously polls an endpoint for new data
- Uses "long polling" pattern (server holds connection until new data)
- Backs off on errors: 1s, 2s, 5s, 10s, 30s, then stops
- Resets backoff on successful response
- Notifies subscribers of new data via callback
- Has `start()`, `stop()`, and `isActive()` methods
- Handles connection drops gracefully
- Doesn't create multiple simultaneous polls

```javascript
// Write your solution here
class LongPolling {
  constructor(url, options = {}) {
    // url: endpoint to poll
    // options: { interval, onData, onError, timeout }
  }

  start() {
    // Your code here - begin polling
  }

  stop() {
    // Your code here - stop polling cleanly
  }

  isActive() {
    // Your code here
  }
}

// Usage
const poller = new LongPolling('https://api.example.com/notifications', {
  onData: (data) => {
    console.log('New notifications:', data);
    // Update UI with new notifications
  },
  onError: (err) => {
    console.error('Polling error:', err);
  },
  timeout: 30000 // 30 second server timeout
});

poller.start();
// ... later
poller.stop();
```

---

## Level 5: Interview Killers (CTO Level Questions)

### Challenge 5.1: GraphQL-style Batch Loader
**Scenario**: Avoid N+1 query problem by batching requests with DataLoader pattern.

**Task**: Write a `DataLoader` class that:
- Collects multiple individual requests
- Batches them within same tick/frame
- Makes single batched request: `POST /batch` with array of IDs
- Distributes responses back to individual callers
- Caches results (per request)
- Handles partial failures
- Supports custom batch functions

Example: If 3 components request `getUser(1)`, `getUser(2)`, `getUser(3)` in same render, make ONE request: `POST /users/batch` with `[1,2,3]`

```javascript
// Write your solution here
class DataLoader {
  constructor(batchFn, options = {}) {
    // batchFn: async function that takes array of keys, returns array of values
    // options: { cache, maxBatchSize }
  }

  async load(key) {
    // Your code here - return promise for this specific key
  }

  clear(key) {
    // Clear cache for key
  }

  clearAll() {
    // Clear entire cache
  }
}

// Usage
const userLoader = new DataLoader(async (userIds) => {
  // Receives [1, 2, 3]
  const response = await fetch('/api/users/batch', {
    method: 'POST',
    body: JSON.stringify({ ids: userIds })
  });
  return response.json(); // Returns [user1, user2, user3]
});

// In your components (all happen in same tick):
const user1 = await userLoader.load(1);
const user2 = await userLoader.load(2);
const user3 = await userLoader.load(3);
// Only ONE request made with [1,2,3]!
```

---

### Challenge 5.2: Request Deduplication
**Scenario**: Multiple components request same data simultaneously. Make only ONE request!

**Task**: Write a `dedupeFetch()` wrapper that:
- Identifies duplicate in-flight requests (same URL + method + body)
- Returns same promise for duplicate requests
- Cleans up after request completes
- Works with any fetch-like function
- Handles errors (all callers should receive the error)
- Supports cache key customization

```javascript
// Write your solution here
function createDedupedFetch() {
  // Your code here
  return async function dedupedFetch(url, options = {}) {
    // Your code here
  };
}

// Usage
const dedupedFetch = createDedupedFetch();

// Multiple components fetch same data:
const request1 = dedupedFetch('/api/users'); // Makes request
const request2 = dedupedFetch('/api/users'); // Returns same promise (no request!)
const request3 = dedupedFetch('/api/users'); // Returns same promise (no request!)

const [users1, users2, users3] = await Promise.all([request1, request2, request3]);
// Only ONE network request was made!
// users1 === users2 === users3
```

---

### Challenge 5.3: Circuit Breaker Pattern
**Scenario**: Your API is down. Stop hammering it with requests!

**Task**: Write a `CircuitBreaker` class that:
- Tracks failure rate over time
- States: `CLOSED` (normal), `OPEN` (blocking requests), `HALF_OPEN` (testing recovery)
- Opens circuit after threshold failures (e.g., 5 in 10 seconds)
- Blocks requests when open (fail fast)
- Automatically tries recovery after timeout
- Closes circuit if recovery request succeeds
- Has configurable thresholds and timeouts

```javascript
// Write your solution here
const State = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
  constructor(options = {}) {
    // options: { failureThreshold, timeout, windowSize }
  }

  async execute(fn) {
    // fn: async function to execute
    // Your code here
  }

  getState() {
    // Return current state
  }

  reset() {
    // Manually reset circuit
  }
}

// Usage
const breaker = new CircuitBreaker({
  failureThreshold: 5,  // Open after 5 failures
  timeout: 60000,       // Try recovery after 60s
  windowSize: 10000     // Count failures in 10s window
});

try {
  const data = await breaker.execute(async () => {
    return await fetch('/api/flaky-service');
  });
} catch (err) {
  if (err.message === 'Circuit breaker is OPEN') {
    console.log('Service is down, failing fast');
  }
}
```

---

### Challenge 5.4: Streaming Response Handler
**Scenario**: Process large API responses as they stream in (don't wait for entire response).

**Task**: Write a `streamFetch()` function that:
- Uses Response.body.getReader() for streaming
- Processes chunks as they arrive
- Calls `onChunk` callback for each chunk
- Handles backpressure (slow callback processing)
- Supports cancellation
- Parses newline-delimited JSON (NDJSON)
- Returns final aggregated result

```javascript
// Write your solution here
async function streamFetch(url, { onChunk, signal } = {}) {
  // Your code here
}

// Usage - Server-sent events or NDJSON streaming
const controller = new AbortController();

await streamFetch('https://api.example.com/stream', {
  onChunk: (data) => {
    console.log('Received chunk:', data);
    // Update UI progressively
  },
  signal: controller.signal
});

// Real-world example: Large dataset streaming
await streamFetch('https://api.example.com/export/users', {
  onChunk: (users) => {
    // Process batch of 100 users
    processUsers(users);
    updateProgress();
  }
});
```

---

## Bonus: Integration Challenges

### Integration 1: Build a Complete E-commerce Cart System
Implement these features using everything you've learned:

1. `addToCart(productId, quantity)` - Optimistic update
2. `removeFromCart(itemId)` - With undo functionality
3. `updateQuantity(itemId, quantity)` - Debounced API call
4. `checkout()` - Multi-step: validate, reserve stock, process payment
5. Handle race conditions (two tabs open)
6. Implement request retry for critical operations
7. Cache product details
8. Show loading states

---

### Integration 2: Social Media Feed
Implement:

1. Infinite scroll feed with pagination
2. Like/unlike with optimistic updates
3. Post comments with real-time updates (long polling)
4. Search users with debouncing and request cancellation
5. Image upload with progress
6. Pull-to-refresh functionality
7. Handle stale data (show when feed is outdated)

---

### Integration 3: Real-time Dashboard
Implement:

1. Parallel loading of 5 widgets (users, sales, traffic, alerts, tasks)
2. Auto-refresh every 30 seconds
3. Circuit breaker for failing widgets
4. Retry failed widget loads
5. Show last successful data when refresh fails
6. Export data to CSV with progress
7. WebSocket fallback to long polling

---

## Success Criteria for Senior Dev Role

You should be able to:

✅ **Foundation (< 5 mins each)**
- Write fetch wrappers with error handling from memory
- Implement parallel and sequential request patterns
- Handle timeouts and cancellation

✅ **Real-World Patterns (< 8 mins each)**
- Implement debouncing and caching without looking up
- Write retry logic with exponential backoff
- Build request batching systems

✅ **Advanced Scenarios (< 15 mins each)**
- Create production-ready API service classes
- Handle authentication flows with token refresh
- Implement infinite scroll and pagination
- Solve race conditions in async operations

✅ **System Design (< 20 mins each)**
- Design complete API layers with all features
- Implement optimistic UI updates
- Build request queues with priority
- Create long-polling and streaming handlers

✅ **Interview Killers (< 30 mins each)**
- Implement DataLoader pattern (GraphQL batching)
- Build circuit breakers
- Create request deduplication systems
- Handle streaming responses

---

## How to Practice

1. **Week 1**: Master Level 1 & 2 (foundation + patterns)
2. **Week 2**: Master Level 3 (advanced scenarios)
3. **Week 3**: Master Level 4 (system design)
4. **Week 4**: Master Level 5 + Integration challenges

**Daily Practice**:
- Pick 2-3 random challenges
- Set a timer
- Write code WITHOUT looking at notes
- Compare with reference implementations
- Refactor and improve

**Interview Prep**:
- Focus on explaining your thought process out loud
- Consider edge cases before coding
- Write tests for your solutions
- Discuss trade-offs and alternatives

---

## Additional Resources

After completing these challenges, you should:

1. Implement them in CodeSandbox/JSFiddle to test
2. Review your ajax-complete-guide.js for reference patterns
3. Practice whiteboarding these solutions
4. Explain each solution to someone else
5. Create your own variations

---

## Notes

- All challenges are based on real interview questions from top tech companies
- Focus on clean, maintainable code (not just "working" code)
- Consider performance, memory leaks, and edge cases
- Use modern JavaScript features (async/await, classes, destructuring)
- Comment your code to show your thinking process

**Good luck! 🚀**
