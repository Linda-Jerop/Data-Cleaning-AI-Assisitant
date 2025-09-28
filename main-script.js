let currentData = null;
let dataStats = {};
let detectedIssues = [];
let currentFileName = '';
let currentFileSize = 0;
let currentPage = 1;
let rowsPerPage = 20;
let totalPages = 1;

// File upload handling
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const dashboard = document.getElementById('dashboard');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const progressFill = document.getElementById('progressFill');
const uploadProgress = document.getElementById('uploadProgress');
const uploadProgressFill = document.getElementById('uploadProgressFill');

fileInput.addEventListener('change', handleFileSelect);
uploadZone.addEventListener('click', (e) => {
    if (!uploadZone.classList.contains('processing')) {
        fileInput.click();
    }
});

uploadZone.addEventListener(handleDragOver)
function handleDragOver(e) {
    e.preventDefault();
    if (!uploadZone.classList.contains('processing')) {
        uploadZone.classList.add('dragover');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateFile(file) {
    const errors = [];
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        errors.push('Please upload a CSV file (.csv extension)');
    }
    
    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
        errors.push('File size must be less than 100MB');
    }
    
    // Check if file is empty
    if (file.size === 0) {
        errors.push('File appears to be empty');
    }
    
    return errors;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <span style="font-size: 1.5rem;">⚠️</span>
        <div>
            <strong>Upload Error:</strong><br>
            ${message}
        </div>
    `;
    
    // Insert after upload section
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.insertAdjacentElement('afterend', errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <span style="font-size: 1.5rem;">✅</span>
        <div>
            <strong>Success:</strong><br>
            ${message}
        </div>
    `;
    
    // Insert after upload section
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.insertAdjacentElement('afterend', successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function handleFile(file) {
    // Remove any existing error messages
    document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());
    
    // Validate file
    const errors = validateFile(file);
    if (errors.length > 0) {
        showError(errors.join('<br>'));
        return;
    }
    
    // Store file info
    currentFileName = file.name;
    currentFileSize = file.size;
    
    // Show processing state
    uploadZone.classList.add('processing');
    uploadProgress.style.display = 'block';
    dashboard.style.display = 'block';
    loading.style.display = 'block';
    results.style.display = 'none';
    
    // Simulate upload progress
    simulateUploadProgress();
    
    // Parse CSV with enhanced options
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        encoding: 'UTF-8',
        delimitersToGuess: [',', ';', '\t', '|'],
        complete: function(results) {
            setTimeout(() => {
                if (results.errors && results.errors.length > 0) {
                    console.warn('CSV parsing warnings:', results.errors);
                }
                
                if (results.data && results.data.length > 0) {
                    currentData = results.data;
                    currentPage = 1;
                    totalPages = Math.ceil(currentData.length / rowsPerPage);
                    
                    analyzeData();
                    displayResults();
                    
                    uploadZone.classList.remove('processing');
                    uploadProgress.style.display = 'none';
                    loading.style.display = 'none';
                    results.style.display = 'block';
                    
                    showSuccess(`Successfully processed ${currentData.length} rows from ${file.name}`);
                } else {
                    showError('No data found in the CSV file. Please check the file format.');
                    resetUploadState();
                }
            }, 1500);
        },
        error: function(error) {
            console.error('CSV parsing error:', error);
            showError(`Error parsing CSV: ${error.message}`);
            resetUploadState();
        }
    });
}

function resetUploadState() {
    uploadZone.classList.remove('processing');
    uploadProgress.style.display = 'none';
    dashboard.style.display = 'none';
}

function simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 25 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        uploadProgressFill.style.width = progress + '%';
    }, 200);
}

function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
    }, 300);
}

