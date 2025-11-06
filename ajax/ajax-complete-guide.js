/**
 * ═══════════════════════════════════════════════════════════════════
 *                    COMPLETE AJAX TUTORIAL
 * ═══════════════════════════════════════════════════════════════════
 *
 * AJAX = Asynchronous JavaScript And XML
 * (Though we mostly use JSON now instead of XML)
 *
 * AJAX allows you to:
 * - Update web pages without reloading
 * - Request data from servers after page load
 * - Send data to servers in the background
 * - Create dynamic, interactive web applications
 */


// ═══════════════════════════════════════════════════════════════════
// 1. XMLHTTPREQUEST (Traditional Way - Still Important to Know)
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Legacy browser support (IE10 and below)
 * REAL SCENARIO: Maintaining old codebases, maximum compatibility
 */

function classicAjaxGET() {
    const xhr = new XMLHttpRequest();

    // Configure request
    xhr.open('GET', 'https://jsonplaceholder.typicode.com/users', true);

    // Track request state changes
    xhr.onreadystatechange = function() {
        // readyState values:
        // 0: UNSENT - Client created, open() not called yet
        // 1: OPENED - open() has been called
        // 2: HEADERS_RECEIVED - send() called, headers received
        // 3: LOADING - Downloading; responseText has partial data
        // 4: DONE - Operation complete

        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                console.log('✅ XHR GET Success:', data);
            } else {
                console.error('❌ XHR Error:', xhr.status, xhr.statusText);
            }
        }
    };

    // Send the request
    xhr.send();
}

function classicAjaxPOST() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://jsonplaceholder.typicode.com/posts', true);

    // Set request headers
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Modern event listener approach (better than onreadystatechange)
    xhr.onload = function() {
        if (xhr.status === 201) {
            const data = JSON.parse(xhr.responseText);
            console.log('✅ XHR POST Success:', data);
        }
    };

    xhr.onerror = function() {
        console.error('❌ Network Error');
    };

    // Send data
    const payload = JSON.stringify({
        title: 'New Post',
        body: 'This is the content',
        userId: 1
    });

    xhr.send(payload);
}

// Advanced XHR with progress tracking
function xhrWithProgress() {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            console.log(`Upload: ${percentComplete.toFixed(2)}%`);
        }
    });

    // Track download progress
    xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            console.log(`Download: ${percentComplete.toFixed(2)}%`);
        }
    });

    xhr.open('GET', 'https://jsonplaceholder.typicode.com/photos', true);
    xhr.send();
}


// ═══════════════════════════════════════════════════════════════════
// 2. FETCH API (Modern Standard - Most Common Today)
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Modern browsers (95%+ support), cleaner syntax
 * REAL SCENARIO: New projects, SPAs, modern web applications
 * ADVANTAGES: Promise-based, cleaner, more powerful
 */

// Basic GET request
function fetchGET() {
    fetch('https://jsonplaceholder.typicode.com/users')
        .then(response => {
            console.log('Response Status:', response.status);
            console.log('Response OK?:', response.ok); // true if 200-299

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return response.json(); // Parse JSON
        })
        .then(data => {
            console.log('✅ Fetch GET Success:', data);
        })
        .catch(error => {
            console.error('❌ Fetch Error:', error);
        });
}

// POST request with Fetch
function fetchPOST() {
    fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_TOKEN_HERE' // If needed
        },
        body: JSON.stringify({
            title: 'My Post',
            body: 'Post content here',
            userId: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ POST Response:', data);
    })
    .catch(error => {
        console.error('❌ Error:', error);
    });
}

// PUT request (Update entire resource)
function fetchPUT() {
    fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: 1,
            title: 'Updated Title',
            body: 'Updated content',
            userId: 1
        })
    })
    .then(response => response.json())
    .then(data => console.log('✅ PUT Success:', data))
    .catch(error => console.error('❌ Error:', error));
}

// PATCH request (Partial update)
function fetchPATCH() {
    fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: 'Only updating title'
        })
    })
    .then(response => response.json())
    .then(data => console.log('✅ PATCH Success:', data))
    .catch(error => console.error('❌ Error:', error));
}

// DELETE request
function fetchDELETE() {
    fetch('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'DELETE'
    })
    .then(response => {
        if (response.ok) {
            console.log('✅ Resource deleted successfully');
        }
    })
    .catch(error => console.error('❌ Error:', error));
}


