let quotes = [];
let selectedCategory = 'all';

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

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const text = document.getElementById('quoteText').value.trim();
        const category = document.getElementById('category').value.trim();

        if (text.length < 10) {
            showFeedback('Quote must be at least 10 characters long', 'error');
            return;
        }

        quotes.push({ text, category });
        saveQuotes(); 
        populateCategories(); // ensure new category appears
        form.reset();
        showFeedback('Quote added successfully!', 'success');

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

document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
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
});