function analyzeData() {
    if (!currentData || currentData.length === 0) return;

    const columns = Object.keys(currentData[0]);
    dataStats = {
        totalRows: currentData.length,
        totalColumns: columns.length,
        missingValues: 0,
        duplicates: 0,
        outliers: 0
    };

    detectedIssues = [];

//     Papa.parse(file, {
//     header: true,
//     complete: async function(results) {
//         const csvData = results.data;
        
//         // Get AI analysis
//         const aiInsights = await analyzeDataQuality(csvData);
        
//         // Display results to user
//         displayCleaningRecommendations(aiInsights);
//     }
// });
    // Analyze missing values
    columns.forEach(col => {
        const missingCount = currentData.filter(row => 
            row[col] === null || row[col] === undefined || row[col] === ''
        ).length;
        
        if (missingCount > 0) {
            dataStats.missingValues += missingCount;
            detectedIssues.push({
                type: 'missing',
                title: `Missing Values in "${col}"`,
                description: `Found ${missingCount} missing values (${(missingCount/currentData.length*100).toFixed(1)}%)`,
                column: col,
                count: missingCount,
                severity: missingCount > currentData.length * 0.1 ? 'high' : 'medium'
            });
        }
    });

    // Detect duplicates
    const duplicateRows = [];
    const seen = new Set();
    currentData.forEach((row, index) => {
        const rowString = JSON.stringify(row);
        if (seen.has(rowString)) {
            duplicateRows.push(index);
        } else {
            seen.add(rowString);
        }
    });

    if (duplicateRows.length > 0) {
        dataStats.duplicates = duplicateRows.length;
        detectedIssues.push({
            type: 'duplicate',
            title: 'Duplicate Rows Detected',
            description: `Found ${duplicateRows.length} duplicate rows that should be reviewed`,
            count: duplicateRows.length,
            severity: 'medium'
        });
    }

    // Detect potential outliers (for numeric columns)
    columns.forEach(col => {
        const numericValues = currentData
            .map(row => parseFloat(row[col]))
            .filter(val => !isNaN(val));

        if (numericValues.length > 10) {
            const mean = _.mean(numericValues);
            const std = Math.sqrt(_.mean(numericValues.map(x => Math.pow(x - mean, 2))));
            const outliers = numericValues.filter(val => Math.abs(val - mean) > 3 * std);

            if (outliers.length > 0) {
                dataStats.outliers += outliers.length;
                detectedIssues.push({
                    type: 'outlier',
                    title: `Potential Outliers in "${col}"`,
                    description: `Found ${outliers.length} values that deviate significantly from the mean`,
                    column: col,
                    count: outliers.length,
                    severity: 'low'
                });
            }
        }
    });
}

function displayResults() {
    displayFileInfo();
    displayStats();
    displayPreview();
    displayIssues();
}

function displayFileInfo() {
    const fileInfo = document.getElementById('fileInfo');
    const processingTime = Math.random() * 2 + 0.5; // Simulate processing time
    
    fileInfo.innerHTML = `
        <div class="file-details">
            <div class="file-icon">📄</div>
            <div class="file-meta">
                <div class="file-name">${currentFileName}</div>
                <div class="file-stats">
                    ${formatFileSize(currentFileSize)} • 
                    ${currentData.length.toLocaleString()} rows • 
                    ${Object.keys(currentData[0]).length} columns •
                    Processed in ${processingTime.toFixed(1)}s
                </div>
            </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #28a745; font-weight: bold;">✓ Ready for Analysis</span>
        </div>
    `;
}