// ═══════════════════════════════════════════════════════════════════
// 3. ASYNC/AWAIT (Modern, Most Readable)
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Always! (Modern JavaScript standard)
 * REAL SCENARIO: Any modern application - cleanest syntax
 * ADVANTAGES: Synchronous-looking code, easy error handling
 */

// Basic async/await GET
async function asyncFetchGET() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Async GET Success:', data);
        return data;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error; // Re-throw to let caller handle it
    }
}

// Async POST with error handling
async function asyncFetchPOST() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Async Post',
                body: 'Content from async function',
                userId: 1
            })
        });

        const data = await response.json();
        console.log('✅ Async POST Success:', data);
        return data;
    } catch (error) {
        console.error('❌ Async Error:', error);
    }
}

// Multiple parallel requests
async function parallelRequests() {
    try {
        // Execute all requests simultaneously
        const [users, posts, comments] = await Promise.all([
            fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json()),
            fetch('https://jsonplaceholder.typicode.com/posts').then(r => r.json()),
            fetch('https://jsonplaceholder.typicode.com/comments').then(r => r.json())
        ]);

        console.log('✅ All data loaded:', { users, posts, comments });
        return { users, posts, comments };
    } catch (error) {
        console.error('❌ Parallel Request Error:', error);
    }
}

// Sequential requests (when order matters)
async function sequentialRequests() {
    try {
        // First, get user data
        const userResponse = await fetch('https://jsonplaceholder.typicode.com/users/1');
        const user = await userResponse.json();

        // Then, get posts for that user
        const postsResponse = await fetch(`https://jsonplaceholder.typicode.com/posts?userId=${user.id}`);
        const posts = await postsResponse.json();

        // Finally, get comments for first post
        const commentsResponse = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${posts[0].id}`);
        const comments = await commentsResponse.json();

        console.log('✅ Sequential data:', { user, posts, comments });
        return { user, posts, comments };
    } catch (error) {
        console.error('❌ Sequential Error:', error);
    }
}


// ═══════════════════════════════════════════════════════════════════
// 4. HANDLING DIFFERENT RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Depends on API response format
 * REAL SCENARIO: APIs return different formats - JSON, text, blobs, etc.
 */

async function handleDifferentResponses() {
    // JSON response (most common)
    const jsonData = await fetch('https://jsonplaceholder.typicode.com/users/1')
        .then(r => r.json());

    // Text response
    const textData = await fetch('https://example.com/text-file.txt')
        .then(r => r.text());

    // Blob response (for images, files)
    const blobData = await fetch('https://via.placeholder.com/150')
        .then(r => r.blob());

    // Create image from blob
    const imageUrl = URL.createObjectURL(blobData);
    // Use: <img src="${imageUrl}" />

    // ArrayBuffer (for binary data)
    const bufferData = await fetch('https://example.com/binary-file')
        .then(r => r.arrayBuffer());

    // FormData
    const formData = await fetch('https://example.com/form')
        .then(r => r.formData());

    console.log('Different response types handled');
}


// ═══════════════════════════════════════════════════════════════════
// 5. WORKING WITH HEADERS
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Authentication, custom metadata, content negotiation
 * REAL SCENARIO: JWT auth, API keys, custom headers
 */

async function workingWithHeaders() {
    // Setting custom headers
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
        headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'X-Custom-Header': 'CustomValue',
            'Accept': 'application/json',
            'Accept-Language': 'en-US'
        }
    });

    // Reading response headers
    console.log('Content-Type:', response.headers.get('Content-Type'));
    console.log('Date:', response.headers.get('Date'));

    // Iterate through all headers
    response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    const data = await response.json();
    return data;
}


// ═══════════════════════════════════════════════════════════════════
// 6. SENDING FORM DATA
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: File uploads, traditional form submissions
 * REAL SCENARIO: Profile picture upload, file attachments
 */

async function sendFormData() {
    const formData = new FormData();
    formData.append('username', 'john_doe');
    formData.append('email', 'john@example.com');
    formData.append('age', '30');

    // Adding a file (from input element)
    // const fileInput = document.querySelector('input[type="file"]');
    // formData.append('avatar', fileInput.files[0]);

    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: formData // Don't set Content-Type, browser sets it automatically with boundary
    });

    const data = await response.json();
    console.log('✅ Form submitted:', data);
}

// Sending URL-encoded form data
async function sendURLEncodedData() {
    const params = new URLSearchParams();
    params.append('username', 'john_doe');
    params.append('password', 'secret123');

    const response = await fetch('https://example.com/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
    });

    return await response.json();
}


// ═══════════════════════════════════════════════════════════════════
// 7. REQUEST TIMEOUT & CANCELLATION
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Prevent hanging requests, user cancellations
 * REAL SCENARIO: Search autocomplete, canceling pending requests
 */

// Timeout implementation
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ Request timeout');
        }
        throw error;
    }
}

// Cancellable request (useful for search/autocomplete)
class CancellableRequest {
    constructor() {
        this.controller = null;
    }

    async fetch(url) {
        // Cancel previous request if exists
        if (this.controller) {
            this.controller.abort();
        }

        // Create new controller
        this.controller = new AbortController();

        try {
            const response = await fetch(url, {
                signal: this.controller.signal
            });
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Previous request cancelled');
                return null;
            }
            throw error;
        }
    }

    cancel() {
        if (this.controller) {
            this.controller.abort();
        }
    }
}

// Usage example for search autocomplete
const searchRequest = new CancellableRequest();

async function handleSearchInput(searchTerm) {
    const results = await searchRequest.fetch(
        `https://jsonplaceholder.typicode.com/users?q=${searchTerm}`
    );

    if (results) {
        console.log('Search results:', results);
    }
}


