# AJAX Interview Questions - Senior Dev Level

> **Real questions asked at**: Meta, Google, Amazon, Microsoft, Netflix, Airbnb, Stripe
>
> Time yourself: 5-10 mins per question (coding + explanation)

---

## Section 1: Conceptual Questions (Must Answer Fluently)

### Q1: Explain the difference between Promises and async/await. When would you use each?

**Expected Answer**:
- Promises are objects representing eventual completion/failure of async operations
- async/await is syntactic sugar over Promises, making async code look synchronous
- **Use Promises when**: You need Promise.all/race, complex chaining, or explicit promise handling
- **Use async/await when**: You want cleaner, more readable code and simpler error handling
- **Gotcha**: async/await doesn't work well with array methods (use Promise.all instead)

```javascript
// Promise
fetch('/api/user')
  .then(r => r.json())
  .then(user => fetch(`/api/posts/${user.id}`))
  .then(r => r.json())
  .catch(err => console.error(err));

// Async/await (cleaner)
try {
  const response = await fetch('/api/user');
  const user = await response.json();
  const postsResponse = await fetch(`/api/posts/${user.id}`);
  const posts = await postsResponse.json();
} catch (err) {
  console.error(err);
}
```

---

### Q2: What's the difference between PUT and PATCH? Give real-world examples.

**Expected Answer**:
- **PUT**: Replaces entire resource (idempotent) - send full object
- **PATCH**: Partial update (not idempotent) - send only changed fields
- **Idempotent**: Making same request multiple times has same effect

**Example**:
```javascript
// PUT - Replace entire user (must send all fields)
PUT /api/users/123
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "address": "123 Main St"
}

// PATCH - Update only age (send changed field)
PATCH /api/users/123
{
  "age": 31
}
```

**Real-world**:
- PUT: "Save" button (send entire form)
- PATCH: "Toggle notification settings" (change one field)

---

### Q3: How do you prevent race conditions in AJAX requests?

**Expected Answer**:
Three main strategies:

1. **Request Cancellation**: Use AbortController to cancel outdated requests
2. **Request IDs**: Track latest request ID, discard older responses
3. **Debouncing**: Wait for user to stop typing before sending

```javascript
// Strategy 1: Cancel outdated
let controller = new AbortController();

async function search(query) {
  controller.abort(); // Cancel previous
  controller = new AbortController();

  const response = await fetch(`/search?q=${query}`, {
    signal: controller.signal
  });
  return response.json();
}

// Strategy 2: Request IDs
let latestId = 0;

async function search(query) {
  const requestId = ++latestId;
  const results = await fetchResults(query);

  if (requestId === latestId) { // Only show if still latest
    displayResults(results);
  }
}
```

---

### Q4: Explain CORS. How do you handle CORS errors?

**Expected Answer**:
- **CORS**: Cross-Origin Resource Sharing - security feature preventing unauthorized cross-domain requests
- Browser blocks requests to different origins (protocol + domain + port)
- Server must explicitly allow via headers

**How to handle**:
1. **Backend**: Add CORS headers
   ```javascript
   Access-Control-Allow-Origin: https://yourdomain.com
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

2. **Frontend**: Use proxy in development
   ```javascript
   // package.json
   "proxy": "https://api.example.com"
   ```

3. **Fetch options**:
   ```javascript
   fetch(url, {
     mode: 'cors', // or 'no-cors', 'same-origin'
     credentials: 'include' // Send cookies cross-origin
   })
   ```

**Common mistake**: `mode: 'no-cors'` doesn't solve CORS - it just hides errors!

---

### Q5: How do you handle authentication in AJAX requests?

**Expected Answer**:
Most common: **JWT (JSON Web Tokens)**

**Flow**:
1. User logs in → Server returns JWT
2. Store token (localStorage/memory)
3. Add to every request: `Authorization: Bearer <token>`
4. Handle 401 errors → refresh token → retry request

```javascript
class AuthService {
  constructor() {
    this.token = null;
  }

  async login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const { token } = await response.json();
    this.token = token;
    localStorage.setItem('token', token);
  }

  async authenticatedFetch(url, options = {}) {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.token}`
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      await this.refreshToken();
      return this.authenticatedFetch(url, options); // Retry
    }

    return response;
  }
}
```

---

## Section 2: Coding Challenges (Live Coding)

### Challenge 1: Implement Promise.all from scratch

**Interviewer says**: "Implement your own version of Promise.all"

