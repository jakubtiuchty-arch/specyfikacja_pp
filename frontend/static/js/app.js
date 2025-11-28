// API Base URL
const API_URL = '/api';

// DOM Elements
const requirementsFile = document.getElementById('requirements-file');
const requirementsDrop = document.getElementById('requirements-drop');
const requirementsStatus = document.getElementById('requirements-status');
const requirementsDetails = document.getElementById('requirements-details');

const devicesFile = document.getElementById('devices-file');
const devicesDrop = document.getElementById('devices-drop');
const devicesList = document.getElementById('devices-list');

const analysisProgress = document.getElementById('analysis-progress');
const resultsContainer = document.getElementById('results-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initUploadZones();
    loadExistingData();
});

// Setup drag & drop
function initUploadZones() {
    // Requirements upload
    setupDropZone(requirementsDrop, requirementsFile, uploadRequirements);

    // Devices upload
    setupDropZone(devicesDrop, devicesFile, uploadDevices);
}

function setupDropZone(dropZone, fileInput, uploadFunction) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        uploadFunction(files);
    });

    fileInput.addEventListener('change', (e) => {
        uploadFunction(e.target.files);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Upload requirements PDF
async function uploadRequirements(files) {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.pdf')) {
        showStatus(requirementsStatus, 'error', 'Tylko pliki PDF są akceptowane');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showStatus(requirementsStatus, 'info', 'Przesyłanie i analiza...');

    try {
        const response = await fetch(`${API_URL}/upload/requirements`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showStatus(requirementsStatus, 'success', data.message);
            loadRequirementsDetails();
        } else {
            showStatus(requirementsStatus, 'error', data.message || 'Błąd przesyłania');
        }
    } catch (error) {
        showStatus(requirementsStatus, 'error', `Błąd: ${error.message}`);
    }
}

// Upload device catalogs
async function uploadDevices(files) {
    for (const file of files) {
        if (!file.name.endsWith('.pdf')) continue;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/upload/device`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                addDeviceToList(file.name);
            }
        } catch (error) {
            console.error(`Błąd uploadu ${file.name}:`, error);
        }
    }
}

// Load existing data
async function loadExistingData() {
    // Load requirements
    try {
        const reqResponse = await fetch(`${API_URL}/requirements`);
        const reqData = await reqResponse.json();

        if (reqData.loaded) {
            showStatus(requirementsStatus, 'success', `Załadowano ${reqData.count} wymagań`);
            loadRequirementsDetails();
        }
    } catch (error) {
        console.log('Brak załadowanych wymagań');
    }

    // Load devices
    try {
        const devResponse = await fetch(`${API_URL}/devices`);
        const devData = await devResponse.json();

        devData.files.forEach(filename => addDeviceToList(filename));
    } catch (error) {
        console.log('Brak wgranych urządzeń');
    }
}

// Load requirements details
async function loadRequirementsDetails() {
    try {
        const response = await fetch(`${API_URL}/requirements/details`);
        const data = await response.json();

        if (data.requirements && data.requirements.length > 0) {
            let html = '<h4>Parametry do sprawdzenia:</h4><ul>';
            data.requirements.forEach(req => {
                html += `<li><strong>${req.nazwa}</strong>: ${req.wymaganie_minimalne}</li>`;
            });
            html += '</ul>';

            requirementsDetails.innerHTML = html;
            requirementsDetails.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Błąd ładowania szczegółów:', error);
    }
}

// Add device to list
function addDeviceToList(filename) {
    // Check if already exists
    if (document.querySelector(`[data-filename="${filename}"]`)) return;

    const item = document.createElement('div');
    item.className = 'file-item';
    item.dataset.filename = filename;
    item.innerHTML = `
        <div class="filename">
            <span>📄</span>
            <span>${filename}</span>
        </div>
        <div class="actions">
            <button class="btn-analyze" onclick="analyzeDevice('${filename}')">Analizuj</button>
            <button class="btn-delete" onclick="deleteDevice('${filename}')">Usuń</button>
        </div>
    `;

    devicesList.appendChild(item);
}

// Analyze single device
async function analyzeDevice(filename) {
    showProgress(true);

    try {
        const response = await fetch(`${API_URL}/analyze/${filename}`, {
            method: 'POST'
        });

        const data = await response.json();
        displayResults([data]);
    } catch (error) {
        showStatus(requirementsStatus, 'error', `Błąd analizy: ${error.message}`);
    } finally {
        showProgress(false);
    }
}

// Analyze all devices
async function analyzeAll() {
    showProgress(true);

    try {
        const response = await fetch(`${API_URL}/analyze-all`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.reports && data.reports.length > 0) {
            displayResults(data.reports);
        } else {
            resultsContainer.innerHTML = '<p>Brak urządzeń do analizy. Wgraj karty katalogowe.</p>';
        }
    } catch (error) {
        showStatus(requirementsStatus, 'error', `Błąd analizy: ${error.message}`);
    } finally {
        showProgress(false);
    }
}

// Compare devices
async function compareDevices() {
    showProgress(true);

    try {
        const response = await fetch(`${API_URL}/compare`);
        const data = await response.json();

        if (data.error) {
            resultsContainer.innerHTML = `<p>${data.error}</p>`;
        } else {
            displayComparison(data);
        }
    } catch (error) {
        showStatus(requirementsStatus, 'error', `Błąd porównania: ${error.message}`);
    } finally {
        showProgress(false);
    }
}

// Delete device
async function deleteDevice(filename) {
    try {
        const response = await fetch(`${API_URL}/device/${filename}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            const item = document.querySelector(`[data-filename="${filename}"]`);
            if (item) item.remove();
        }
    } catch (error) {
        console.error('Błąd usuwania:', error);
    }
}

// Display results
function displayResults(reports) {
    let html = '';

    reports.forEach(report => {
        const summary = report.podsumowanie;

        html += `
            <div class="result-card">
                <div class="result-header">
                    <h3>${report.nazwa_urzadzenia}</h3>
                    <div class="summary">
                        <span class="summary-item pass">SPEŁNIA: ${summary.spelnia}</span>
                        <span class="summary-item fail">NIE SPEŁNIA: ${summary.nie_spelnia}</span>
                        <span class="summary-item unknown">DO WERYFIKACJI: ${summary.do_weryfikacji}</span>
                    </div>
                </div>
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Parametr</th>
                            <th>Wymaganie minimalne</th>
                            <th>Wartość urządzenia</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        report.wyniki.forEach(result => {
            const statusClass = result.status === 'SPEŁNIA' ? 'pass' :
                result.status === 'NIE SPEŁNIA' ? 'fail' : 'unknown';

            html += `
                <tr>
                    <td>${result.parametr}</td>
                    <td>${result.wymaganie_minimalne}</td>
                    <td>${result.wartosc_urzadzenia}</td>
                    <td><span class="status-badge ${statusClass}">${result.status}</span></td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

// Display comparison table
function displayComparison(data) {
    if (!data.urzadzenia || data.urzadzenia.length === 0) {
        resultsContainer.innerHTML = '<p>Brak urządzeń do porównania</p>';
        return;
    }

    let html = `
        <div class="result-card">
            <h3>Porównanie urządzeń</h3>
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Parametr</th>
                        <th>Wymaganie min.</th>
    `;

    data.urzadzenia.forEach(device => {
        html += `<th>${device}</th>`;
    });

    html += `</tr></thead><tbody>`;

    data.parametry.forEach(param => {
        html += `
            <tr>
                <td><strong>${param.parametr}</strong></td>
                <td>${param.wymaganie_minimalne}</td>
        `;

        data.urzadzenia.forEach(device => {
            const wynik = param.wyniki[device];
            if (wynik) {
                const statusClass = wynik.status === 'SPEŁNIA' ? 'pass' :
                    wynik.status === 'NIE SPEŁNIA' ? 'fail' : '';
                html += `<td class="${statusClass}">${wynik.wartosc}<br><small>${wynik.status}</small></td>`;
            } else {
                html += `<td>-</td>`;
            }
        });

        html += `</tr>`;
    });

    html += `</tbody></table></div>`;

    resultsContainer.innerHTML = html;
}

// Helper functions
function showStatus(element, type, message) {
    element.className = `status ${type}`;
    element.textContent = message;
    element.style.display = 'block';
}

function showProgress(show) {
    analysisProgress.classList.toggle('hidden', !show);
}