// ═══════════════════════════════════════════════════════════════════
// 8. ERROR HANDLING STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Production applications, robust error handling
 * REAL SCENARIO: Network failures, API errors, validation errors
 */

async function comprehensiveErrorHandling() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users/1');

        // Check HTTP status
        if (!response.ok) {
            // Create detailed error based on status code
            switch (response.status) {
                case 400:
                    throw new Error('Bad Request - Check your data');
                case 401:
                    throw new Error('Unauthorized - Please login');
                case 403:
                    throw new Error('Forbidden - You don\'t have permission');
                case 404:
                    throw new Error('Not Found - Resource doesn\'t exist');
                case 500:
                    throw new Error('Server Error - Try again later');
                default:
                    throw new Error(`HTTP Error: ${response.status}`);
            }
        }

        const data = await response.json();
        return data;

    } catch (error) {
        // Handle different error types
        if (error.name === 'TypeError') {
            console.error('❌ Network Error - Check internet connection');
        } else if (error.name === 'AbortError') {
            console.error('❌ Request Cancelled');
        } else if (error.name === 'SyntaxError') {
            console.error('❌ Invalid JSON Response');
        } else {
            console.error('❌ Error:', error.message);
        }

        // Log error to monitoring service (e.g., Sentry)
        // logErrorToService(error);

        throw error; // Re-throw or return default value
    }
}

// Retry logic for failed requests
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.log(`Attempt ${i + 1} failed`);

            if (i === retries - 1) {
                throw error; // Last attempt failed
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }
}


// ═══════════════════════════════════════════════════════════════════
// 9. CORS (Cross-Origin Resource Sharing)
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Calling APIs from different domains
 * REAL SCENARIO: Accessing third-party APIs, microservices
 *
 * CORS MODES:
 * - 'cors' (default): Standard CORS request
 * - 'no-cors': Limited access, can't read response
 * - 'same-origin': Only same-origin requests allowed
 */

async function corsExample() {
    // Standard CORS request
    const response = await fetch('https://api.example.com/data', {
        mode: 'cors', // default
        credentials: 'include' // Send cookies cross-origin if needed
    });

    // For no-cors (limited, can't read response body)
    const noCorsResponse = await fetch('https://example.com/image.png', {
        mode: 'no-cors'
    });

    // Same-origin only
    const sameOriginResponse = await fetch('/api/local-data', {
        mode: 'same-origin'
    });
}

// Handling CORS preflight requests (OPTIONS)
async function corsWithCustomHeaders() {
    // When you use custom headers, browser sends OPTIONS request first
    const response = await fetch('https://api.example.com/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'value' // Triggers preflight
        },
        body: JSON.stringify({ data: 'value' })
    });

    return await response.json();
}


// ═══════════════════════════════════════════════════════════════════
// 10. CACHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════

