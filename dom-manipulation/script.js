// Initial quotes array
let quotes = [];

// Load quotes from localStorage on initialization
function loadQuotes() {
    const savedQuotes = localStorage.getItem('quotes');
    quotes = savedQuotes ? JSON.parse(savedQuotes) : [
        { text: "Be the change you wish to see in the world.", category: "Inspiration" },
        { text: "Life is what happens when you're busy making other plans.", category: "Life" },
        { text: "The only way to do great work is to love what you do.", category: "Work" },
        { text: "In the middle of difficulty lies opportunity.", category: "Motivation" }
    ];
}

// Save quotes to localStorage
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to populate categories dynamically
function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const uniqueCategories = [...new Set(quotes.map(quote => quote.category))];

    // Clear existing options
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';

    // Populate dropdown with unique categories
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase(); // Use lowercase for consistency
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // Restore last selected category from localStorage
    const lastCategory = localStorage.getItem('lastSelectedCategory') || 'all';
    categoryFilter.value = lastCategory;
}

// Function to filter quotes based on selected category
function filterQuotes() {
    const category = document.getElementById('categoryFilter').value;
    const filteredQuotes = category === 'all' ? quotes : quotes.filter(quote => quote.category.toLowerCase() === category);

    // Display a random quote from the filtered list
    if (filteredQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const quote = filteredQuotes[randomIndex];
        displayQuote(quote);
    } else {
        document.getElementById('quoteDisplay').innerHTML = '<p>No quotes available for this category.</p>';
    }

    // Save the last selected category to localStorage
    localStorage.setItem('lastSelectedCategory', category);
}

// Function to display a quote
function displayQuote(quote) {
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = `
        <p>${quote.text}</p>
        <span style="font-style: italic;">Category: ${quote.category}</span>
    `;
}

// Function to create and display the add quote form
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

    // Add the form to the page
    document.body.appendChild(formContainer);

    // Add submit event listener to the form
    const form = document.getElementById('addQuoteForm');
    const feedback = document.getElementById('feedback');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const text = document.getElementById('quoteText').value.trim();
        const category = document.getElementById('category').value.trim();
        
        if (text.length < 10) {
            showFeedback('Quote must be at least 10 characters long', 'error');
            return;
        }

        quotes.push({ text, category });
        saveQuotes(); // Save to localStorage
        populateCategories(); // Update categories in dropdown
        form.reset();
        showFeedback('Quote added successfully!', 'success');
        showRandomQuote();
    });
}

// Function to show feedback messages
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    
    // Clear feedback after 3 seconds
    setTimeout(() => {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }, 3000);
}

// Add event listener for the "Show New Quote" button
document.getElementById('newQuote').addEventListener('click', showRandomQuote);

// Add event listener for the category filter
document.getElementById('categoryFilter').addEventListener('change', filterQuotes);

// Modify the initialization code
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    populateCategories(); // Populate categories on load
    showRandomQuote(); // Show initial random quote
});
