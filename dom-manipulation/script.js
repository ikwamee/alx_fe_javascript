let quotes = [];
let selectedCategory = 'all';

// Outbox for quotes pending POST to server
let outbox = [];

// Server endpoints
const SERVER_API_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=8'; // mock GET endpoint
const SERVER_POST_URL = 'https://jsonplaceholder.typicode.com/posts'; // mock POST endpoint
const SERVER_SYNC_INTERVAL_MS = 30000; // 30 seconds
let serverSyncTimer = null;

function loadQuotes() {
    const savedQuotes = localStorage.getItem('quotes');
    quotes = savedQuotes ? JSON.parse(savedQuotes) : [
        { text: "Be the change you wish to see in the world.", category: "Inspiration" },
        { text: "Life is what happens when you're busy making other plans.", category: "Life" },
        { text: "The only way to do great work is to love what you do.", category: "Work" },
        { text: "In the middle of difficulty lies opportunity.", category: "Motivation" }
    ];
}

function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Outbox persistence
function loadOutbox() {
    const saved = localStorage.getItem('quoteOutbox');
    outbox = saved ? JSON.parse(saved) : [];
}

function saveOutbox() {
    localStorage.setItem('quoteOutbox', JSON.stringify(outbox));
}

// New: post a single quote to the server using POST
async function postQuoteToServer(quote) {
    try {
        const res = await fetch(SERVER_POST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(quote)
        });
        if (!res.ok) throw new Error(`POST failed (${res.status})`);
        const data = await res.json();
        // Server returns created resource (mock); could store id if needed
        return { success: true, data };
    } catch (err) {
        console.warn('postQuoteToServer error:', err);
        return { success: false, error: err };
    }
}

// Attempt to sync outbox: post queued quotes and remove on success
async function syncOutbox() {
    if (!outbox.length) return;
    const remaining = [];
    for (const q of outbox) {
        const result = await postQuoteToServer(q);
        if (!result.success) {
            remaining.push(q);
        } else {
            // Optionally handle server response (result.data)
            console.log('Outbox item posted:', result.data);
        }
    }
    outbox = remaining;
    saveOutbox();
    if (remaining.length === 0) showFeedback('All pending quotes synced to server.', 'success');
    else showFeedback(`${remaining.length} quote(s) remain unsynced.`, 'error');
}

function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const uniqueCategories = [...new Set(quotes.map(quote => quote.category))];

    // Keep "all" option and repopulate dynamic categories
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase(); // Use lowercase for consistency
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // Restore last selected category from localStorage
    const lastCategory = localStorage.getItem('lastSelectedCategory') || 'all';
    categoryFilter.value = lastCategory;
    selectedCategory = lastCategory;
}

function filterQuotes() {
    const category = document.getElementById('categoryFilter').value || 'all';
    selectedCategory = category;
    localStorage.setItem('lastSelectedCategory', category);

    // Update displayed quote(s)
    showRandomQuote();
}

function showRandomQuote() {
    const category = selectedCategory || 'all';
    const filteredQuotes = category === 'all'
        ? quotes
        : quotes.filter(q => q.category.toLowerCase() === category);

    if (filteredQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        displayQuote(filteredQuotes[randomIndex]);
    } else {
        document.getElementById('quoteDisplay').innerHTML = '<p>No quotes available for this category.</p>';
    }
}

function displayQuote(quote) {
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = `
        <p>${quote.text}</p>
        <span style="font-style: italic;">Category: ${quote.category}</span>
    `;
}

function createAddQuoteForm() {
    const formContainer = document.createElement('div');
    formContainer.innerHTML = `
        <h3>Add New Quote</h3>
        <form id="addQuoteForm" class="quote-form">
            <div class="form-group">
                <label for="quoteText">Quote Text:</label>
                <textarea id="quoteText" required minlength="10"></textarea>
            </div>
            <div class="form-group">
                <label for="category">Category:</label>
                <input type="text" id="category" required minlength="2">
            </div>
            <button type="submit">Add Quote</button>
        </form>
        <div id="feedback" class="feedback"></div>
    `;

    document.body.appendChild(formContainer);

    const form = document.getElementById('addQuoteForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = document.getElementById('quoteText').value.trim();
        const category = document.getElementById('category').value.trim();

        if (text.length < 10) {
            showFeedback('Quote must be at least 10 characters long', 'error');
            return;
        }

        const newQuote = { text, category };
        quotes.push(newQuote);
        saveQuotes(); 
        populateCategories(); // ensure new category appears
        form.reset();
        showFeedback('Quote added locally.', 'success');

        // Try to POST to server immediately; if fails, enqueue to outbox
        const result = await postQuoteToServer(newQuote);
        if (!result.success) {
            enqueueOutbox(newQuote);
            showFeedback('Quote queued for syncing (offline or POST failed).', 'error');
        } else {
            showFeedback('Quote posted to server.', 'success');
        }

        // If the added quote's category matches current filter, show a random quote from filtered list
        showRandomQuote();
    });
}