/**
 * WHEN TO USE: Improve performance, reduce server load
 * REAL SCENARIO: Static data, user profiles, configuration
 */

// Cache with fetch
async function fetchWithCache(url) {
    const response = await fetch(url, {
        cache: 'default' // Options: default, no-store, reload, no-cache, force-cache, only-if-cached
    });
    return await response.json();
}

// Manual caching implementation
class RequestCache {
    constructor(ttl = 60000) { // Time to live: 1 minute
        this.cache = new Map();
        this.ttl = ttl;
    }

    async fetch(url, options = {}) {
        const cacheKey = `${url}${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);

        // Return cached if valid
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            console.log('📦 Returning cached data');
            return cached.data;
        }

        // Fetch new data
        console.log('🌐 Fetching fresh data');
        const response = await fetch(url, options);
        const data = await response.json();

        // Store in cache
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    clear() {
        this.cache.clear();
    }

    delete(url) {
        this.cache.delete(url);
    }
}

// Usage
const cache = new RequestCache(60000); // 1 minute TTL
// const users = await cache.fetch('https://jsonplaceholder.typicode.com/users');


// ═══════════════════════════════════════════════════════════════════
// 11. REAL-WORLD EXAMPLES
// ═══════════════════════════════════════════════════════════════════

/**
 * Complete real-world implementations
 */

// Example 1: User Authentication
class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.baseURL = 'https://api.example.com';
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const { token, user } = await response.json();
            this.token = token;
            localStorage.setItem('token', token);

            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async fetchProtected(endpoint) {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });

        if (response.status === 401) {
            this.logout();
            throw new Error('Session expired');
        }

        return await response.json();
    }
}

// Example 2: API Service with Interceptors
class APIService {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        // Merge headers
        const headers = {
            ...this.defaultHeaders,
            ...options.headers
        };

        try {
            // Request interceptor
            console.log(`📡 ${options.method || 'GET'} ${url}`);
            const startTime = Date.now();

            const response = await fetch(url, {
                ...options,
                headers
            });

            // Response interceptor
            const duration = Date.now() - startTime;
            console.log(`✅ Response in ${duration}ms`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
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
const api = new APIService('https://jsonplaceholder.typicode.com');
// const users = await api.get('/users');
// const newPost = await api.post('/posts', { title: 'New Post', body: 'Content' });


// Example 3: Search with Debouncing
class SearchService {
    constructor() {
        this.cancelRequest = new CancellableRequest();
        this.debounceTimer = null;
    }

    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => func(...args), delay);
        };
    }

    async search(query) {
        if (!query || query.length < 2) {
            return [];
        }

        const results = await this.cancelRequest.fetch(
            `https://jsonplaceholder.typicode.com/users?q=${encodeURIComponent(query)}`
        );

        return results || [];
    }

    debouncedSearch = this.debounce(async (query, callback) => {
        const results = await this.search(query);
        callback(results);
    }, 300);
}

// Usage: searchService.debouncedSearch('john', (results) => console.log(results));


// Example 4: File Upload with Progress
async function uploadFileWithProgress(file) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                console.log(`Upload: ${percent.toFixed(2)}%`);
                // Update progress bar: updateProgressBar(percent);
            }
        });

        // Complete
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        });

        // Error
        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
        });

        // Prepare and send
        const formData = new FormData();
        formData.append('file', file);

        xhr.open('POST', 'https://example.com/upload');
        xhr.send(formData);
    });
}


// Example 5: Pagination Handler
class PaginationService {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.currentPage = 1;
        this.pageSize = 10;
    }

    async getPage(page = this.currentPage) {
        const response = await fetch(
            `${this.baseURL}?_page=${page}&_limit=${this.pageSize}`
        );

        const data = await response.json();
        const totalCount = response.headers.get('X-Total-Count');

        return {
            data,
            page,
            pageSize: this.pageSize,
            totalPages: Math.ceil(totalCount / this.pageSize),
            totalCount: parseInt(totalCount)
        };
    }

    async nextPage() {
        this.currentPage++;
        return await this.getPage();
    }

    async prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            return await this.getPage();
        }
    }

    async goToPage(page) {
        this.currentPage = page;
        return await this.getPage();
    }
}


// Example 6: WebSocket Alternative - Long Polling
class LongPolling {
    constructor(url) {
        this.url = url;
        this.isPolling = false;
    }