function displayStats() {
    const statsGrid = document.getElementById('statsGrid');
    const columns = Object.keys(currentData[0]);
    
    // Enhanced statistics
    const numericColumns = columns.filter(col => {
        const sample = currentData.slice(0, 100);
        const numericCount = sample.filter(row => !isNaN(parseFloat(row[col]))).length;
        return numericCount > sample.length * 0.7;
    });

    const textColumns = columns.filter(col => !numericColumns.includes(col));
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${currentData.length.toLocaleString()}</div>
            <div class="stat-label">Total Rows</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${columns.length}</div>
            <div class="stat-label">Total Columns</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${numericColumns.length}</div>
            <div class="stat-label">Numeric Columns</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${textColumns.length}</div>
            <div class="stat-label">Text Columns</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${dataStats.missingValues || 0}</div>
            <div class="stat-label">Missing Values</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${detectedIssues.length}</div>
            <div class="stat-label">Issues Detected</div>
        </div>
    `;
}

function displayPreview() {
    if (!currentData || currentData.length === 0) return;

    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const columns = Object.keys(currentData[0]);
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, currentData.length);
    const pageData = currentData.slice(startIndex, endIndex);

    // Update pagination info
    document.getElementById('pageInfo').textContent = 
        `Showing ${startIndex + 1}-${endIndex} of ${currentData.length.toLocaleString()} rows`;
    
    // Enable/disable pagination buttons
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;

    // Create enhanced header with data type indicators
    tableHead.innerHTML = `<tr>${columns.map(col => {
        const dataType = detectColumnType(col);
        const typeIcon = getTypeIcon(dataType);
        return `<th>${typeIcon} ${col}<br><small style="opacity:0.7">${dataType}</small></th>`;
    }).join('')}</tr>`;

    // Create body with enhanced formatting
    tableBody.innerHTML = pageData.map((row, rowIndex) => 
        `<tr>${columns.map(col => {
            const value = row[col];
            let displayValue = value;
            let cellClass = '';
            
            if (value === null || value === undefined || value === '') {
                displayValue = '<span style="color: #dc3545; font-style: italic; background: #ffebee; padding: 2px 6px; border-radius: 4px;">missing</span>';
                cellClass = 'missing-value';
            } else if (typeof value === 'number') {
                displayValue = value.toLocaleString();
                cellClass = 'numeric-value';
            } else if (typeof value === 'string' && value.length > 50) {
                displayValue = value.substring(0, 50) + '...';
                cellClass = 'long-text';
            }
            
            return `<td class="${cellClass}" title="${value}">${displayValue}</td>`;
        }).join('')}</tr>`
    ).join('');
}

function detectColumnType(columnName) {
    if (!currentData || currentData.length === 0) return 'unknown';
    
    const sampleSize = Math.min(100, currentData.length);
    const sample = currentData.slice(0, sampleSize).map(row => row[columnName]);
    const nonNullSample = sample.filter(val => val !== null && val !== undefined && val !== '');
    
    if (nonNullSample.length === 0) return 'empty';
    
    // Check for numbers
    const numberCount = nonNullSample.filter(val => !isNaN(parseFloat(val))).length;
    if (numberCount > nonNullSample.length * 0.8) {
        return numberCount === nonNullSample.length ? 'number' : 'mostly-number';
    }
    
    // Check for dates
    const dateCount = nonNullSample.filter(val => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && val.toString().match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/);
    }).length;
    if (dateCount > nonNullSample.length * 0.7) {
        return 'date';
    }
    
    // Check for emails
    const emailCount = nonNullSample.filter(val => 
        typeof val === 'string' && val.includes('@') && val.includes('.')
    ).length;
    if (emailCount > nonNullSample.length * 0.7) {
        return 'email';
    }
    
    return 'text';
}

function getTypeIcon(dataType) {
    const icons = {
        'number': '🔢',
        'mostly-number': '🔢',
        'date': '📅',
        'email': '📧',
        'text': '📝',
        'empty': '❌',
        'unknown': '❓'
    };
    return icons[dataType] || '📝';
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayPreview();
    }
}

function displayIssues() {
    const issuesList = document.getElementById('issuesList');
    
    if (detectedIssues.length === 0) {
        issuesList.innerHTML = `
            <div class="issue-card" style="background: #d4edda; border-color: #c3e6cb; border-left-color: #28a745;">
                <div class="issue-title" style="color: #155724;">🎉 Great News!</div>
                <div class="issue-description">No major data quality issues detected. Your data looks clean and ready for analysis!</div>
            </div>
        `;
        return;
    }

    issuesList.innerHTML = detectedIssues.map(issue => `
        <div class="issue-card ${issue.severity === 'high' ? 'high-severity' : ''}">
            <div class="issue-title">
                ${issue.severity === 'high' ? '🚨' : issue.severity === 'medium' ? '⚠️' : '💡'} 
                ${issue.title}
            </div>
            <div class="issue-description">${issue.description}</div>
            <div class="issue-actions">
                <button class="btn btn-small btn-success" onclick="suggestFix('${issue.type}', '${issue.column || ''}')">
                    🔧 Get AI Suggestion
                </button>
                <button class="btn btn-small btn-info" onclick="previewFix('${issue.type}', '${issue.column || ''}')">
                    👀 Preview Fix
                </button>
            </div>
        </div>
    `).join('');
}

function suggestFix(issueType, column) {
    // This will be expanded in Phase 2 with actual AI suggestions
    alert(`AI Suggestion for ${issueType} in ${column || 'dataset'}:\n\nThis feature will provide intelligent recommendations based on data patterns and context. Coming in the next phase!`);
}

function previewFix(issueType, column) {
    // This will be expanded in Phase 3 with preview functionality
    alert(`Preview for ${issueType} fix in ${column || 'dataset'}:\n\nThis will show before/after comparison of the proposed cleaning actions. Coming soon!`);
}

//For the floating particles
function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.body.appendChild(particlesContainer);
    
    setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size and position
        const size = Math.random() * 6 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        particlesContainer.appendChild(particle);
        
        // Remove after animation
        setTimeout(() => {
            particle.remove();
        }, 10000);
    }, 300);
}

// Initialize particles when page loads
document.addEventListener('DOMContentLoaded', createParticles);

// Your API configuration
const HF_API_KEY = 'your_token_here'; // Keep this secure!
const API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

// Function to call Hugging Face API
async function analyzeDataQuality(dataText) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: `Analyze this data for quality issues: ${dataText}`,
            parameters: {
                max_length: 100
            }
        })
    });
    
    const result = await response.json();
    return result;
}

// Use it with your CSV data
async function processCSV(csvData) {
    const analysis = await analyzeDataQuality(JSON.stringify(csvData));
    console.log('AI Analysis:', analysis);
}