```javascript
function myPromiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      resolve([]);
      return;
    }

    const results = [];
    let completed = 0;

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(result => {
          results[index] = result;
          completed++;

          if (completed === promises.length) {
            resolve(results);
          }
        })
        .catch(reject); // Reject on first error
    });
  });
}

// Test
myPromiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
]).then(results => console.log(results)); // [1, 2, 3]
```

**Follow-up**: "What if you want to wait for all to complete, even if some fail?" → Use `Promise.allSettled`

---

### Challenge 2: Implement debounce function

**Interviewer says**: "Write a debounce function that delays execution until after a period of inactivity"

```javascript
function debounce(func, delay) {
  let timeoutId;

  return function(...args) {
    // Clear previous timeout
    clearTimeout(timeoutId);

    // Set new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage
const expensiveSearch = debounce((query) => {
  console.log('Searching for:', query);
  fetch(`/api/search?q=${query}`)
    .then(r => r.json())
    .then(results => console.log(results));
}, 300);

// User types: a -> ab -> abc
// Only searches after 300ms of no typing
input.addEventListener('input', (e) => {
  expensiveSearch(e.target.value);
});
```

**Follow-up**: "What's the difference between debounce and throttle?"
- **Debounce**: Execute after delay of inactivity
- **Throttle**: Execute at most once per interval

---

### Challenge 3: Implement request retry with exponential backoff

**Interviewer says**: "How would you retry a failed API request with increasing delays?"

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries + 1} attempts: ${error.message}`);
      }

      // Calculate exponential backoff: 1s, 2s, 4s, 8s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const data = await retryWithBackoff(async () => {
  const response = await fetch('https://flaky-api.com/data');
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}, 3, 1000);
```

**Follow-up**: "Should you retry all failed requests?"
- **No**: Only retry network errors and 5xx (server errors)
- **Don't retry**: 4xx (client errors like 400, 404, 401)

---

### Challenge 4: Implement simple caching mechanism

**Interviewer says**: "Cache API responses for 60 seconds to avoid duplicate requests"

```javascript
class SimpleCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage with fetch
const cache = new SimpleCache(60000);

async function cachedFetch(url) {
  // Check cache
  const cached = cache.get(url);
  if (cached) {
    console.log('Cache HIT');
    return cached;
  }

  // Fetch from network
  console.log('Cache MISS');
  const response = await fetch(url);
  const data = await response.json();

  // Store in cache
  cache.set(url, data);

  return data;
}
```

**Follow-up**: "How would you handle cache invalidation?"
- Time-based (TTL)
- Manual invalidation (on mutations)
- Event-based (WebSocket updates)
- Stale-while-revalidate (return stale, fetch fresh in background)

---

## Section 3: System Design Questions

### Q1: Design a search autocomplete feature

**Requirements**:
- As user types, show suggestions
- Minimize API calls
- Handle fast typing
- Show "Loading..." state
- Cancel outdated requests

**Solution Approach**:
```javascript
class SearchAutocomplete {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.debounceDelay = 300;
    this.timeoutId = null;
    this.controller = null;
  }

  async search(query) {
    // Clear previous timeout
    clearTimeout(this.timeoutId);

    // Cancel previous request
    if (this.controller) {
      this.controller.abort();
    }

    // Show loading
    this.showLoading();

    // Debounce
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(async () => {
        try {
          this.controller = new AbortController();

          const response = await fetch(
            `${this.apiUrl}?q=${query}`,
            { signal: this.controller.signal }
          );

          const results = await response.json();
          resolve(results);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error(error);
          }
          resolve([]);
        }
      }, this.debounceDelay);
    });
  }

  showLoading() {
    // Update UI
  }
}
```

**Key Points**:
- ✅ Debouncing (reduce API calls)
- ✅ Request cancellation (handle race conditions)
- ✅ Loading states (UX)
- ✅ Error handling

---

### Q2: Design an infinite scroll feed

**Requirements**:
- Load 20 items at a time
- Load more when user scrolls near bottom
- Don't load while already loading
- Show loading spinner
- Handle end of data

**Solution Approach**:
```javascript
class InfiniteScrollFeed {
  constructor(apiUrl, container) {
    this.apiUrl = apiUrl;
    this.container = container;
    this.page = 0;
    this.isLoading = false;
    this.hasMore = true;

    this.setupScrollListener();
  }

  setupScrollListener() {
    window.addEventListener('scroll', () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const bottomPosition = document.body.offsetHeight;

      // Load more when 200px from bottom
      if (scrollPosition >= bottomPosition - 200) {
        this.loadMore();
      }
    });
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.showLoadingSpinner();

    try {
      this.page++;
      const response = await fetch(
        `${this.apiUrl}?page=${this.page}&limit=20`
      );
      const items = await response.json();

      // Check if end of data
      if (items.length === 0) {
        this.hasMore = false;
        this.hideLoadingSpinner();
        return;
      }

      // Render items
      this.renderItems(items);

    } catch (error) {
      console.error('Failed to load:', error);
      this.page--; // Rollback page
    } finally {
      this.isLoading = false;
      this.hideLoadingSpinner();
    }
  }

  renderItems(items) {
    items.forEach(item => {
      const element = this.createItemElement(item);
      this.container.appendChild(element);
    });
  }
}
```