    async start(callback) {
        this.isPolling = true;

        while (this.isPolling) {
            try {
                const response = await fetch(this.url, {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    callback(data);
                }
            } catch (error) {
                console.error('Polling error:', error);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    stop() {
        this.isPolling = false;
    }
}


// ═══════════════════════════════════════════════════════════════════
// 12. PERFORMANCE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════

// Request batching
class RequestBatcher {
    constructor(batchDelay = 50) {
        this.queue = [];
        this.batchDelay = batchDelay;
        this.timer = null;
    }

    add(request) {
        return new Promise((resolve, reject) => {
            this.queue.push({ request, resolve, reject });

            if (!this.timer) {
                this.timer = setTimeout(() => this.flush(), this.batchDelay);
            }
        });
    }

    async flush() {
        const batch = this.queue.splice(0);
        this.timer = null;

        if (batch.length === 0) return;

        try {
            // Send batched request
            const requests = batch.map(b => b.request);
            const response = await fetch('https://api.example.com/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requests })
            });

            const results = await response.json();

            // Resolve individual promises
            batch.forEach((item, index) => {
                item.resolve(results[index]);
            });
        } catch (error) {
            batch.forEach(item => item.reject(error));
        }
    }
}


// ═══════════════════════════════════════════════════════════════════
// 13. TESTING HELPERS
// ═══════════════════════════════════════════════════════════════════

// Mock fetch for testing
function mockFetch(data, delay = 100) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                ok: true,
                status: 200,
                json: async () => data,
                text: async () => JSON.stringify(data)
            });
        }, delay);
    });
}

// Fetch interceptor for testing/debugging
function interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        console.log('🔍 Intercepted fetch:', args[0]);
        const response = await originalFetch(...args);
        console.log('📥 Response status:', response.status);
        return response;
    };

    // Restore: window.fetch = originalFetch;
}


// ═══════════════════════════════════════════════════════════════════
// QUICK REFERENCE: WHEN TO USE WHAT
// ═══════════════════════════════════════════════════════════════════

/*
┌─────────────────────────────────────────────────────────────────┐
│ HTTP METHOD │ PURPOSE                │ WHEN TO USE              │
├─────────────────────────────────────────────────────────────────┤
│ GET         │ Retrieve data          │ Fetching lists, details  │
│ POST        │ Create new resource    │ Creating user, post      │
│ PUT         │ Update entire resource │ Replace full object      │
│ PATCH       │ Partial update         │ Update specific fields   │
│ DELETE      │ Remove resource        │ Deleting items           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TECHNIQUE     │ USE CASE                                        │
├─────────────────────────────────────────────────────────────────┤
│ XMLHttpRequest│ Legacy support, progress tracking              │
│ Fetch API     │ Modern standard, most common                   │
│ Async/Await   │ Cleanest syntax, use everywhere                │
│ Promise.all   │ Parallel independent requests                  │
│ Sequential    │ When requests depend on each other             │
│ AbortController│ Timeouts, cancellable requests                │
│ FormData      │ File uploads, multipart forms                  │
│ Debouncing    │ Search autocomplete, text input                │
│ Caching       │ Reduce API calls, improve performance          │
│ Retry Logic   │ Handle network failures gracefully             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STATUS CODE │ MEANING            │ WHAT TO DO                │
├─────────────────────────────────────────────────────────────────┤
│ 200         │ OK                 │ Success, process data      │
│ 201         │ Created            │ Resource created           │
│ 204         │ No Content         │ Success, no response body  │
│ 400         │ Bad Request        │ Check request data         │
│ 401         │ Unauthorized       │ Login required             │
│ 403         │ Forbidden          │ No permission              │
│ 404         │ Not Found          │ Resource doesn't exist     │
│ 500         │ Server Error       │ Server problem, retry      │
│ 503         │ Service Unavailable│ Server down, try later     │
└─────────────────────────────────────────────────────────────────┘
*/


// ═══════════════════════════════════════════════════════════════════
// EXPORT FOR USE (if using modules)
// ═══════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APIService,
        AuthService,
        SearchService,
        PaginationService,
        RequestCache,
        CancellableRequest,
        fetchWithRetry,
        fetchWithTimeout
    };
}

console.log('✅ AJAX Complete Guide Loaded! Open console and try the functions.');
