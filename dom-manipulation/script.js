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
    // Also save last viewed quote to sessionStorage
    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quotes[quotes.length - 1]));
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

// Function to export quotes to JSON file
function exportQuotes() {
    const quotesJson = JSON.stringify(quotes, null, 2);
    const blob = new Blob([quotesJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-quotes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Function to import quotes from JSON file
function importQuotes(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            if (Array.isArray(importedQuotes) && importedQuotes.every(q => q.text && q.category)) {
                quotes.push(...importedQuotes);
                saveQuotes();
                showFeedback('Quotes imported successfully!', 'success');
                showRandomQuote();
            } else {
                showFeedback('Invalid quote format in file', 'error');
            }
        } catch (error) {
            showFeedback('Error importing quotes', 'error');
        }
    };
    reader.readAsText(file);
}

// Function to display a random quote
function showRandomQuote() {
    const quoteDisplay = document.getElementById('quoteDisplay');
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    
    // Create elements for the quote and category
    const quoteText = document.createElement('p');
    quoteText.textContent = quote.text;
    
    const categorySpan = document.createElement('span');
    categorySpan.textContent = `Category: ${quote.category}`;
    categorySpan.style.fontStyle = 'italic';
    
    // Clear previous content and add new quote
    quoteDisplay.innerHTML = '';
    quoteDisplay.appendChild(quoteText);
    quoteDisplay.appendChild(categorySpan);
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
        <div class="import-export-controls">
            <button id="exportBtn">Export Quotes</button>
            <input type="file" id="importFile" accept=".json">
            <label for="importFile" class="import-label">Import Quotes</label>
        </div>
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

    // Add import/export event listeners
    document.getElementById('exportBtn').addEventListener('click', exportQuotes);
    document.getElementById('importFile').addEventListener('change', importQuotes);
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

// Modify the initialization code
document.addEventListener('DOMContentLoaded', () => {
    loadQuotes();
    populateCategories(); // Populate categories on load
    createAddQuoteForm();
    showRandomQuote(); // Show initial random quote
});