function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;

    setTimeout(() => {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }, 3000);
}

// --- Server simulation & syncing logic ---

// New: fetchQuotesFromServer — canonical fetch + mapping with error handling
async function fetchQuotesFromServer() {
    try {
        const res = await fetch(SERVER_API_URL);
        if (!res.ok) throw new Error(`Network response not ok (${res.status})`);
        const posts = await res.json();
        const serverQuotes = posts.map(p => ({
            id: `srv-${p.id}`,
            text: (p.body || p.title || '').trim(),
            category: `User ${p.userId}`
        })).filter(s => s.text.length > 0);
        return serverQuotes;
    } catch (err) {
        console.warn('fetchQuotesFromServer error:', err);
        return null;
    }
}

// Keep existing name for compatibility
async function fetchServerQuotes() {
    return await fetchQuotesFromServer();
}

// Replace previous compareAndSync implementation to delegate to syncQuotes
async function compareAndSync() {
    return await syncQuotes();
}

// New: syncQuotes performs a full sync cycle (flush outbox, fetch server, detect diffs, apply or notify)
// Options: { autoApply: true } -> apply server data automatically (server wins). If false, show notification for manual review.
async function syncQuotes(options = { autoApply: true }) {
    // 1) Flush local outbox first
    await syncOutbox();

    // 2) Fetch server quotes
    const serverQuotes = await fetchQuotesFromServer();
    if (!serverQuotes) {
        return { success: false, reason: 'fetch_failed' };
    }

    // 3) Compute new items and conflicts (matching by text)
    const localByText = new Map(quotes.map(q => [q.text, q]));
    const newServerItems = serverQuotes.filter(s => !localByText.has(s.text));
    const conflicts = serverQuotes.filter(s => {
        const local = localByText.get(s.text);
        return local && local.category !== s.category;
    });

    // 4) If nothing to do, return
    if (newServerItems.length === 0 && conflicts.length === 0) {
        return { success: true, applied: false, message: 'no_changes' };
    }

    // 5) Either auto-apply server data or notify user for manual resolution
    if (options.autoApply) {
        applyServerData(serverQuotes); // server precedence merge + update UI/storage
        return {
            success: true,
            applied: true,
            newServerItems: newServerItems.length,
            conflicts: conflicts.length
        };
    } else {
        showSyncNotification({ newServerItems, conflicts, serverQuotes });
        return {
            success: true,
            applied: false,
            newServerItems: newServerItems.length,
            conflicts: conflicts.length
        };
    }
}

// Apply server data automatically (server precedence): merge with local, server items override
function applyServerData(serverQuotes) {
    // Remove local items that have same text as a server item, then add server items
    const serverTexts = new Set(serverQuotes.map(s => s.text));
    const merged = [
        ...quotes.filter(l => !serverTexts.has(l.text)), // local-only items
        ...serverQuotes.map(s => ({ text: s.text, category: s.category })) // server items (override)
    ];
    quotes = merged;
    saveQuotes();
    populateCategories();
    showRandomQuote();
    dismissSyncNotification();
    showFeedback('Synchronized with server (server data applied).', 'success');
}

