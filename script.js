ocument.addEventListener("DOMContentLoaded", () => {
    const localStorageKey = "quotesStorage";
    const sessionStorageKey = "lastViewedQuote";
    const apiUrl = "https://jsonplaceholder.typicode.com/posts"; 
    populateCategories(); 
    filterQuote();

    // Load quotes from local storage or set defaults
    let quotes = JSON.parse(localStorage.getItem(localStorageKey)) || [
        { text: "The best way to predict the future is to start doing hard things.", category: "Motivation" },
        { text: "Do what you can, with what you have, where you are.", category: "Inspiration" },
        { text: "Success is not final, failure is not the end of the world: it's the courage to continue that counts.", category: "Perseverance" }
    ];

    // UI Elements
    const quotesDisplay = document.getElementById("quoteDisplay");
    const newQuoteBtn = document.getElementById("newQuote");

    function saveQuotes() {
        localStorage.setItem(localStorageKey, JSON.stringify(quotes));
    }

    // Fetch quotes from the server and update local storage
    async function syncQuotesWithServer() {
        try {
            const response = await fetch(apiUrl);
            const serverQuotes = await response.json();

            if (!serverQuotes || serverQuotes.length === 0) {
                console.warn("No new quotes from the server.");
                return;
            }

            let localQuotes = JSON.parse(localStorage.getItem(localStorageKey)) || [];

            // Merge and handle conflicts
            let updatedQuotes = mergeQuotes(localQuotes, serverQuotes);

            // Save to local storage
            localStorage.setItem(localStorageKey, JSON.stringify(updatedQuotes));
            console.log("Quotes synced successfully!");

            displayQuotes(); // Refresh UI
        } catch (error) {
            console.error("Error syncing quotes:", error);
        }
    }
    function populateCategories() {
        const catergoryFilter = document.getElementById("category");
        catergoryFilter.innerHTML = `<option value="all">All Categories</option>`;
    
        const uniqueCategories = [...new set(quotes.map(quotes => quotes.category))];
        uniqueCategories.forEach(category => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            catergoryFilter.appendChild(option);
        });
    document.getElementById("categoryFilter").addEventListener("change", filterQuote);

    function filterQuote() {
        const categoryFilter = document.getElementById("categoryFilter");
        const quoteDisplay = document.getElementById("quoteDisplay");
        if (!categoryFilter || !quoteDisplay) return;
    
        const selectedCategory = categoryFilter.value;
        localStorage.setItem("selectedCategory", selectedCategory); // Save category
    
        const filteredQuotes = selectedCategory === "all"
            ? quotes
            : quotes.filter(q => q.category === selectedCategory);
    
        quoteDisplay.innerHTML = filteredQuotes.map(q => `<p><b>${q.category}</b>: ${q.text}</p>`).join("");
    }
    

    function mergeQuotes(local, server) {
        const localMap = new Map(local.map(q => [q.id, q]));
        server.forEach(q => {
            if (!localMap.has(q.id) || localMap.get(q.id).updatedAt < q.updatedAt) {
                localMap.set(q.id, q);
            }
        });
        return Array.from(localMap.values());
    }

    // this check every 5 secs
    setInterval(syncQuotesWithServer, 5000);

    // POST request
    async function postQuoteToServer(quote) {
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(quote)
            });

            if (!response.ok) {
                throw new Error("Failed to send quote to the server.");
            }

            console.log("Quote sent successfully to the server!");
        } catch (error) {
            console.error("Error posting quote:", error);
        }
    }

    // Display quotes in UI
    function displayQuotes() {
        quotesDisplay.innerHTML = quotes.length
            ? quotes.map(q => `<p><b>${q.category}</b>: ${q.text}</p>`).join("")
            : "<p>No quotes available.</p>";
    }

    function addQuote() {
        const newQuoteText = document.getElementById("newQuoteText").value.trim();
        const newQuoteCategory = document.getElementById("newQuoteCategory").value.trim();

        if (newQuoteText === "" || newQuoteCategory === "") {
            alert("Please enter a quote and a category.");
            return;
        }

        const newQuote = {
            id: Date.now(),
            text: newQuoteText,
            category: newQuoteCategory,
            updatedAt: new Date().toISOString()
        };

        quotes.push(newQuote);
        saveQuotes();
        postQuoteToServer(newQuote);
        displayQuotes();
    }

    function showRandomQuote() {
        if (quotes.length === 0) {
            quotesDisplay.innerText = "No quotes available. Please add a new quote.";
            return;
        }
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];
        quotesDisplay.innerHTML = `<p><b>${randomQuote.category}</b>: ${randomQuote.text}</p>`;

        // Save last viewed quote
        sessionStorage.setItem(sessionStorageKey, JSON.stringify(randomQuote));
    }

    function createAddQuoteForm() {
        const quoteInputDiv = document.createElement("div");

        const quoteInput = document.createElement("input");
        quoteInput.id = "newQuoteText";
        quoteInput.type = "text";
        quoteInput.placeholder = "Enter a quote";
        quoteInputDiv.appendChild(quoteInput);

        const categoryInput = document.createElement("input");
        categoryInput.id = "newQuoteCategory";
        categoryInput.type = "text";
        categoryInput.placeholder = "Enter a category";
        quoteInputDiv.appendChild(categoryInput);

        const addQuoteButton = document.createElement("button");
        addQuoteButton.innerText = "Add Quote";
        addQuoteButton.addEventListener("click", addQuote);
        quoteInputDiv.appendChild(addQuoteButton);

        document.body.appendChild(quoteInputDiv);
    }

    function createImportExportButtons() {
        const exportBtn = document.createElement("button");
        exportBtn.innerText = "Export Quotes";
        exportBtn.addEventListener("click", exportToJson);
        document.body.appendChild(exportBtn);

        const importInput = document.createElement("input");
        importInput.type = "file";
        importInput.accept = ".json";
        importInput.addEventListener("change", importFromJsonFile);
        document.body.appendChild(importInput);
    }

    function exportToJson() {
        const jsonBlob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "quotes.json";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
    }

    function importFromJsonFile(event) {
        const fileReader = new FileReader();
        fileReader.onload = function (event) {
            try {
                const importedQuotes = JSON.parse(event.target.result);
                if (!Array.isArray(importedQuotes)) {
                    throw new Error("Invalid format");
                }
                quotes.push(...importedQuotes);
                saveQuotes();
                alert("Quotes imported successfully!");
                displayQuotes();
            } catch (error) {
                alert("Invalid JSON file. Please check the format.");
            }
        };
        fileReader.readAsText(event.target.files[0]);
    }
    function fetchQuotesFromServer() {
        const quoteDisplay = document.getElementById("quoteDisplay");
        
        if (!quotes || quotes.length === 0) {
            quoteDisplay.innerHTML = "<p>No quotes available.</p>";
            return;
        }
        
        quoteDisplay.innerHTML = quotes.map(q => `<p><b>${q.category}</b>: ${q.text}</p>`).join("");
        if (notification) {
            notification.innerText = "Quotes synced with server!";
            notification.style.display = "block";
        }
    }
    
    // Call the function after defining it
    fetchQuotesFromServer();
    

    // Initialize UI
    if (newQuoteBtn) {
        newQuoteBtn.addEventListener("click", showRandomQuote);
    }
    createAddQuoteForm();
    createImportExportButtons();

    // Load last viewed quote
    const lastViewedQuote = JSON.parse(sessionStorage.getItem(sessionStorageKey));
    if (lastViewedQuote) {
        quotesDisplay.innerHTML = `<p><b>${lastViewedQuote.category}</b>: ${lastViewedQuote.text}</p>`;
    }

    displayQuotes();
    syncQuotesWithServer();
});
