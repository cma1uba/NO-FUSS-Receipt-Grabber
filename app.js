// Local tracking array initialized from browser local storage memory
let expenses = JSON.parse(localStorage.getItem('fast_receipts')) || [];

// DOM References
const receiptInput = document.getElementById('receiptInput');
const dropZone = document.getElementById('dropZone');
const loadingState = document.getElementById('loadingState');
const ledgerBody = document.getElementById('ledgerBody');
const grandTotal = document.getElementById('grandTotal');
const emptyState = document.getElementById('emptyState');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// Initialize the dashboard UI on load
function initDashboard() {
    renderLedger();
    setupDragAndDrop();
}

// Render dynamic rows in the table matrix
function renderLedger() {
    ledgerBody.innerHTML = '';
    let totalSum = 0;

    if (expenses.length === 0) {
        emptyState.classList.remove('hidden');
        exportCsvBtn.classList.add('hidden');
        grandTotal.textContent = '$0.00';
        return;
    }

    emptyState.classList.add('hidden');
    exportCsvBtn.classList.remove('hidden');

    expenses.forEach((expense, index) => {
        totalSum += parseFloat(expense.totalAmount || 0);

        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-700/30 group';
        row.innerHTML = `
            <td class="py-3 px-2 font-medium text-slate-200" contenteditable="true" data-index="${index}" data-field="vendor">
                ${expense.vendor}
            </td>
            <td class="py-3 px-2 text-slate-400" contenteditable="true" data-index="${index}" data-field="date">
                ${expense.date}
            </td>
            <td class="py-3 px-2 text-right font-semibold text-emerald-400" contenteditable="true" data-index="${index}" data-field="totalAmount">
                $${parseFloat(expense.totalAmount).toFixed(2)}
            </td>
            <td class="py-3 px-2 text-center">
                <button class="delete-btn text-slate-500 hover:text-rose-400 p-1 font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" data-index="${index}">
                    ✕
                </button>
            </td>
        `;
        ledgerBody.appendChild(row);
    });

    grandTotal.textContent = `$${totalSum.toFixed(2)}`;
}

// Event Delegation for Table Edits and Deletions
ledgerBody.addEventListener('input', (e) => {
    const index = e.target.getAttribute('data-index');
    const field = e.target.getAttribute('data-field');
    if (index !== null && field !== null) {
        let cleanValue = e.target.innerText.replace('$', '');
        expenses[index][field] = cleanValue;
        
        // Recalculate layout metrics on total amount modification
        if (field === 'totalAmount') {
            let runningSum = expenses.reduce((sum, item) => sum + (parseFloat(item.totalAmount) || 0), 0);
            grandTotal.textContent = `$${runningSum.toFixed(2)}`;
        }
        localStorage.setItem('fast_receipts', JSON.stringify(expenses));
    }
});

ledgerBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const index = e.target.getAttribute('data-index');
        expenses.splice(index, 1);
        localStorage.setItem('fast_receipts', JSON.stringify(expenses));
        renderLedger();
    }
});

// Drag & Drop Experience Optimizations
function setupDragAndDrop() {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('border-emerald-400', 'bg-slate-900');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-emerald-400', 'bg-slate-900');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleImageCapture(files[0]);
    });
}

// Trigger simulation when selecting a file input stream
receiptInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleImageCapture(e.target.files[0]);
});

// Mocking API transaction pipeline execution states
const API_URL = 'https://no-fuss-receipt-grabber.onrender.com'
async function handleImageCapture(file) {
    loadingState.classList.remove('hidden');
    
    // Assemble the multi-part form payload
    const formData = new FormData();
    formData.append('receipt', file);

    try {
        const response = await fetch(`${API_URL}/api/scan`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Network extraction failed');

        const extractedExpense = await response.json();
        
        // Add the fresh AI data to the top of our local history stack
        expenses.unshift(extractedExpense);
        localStorage.setItem('fast_receipts', JSON.stringify(expenses));
        
        renderLedger();

    } catch (error) {
        console.error('Error scanning receipt:', error);
        alert('AI was unable to read this image clearly. Please try again or upload a sharper snap.');
    } finally {
        loadingState.classList.add('hidden');
    }
}

// Run layout boot sequence
initDashboard();