// Notification UI for sync/conflicts
function showSyncNotification({ newServerItems, conflicts, serverQuotes }) {
    // Avoid duplicating notification
    if (document.getElementById('syncNotification')) return;

    const banner = document.createElement('div');
    banner.id = 'syncNotification';
    banner.style = 'position:fixed;bottom:10px;right:10px;background:#222;color:#fff;padding:12px;border-radius:6px;z-index:9999;max-width:320px;';
    const summary = [];
    if (newServerItems.length) summary.push(`${newServerItems.length} new`);
    if (conflicts.length) summary.push(`${conflicts.length} conflict(s)`);
    banner.innerHTML = `
        <div><strong>Server updates detected:</strong> ${summary.join(', ')}</div>
        <div style="margin-top:8px;text-align:right;">
            <button id="acceptServerBtn">Accept server</button>
            <button id="reviewServerBtn">Review</button>
            <button id="dismissServerBtn">Dismiss</button>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('acceptServerBtn').addEventListener('click', () => applyServerData(serverQuotes));
    document.getElementById('reviewServerBtn').addEventListener('click', () => openResolveModal(newServerItems, conflicts, serverQuotes));
    document.getElementById('dismissServerBtn').addEventListener('click', dismissSyncNotification);
}

function dismissSyncNotification() {
    const el = document.getElementById('syncNotification');
    if (el) el.remove();
}

// Modal to manually resolve conflicts and choose which items to accept
function openResolveModal(newItems, conflicts, serverQuotes) {
    // remove notification banner
    dismissSyncNotification();

    // modal wrapper
    const modal = document.createElement('div');
    modal.id = 'resolveModal';
    modal.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;';
    const inner = document.createElement('div');
    inner.style = 'background:#fff;padding:16px;border-radius:8px;max-width:760px;max-height:80vh;overflow:auto;';

    inner.innerHTML = `<h3>Resolve Server Updates</h3><div id="resolveContent"></div><div style="margin-top:12px;text-align:right;">
        <button id="applyResolveBtn">Apply Choices</button>
        <button id="cancelResolveBtn">Cancel</button>
    </div>`;

    modal.appendChild(inner);
    document.body.appendChild(modal);

    const content = document.getElementById('resolveContent');

    // New items section
    if (newItems.length) {
        const sec = document.createElement('div');
        sec.innerHTML = `<h4>New server quotes (${newItems.length})</h4>`;
        newItems.forEach((s, idx) => {
            const id = `new-${idx}`;
            const row = document.createElement('div');
            row.style = 'margin-bottom:8px;padding:6px;border:1px solid #eee;';
            row.innerHTML = `
                <div><strong>${escapeHtml(s.text)}</strong></div>
                <div>Category: ${escapeHtml(s.category)}</div>
                <div>
                    <label><input type="radio" name="${id}" value="accept" checked> Accept</label>
                    <label style="margin-left:8px;"><input type="radio" name="${id}" value="ignore"> Ignore</label>
                </div>
            `;
            sec.appendChild(row);
        });
        content.appendChild(sec);
    }

    // Conflicts section
    if (conflicts.length) {
        const sec2 = document.createElement('div');
        sec2.innerHTML = `<h4>Conflicts (${conflicts.length})</h4>`;
        conflicts.forEach((s, idx) => {
            const id = `conf-${idx}`;
            const local = quotes.find(l => l.text === s.text);
            const row = document.createElement('div');
            row.style = 'margin-bottom:8px;padding:6px;border:1px solid #eee;';
            row.innerHTML = `
                <div><strong>${escapeHtml(s.text)}</strong></div>
                <div style="display:flex;gap:12px;margin-top:6px;">
                    <label style="border:1px solid #ccc;padding:6px;">
                        <input type="radio" name="${id}" value="local" checked> Keep Local (${escapeHtml(local.category)})
                    </label>
                    <label style="border:1px solid #ccc;padding:6px;">
                        <input type="radio" name="${id}" value="server"> Use Server (${escapeHtml(s.category)})
                    </label>
                </div>
            `;
            sec2.appendChild(row);
        });
        content.appendChild(sec2);
    }

    document.getElementById('applyResolveBtn').addEventListener('click', () => {
        // Apply choices for new items
        if (newItems.length) {
            newItems.forEach((s, idx) => {
                const name = `new-${idx}`;
                const choice = inner.querySelector(`input[name="${name}"]:checked`);
                if (choice && choice.value === 'accept') {
                    quotes.push({ text: s.text, category: s.category });
                }
            });
        }
        // Apply choices for conflicts
        if (conflicts.length) {
            conflicts.forEach((s, idx) => {
                const name = `conf-${idx}`;
                const choice = inner.querySelector(`input[name="${name}"]:checked`);
                if (choice && choice.value === 'server') {
                    // replace local category with server category
                    const local = quotes.find(l => l.text === s.text);
                    if (local) local.category = s.category;
                }
            });
        }
        saveQuotes();
        populateCategories();
        showRandomQuote();
        modal.remove();
        showFeedback('Manual sync choices applied.', 'success');
    });

    document.getElementById('cancelResolveBtn').addEventListener('click', () => {
        modal.remove();
    });
}

// basic HTML escape
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// start periodic server sync
function startServerSync() {
    if (serverSyncTimer) clearInterval(serverSyncTimer);
    // initial check immediately
    compareAndSync();
    serverSyncTimer = setInterval(compareAndSync, SERVER_SYNC_INTERVAL_MS);
}

// stop sync when needed
function stopServerSync() {
    if (serverSyncTimer) clearInterval(serverSyncTimer);
    serverSyncTimer = null;
}

// Start sync after DOM ready (hooked below in DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    loadOutbox();
    populateCategories();
    createAddQuoteForm();

    // register listeners now that DOM elements exist
    const newQuoteBtn = document.getElementById('newQuote');
    if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);

    const categoryFilterEl = document.getElementById('categoryFilter');
    if (categoryFilterEl) categoryFilterEl.addEventListener('change', filterQuotes);

    // restore selectedCategory and show initial quote
    selectedCategory = localStorage.getItem('lastSelectedCategory') || 'all';
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) categoryFilter.value = selectedCategory;
    showRandomQuote();

    // start server sync simulation (also flush outbox)
    startServerSync();
});