**Key Points**:
- ✅ Duplicate request prevention (`isLoading` flag)
- ✅ End-of-data handling
- ✅ Error handling with rollback
- ✅ Performance (scroll listener)

---

### Q3: Design a file upload system with retry and resumability

**Requirements**:
- Upload large files (100MB+)
- Show progress bar
- Retry on failure
- Resume interrupted uploads
- Cancel functionality

**High-level approach**:
1. **Chunking**: Split file into chunks (1MB each)
2. **Upload chunks sequentially**: Track progress
3. **Store progress**: localStorage (which chunks uploaded)
4. **Resume**: Check stored progress, skip uploaded chunks
5. **Retry**: Exponential backoff on failures

```javascript
class ChunkedFileUploader {
  constructor(file, uploadUrl) {
    this.file = file;
    this.uploadUrl = uploadUrl;
    this.chunkSize = 1024 * 1024; // 1MB
    this.uploadedChunks = this.loadProgress();
  }

  async upload(onProgress) {
    const totalChunks = Math.ceil(this.file.size / this.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      if (this.uploadedChunks.has(i)) {
        continue; // Skip already uploaded
      }

      const chunk = this.file.slice(
        i * this.chunkSize,
        (i + 1) * this.chunkSize
      );

      await this.uploadChunkWithRetry(chunk, i, totalChunks);

      // Track progress
      this.uploadedChunks.add(i);
      this.saveProgress();

      // Update UI
      const progress = (this.uploadedChunks.size / totalChunks) * 100;
      onProgress(progress);
    }
  }

  async uploadChunkWithRetry(chunk, index, total, retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('index', index);
        formData.append('total', total);

        await fetch(this.uploadUrl, {
          method: 'POST',
          body: formData
        });

        return; // Success
      } catch (error) {
        if (attempt === retries) throw error;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  saveProgress() {
    localStorage.setItem(
      `upload_${this.file.name}`,
      JSON.stringify([...this.uploadedChunks])
    );
  }

  loadProgress() {
    const saved = localStorage.getItem(`upload_${this.file.name}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  }
}
```

**Key Points**:
- ✅ Chunking (handle large files)
- ✅ Progress tracking
- ✅ Resumability (localStorage)
- ✅ Retry logic per chunk
- ✅ Error handling

---

## Section 4: Debugging Scenarios

### Scenario 1: "My fetch request isn't working but I don't see any errors"

**Likely causes**:
1. ❌ **Not checking response.ok**
   ```javascript
   // BAD
   const data = await fetch(url).then(r => r.json());
   // If server returns 404, this still parses JSON (might fail silently)

   // GOOD
   const response = await fetch(url);
   if (!response.ok) throw new Error(`HTTP ${response.status}`);
   const data = await response.json();
   ```

2. ❌ **CORS error** (check browser console Network tab)

3. ❌ **Promise not awaited**
   ```javascript
   // BAD
   function getData() {
     fetch(url).then(r => r.json()); // Promise not returned!
   }

   // GOOD
   async function getData() {
     const response = await fetch(url);
     return response.json();
   }
   ```

---

### Scenario 2: "Search is making too many API calls"

**Solution**: Implement debouncing

```javascript
// Without debouncing (BAD)
input.addEventListener('input', async (e) => {
  const results = await fetch(`/search?q=${e.target.value}`);
  // If user types "javascript", this makes 10 API calls!
});

// With debouncing (GOOD)
const debouncedSearch = debounce(async (query) => {
  const results = await fetch(`/search?q=${query}`);
}, 300);

input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
  // Only makes 1 API call after user stops typing for 300ms
});
```

---

### Scenario 3: "Outdated search results are showing up"

**Problem**: Race condition - responses arrive out of order

**Solution**: Request cancellation or ID tracking

```javascript
let latestSearchId = 0;

