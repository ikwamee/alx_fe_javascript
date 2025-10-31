// Initial quotes array
let quotes = [
    { text: "Be the change you wish to see in the world.", category: "Inspiration" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "The only way to do great work is to love what you do.", category: "Work" },
    { text: "In the middle of difficulty lies opportunity.", category: "Motivation" }
];

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
        <div id="feedback" class="feedback"></div>
    `;

    // Add the form to the page
    document.body.appendChild(formContainer);

    // Add submit event listener to the form
    const form = document.getElementById('addQuoteForm');
    const feedback = document.getElementById('feedback');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const text = document.getElementById('quoteText').value.trim();
        const category = document.getElementById('category').value.trim();
        
        // Validate input
        if (text.length < 10) {
            showFeedback('Quote must be at least 10 characters long', 'error');
            return;
        }

        // Add new quote to array
        quotes.push({ text, category });
        
        // Clear form
        form.reset();
        
        // Show success message
        showFeedback('Quote added successfully!', 'success');
        
        // Show the new quote
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

// Create the add quote form when the page loads
document.addEventListener('DOMContentLoaded', () => {
    createAddQuoteForm();
    showRandomQuote(); // Show initial random quote
});