async function search(query) {
  const searchId = ++latestSearchId;

  const results = await fetch(`/search?q=${query}`);

  // Only display if this is still the latest search
  if (searchId === latestSearchId) {
    displayResults(results);
  }
}
```

---

### Scenario 4: "File upload progress stuck at 0%"

**Problem**: Using Fetch API (doesn't support upload progress)

**Solution**: Use XMLHttpRequest

```javascript
// Fetch (BAD - no upload progress)
await fetch(url, { method: 'POST', body: formData });

// XHR (GOOD - has progress events)
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  const percent = (e.loaded / e.total) * 100;
  updateProgressBar(percent);
});
xhr.open('POST', url);
xhr.send(formData);
```

---

## Section 5: Quick Fire Round

### Rapid-fire questions (30 seconds each):

**Q**: What does `response.ok` check?
**A**: `status >= 200 && status < 300`

**Q**: What's the default HTTP method for fetch?
**A**: GET

**Q**: How do you send JSON in a POST request?
**A**:
```javascript
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

**Q**: How do you cancel a fetch request?
**A**: AbortController
```javascript
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort();
```

**Q**: Difference between `Promise.all` and `Promise.race`?
**A**:
- `all`: Waits for ALL promises (rejects if any fail)
- `race`: Returns first settled promise (resolve or reject)

**Q**: How do you handle a 401 Unauthorized error?
**A**: Refresh token, retry request, or redirect to login

**Q**: What's the purpose of `credentials: 'include'`?
**A**: Send cookies with cross-origin requests

**Q**: How do you upload a file with fetch?
**A**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
fetch(url, { method: 'POST', body: formData });
```

**Q**: What's the difference between network error and HTTP error?
**A**:
- Network error: Connection failed (TypeError)
- HTTP error: Server responded with error status (4xx, 5xx)

**Q**: How do you implement request timeout?
**A**: AbortController with setTimeout

---

## Section 6: Behavioral Questions

### "Tell me about a time you optimized API performance"

**STAR Format** (Situation, Task, Action, Result):

**Example Answer**:
> **Situation**: Our dashboard was making 20+ API calls on load, taking 5+ seconds.
>
> **Task**: Reduce load time to under 2 seconds without changing backend.
>
> **Action**: I implemented:
> 1. Request batching - combined 20 calls into 3 batch requests
> 2. Parallel loading - used Promise.all for independent data
> 3. Caching - cached static data for 5 minutes
> 4. Lazy loading - deferred non-critical widgets
>
> **Result**: Load time reduced from 5.2s to 1.8s. User engagement increased 23%.

---

### "How do you handle API failures gracefully?"

**Expected Answer**:
1. **Retry logic**: Exponential backoff for transient errors
2. **Fallback data**: Show cached/stale data when available
3. **User feedback**: Clear error messages, not just "Something went wrong"
4. **Graceful degradation**: Core features work even if some APIs fail
5. **Monitoring**: Log errors for debugging

---

## Whiteboard Tips

1. **Start with the API** - Define the function signature first
2. **List edge cases** - Empty input, errors, timeouts, etc.
3. **Think out loud** - Explain your reasoning
4. **Write comments** - Outline logic before coding
5. **Test your code** - Walk through with example inputs
6. **Discuss trade-offs** - Every solution has pros/cons

---

## Interview Day Checklist

**30 mins before**:
- [ ] Review key patterns (debounce, retry, cache)
- [ ] Practice explaining async/await vs Promises
- [ ] Review common errors (CORS, 401, race conditions)

**During interview**:
- [ ] Ask clarifying questions
- [ ] Start simple, then optimize
- [ ] Explain your thought process
- [ ] Consider edge cases
- [ ] Write clean, readable code
- [ ] Test your solution

**After coding**:
- [ ] Explain time/space complexity
- [ ] Discuss alternative approaches
- [ ] Mention real-world considerations (monitoring, testing, etc.)

---

## Final Prep

Practice these scenarios:

1. **2-minute pitch**: "Explain AJAX to a junior developer"
2. **5-minute code**: Implement a smart fetch wrapper
3. **10-minute design**: Design a search autocomplete system
4. **15-minute problem**: Build an infinite scroll feed with caching

**Mock interview yourself**:
- Record yourself explaining solutions
- Time your coding sessions
- Practice whiteboarding (pen & paper)

---

## Confidence Boosters

You're ready for a senior role if you can:

✅ Write a production-ready API service class from scratch
✅ Explain and handle race conditions
✅ Implement debouncing, caching, and retry logic without looking up docs
✅ Debug common AJAX issues quickly
✅ Design systems considering performance, UX, and edge cases
✅ Discuss trade-offs and alternatives

---

**Good luck crushing that interview! 🚀**

Remember: It's not about memorizing code - it's about understanding patterns and problem-solving.
