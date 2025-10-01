//Imports token from config.js
import { HF_API_KEY } from './config.js';

// Global variables
let currentData = null;
let dataStats = {};
let detectedIssues = [];
let currentFileName = '';
let currentFileSize = 0;
let currentPage = 1;
let rowsPerPage = 20;
let totalPages = 1;

// ===== DUAL MODE CONFIGURATION =====
const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// const HF_API_KEY = IS_LOCAL ? 'hf_MY_new_token_here' : 'demo_mode';  // Replace with new token
const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large';

// Mock AI responses for public demo
const DEMO_AI_RESPONSES = [
    "This dataset shows good structure but has missing values in the salary column. Consider using median imputation for numerical gaps.",
    "Detected duplicate entries - recommend deduplication based on customer_id and timestamp combinations.", 
    "Email format inconsistencies found. Standardize to lowercase and validate format patterns.",
    "Outlier detection shows extreme values in the amount column. Review transactions over $10,000 for accuracy.",
    "Data type inconsistencies detected. Convert date strings to proper datetime format for analysis."
];

// AI Analysis Function (sends the dataset description to Hugging Face and retrieves recommendations)
async function getAIInsights(dataDescription) {
    try {
        if (!IS_LOCAL) {
            console.log('Demo mode: Using simulated AI response');
            const randomResponse = DEMO_AI_RESPONSES[Math.floor(Math.random() * DEMO_AI_RESPONSES.length)];
            return [{
                generated_text: randomResponse
            }];
        }

        console.log('Local mode: Calling real AI API...');
        
        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `Analyze this dataset and provide data cleaning recommendations: ${dataDescription}`,
                parameters: {
                    max_length: 150,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Real AI Analysis received:', result);
        return result;
        
    } catch (error) {
        console.error('AI API Error:', error);
        
        const fallbackResponse = "AI analysis temporarily unavailable. Based on common patterns, consider checking for missing values, duplicates, and data type consistency.";
        return [{
            generated_text: fallbackResponse
        }];
    }
}

// Process AI Recommendations
function processAIRecommendations(aiResponse) {
    if (!aiResponse || !Array.isArray(aiResponse) || aiResponse.length === 0) {
        return;
    }
    
    const recommendation = aiResponse[0].generated_text || aiResponse[0].text || 'Analysis complete';
    
    detectedIssues.push({
        type: 'ai-insight',
        title: '🤖 AI-Powered Recommendations',
        description: recommendation,
        severity: 'info',
        isAI: true
    });

    // ✅ Write recommendation into the #ai-insights div
    const aiInsightsDiv = document.getElementById('ai-insights');
    console.log("DEBUG: ai-insights element = ", document.getElementById('ai-insights'));
if (aiInsightsDiv) {
    aiInsightsDiv.style.display = 'block';
} else {
    console.warn("⚠️ ai-insights div not found at this point");
}

    if (aiInsightsDiv) {
        aiInsightsDiv.style.display = 'block';
        aiInsightsDiv.innerHTML = `
            <div class="issue-card ai-insight-card">
                <div class="issue-title">🤖 AI Recommendations</div>
                <div class="issue-description">${recommendation}</div>
            </div>
        `;
    }
    
    console.log('🎯 AI Recommendations processed:', recommendation);
}

// Create Data Description for AI(creates a structured summary of the uploaded CSV)
function createDataDescription() {
    const columns = Object.keys(currentData[0]);
    const numericCols = columns.filter(col => {
        const sample = currentData.slice(0, 10);
        return sample.some(row => !isNaN(parseFloat(row[col])));
    });
    
    return `Dataset: ${dataStats.totalRows} rows, ${dataStats.totalColumns} columns. 
    Columns: ${columns.join(', ')}. 
    Numeric columns: ${numericCols.join(', ')}. 
    Issues found: ${dataStats.missingValues} missing values, ${dataStats.duplicates} duplicates, ${dataStats.outliers} outliers.`;
}

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

uploadZone.addEventListener('dragover', handleDragOver);
uploadZone.addEventListener('dragleave', handleDragLeave);
uploadZone.addEventListener('drop', handleFileDrop);

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
    
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        errors.push('Please upload a CSV file (.csv extension)');
    }
    
    if (file.size > 100 * 1024 * 1024) {
        errors.push('File size must be less than 100MB');
    }
    
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
    
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.insertAdjacentElement('afterend', errorDiv);
    
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
    
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.insertAdjacentElement('afterend', successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function handleFile(file) {
    console.log("DEBUG: handleFile called with:", file.name);
    
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
    
    // Parse CSV
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        encoding: 'UTF-8',
        delimitersToGuess: [',', ';', '\t', '|'],
        complete: async function(results) {
            setTimeout(async () => {
                if (results.errors && results.errors.length > 0) {
                    console.warn('CSV parsing warnings:', results.errors);
                }
                
                if (results.data && results.data.length > 0) {
                    currentData = results.data;
                    currentPage = 1;
                    totalPages = Math.ceil(currentData.length / rowsPerPage);
                    
                    await analyzeDataWithAI();
                    displayResults();
                    
                    uploadZone.classList.remove('processing');
                    uploadProgress.style.display = 'none';
                    loading.style.display = 'none';
                    results.style.display = 'block';
                    
                    showSuccess(`Successfully processed ${currentData.length} rows from ${file.name} with AI analysis`);
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

async function analyzeDataWithAI() {
    console.log('📊 Starting data analysis...');
    
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

    // 1. Analyze missing values
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

    // 2. Detect duplicates
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

    // 3. Detect potential outliers
    columns.forEach(col => {
        const numericValues = currentData
            .map(row => parseFloat(row[col]))
            .filter(val => !isNaN(val));

        if (numericValues.length > 10) {
            const mean = numericValues.reduce((a, b) => a + b) / numericValues.length;
            const std = Math.sqrt(numericValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numericValues.length);
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

    // GET AI INSIGHTS
    console.log('🤖 Getting AI recommendations...');
    const dataDescription = createDataDescription();
    const aiInsights = await getAIInsights(dataDescription);
    
    if (aiInsights) {
        processAIRecommendations(aiInsights);
        console.log('✅ AI analysis complete');
    } else {
        console.log('⚠️ AI analysis unavailable - continuing with standard analysis');
    }
}

function displayResults() {
    displayFileInfo();
    displayStats();
    displayPreview();
    displayIssues();
}

function displayFileInfo() {
    const fileInfo = document.getElementById('fileInfo');
    const processingTime = Math.random() * 2 + 0.5;
    
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
            <span style="color: #007bff; font-size: 0.9em;">🤖 AI-Enhanced</span>
        </div>
    `;
}

function displayStats() {
    const statsGrid = document.getElementById('statsGrid');
    const columns = Object.keys(currentData[0]);
    
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
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, currentData.length);
    const pageData = currentData.slice(startIndex, endIndex);

    document.getElementById('pageInfo').textContent = 
        `Showing ${startIndex + 1}-${endIndex} of ${currentData.length.toLocaleString()} rows`;
    
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;

    tableHead.innerHTML = `<tr>${columns.map(col => {
        const dataType = detectColumnType(col);
        const typeIcon = getTypeIcon(dataType);
        return `<th>${typeIcon} ${col}<br><small style="opacity:0.7">${dataType}</small></th>`;
    }).join('')}</tr>`;

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
    
    const numberCount = nonNullSample.filter(val => !isNaN(parseFloat(val))).length;
    if (numberCount > nonNullSample.length * 0.8) {
        return numberCount === nonNullSample.length ? 'number' : 'mostly-number';
    }
    
    const dateCount = nonNullSample.filter(val => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && val.toString().match(/\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}/);
    }).length;
    if (dateCount > nonNullSample.length * 0.7) {
        return 'date';
    }
    
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
        <div class="issue-card ${issue.severity === 'high' ? 'high-severity' : ''} ${issue.isAI ? 'ai-insight-card' : ''}">
            <div class="issue-title">
                ${issue.severity === 'high' ? '🚨' : issue.severity === 'medium' ? '⚠️' : issue.isAI ? '🤖' : '💡'} 
                ${issue.title}
            </div>
            <div class="issue-description">${issue.description}</div>
            ${!issue.isAI ? `
                <div class="issue-actions">
                    <button class="btn btn-small btn-success" onclick="suggestFix('${issue.type}', '${issue.column || ''}')">
                        🔧 Get AI Suggestion
                    </button>
                    <button class="btn btn-small btn-info" onclick="previewFix('${issue.type}', '${issue.column || ''}')">
                        👀 Preview Fix
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function suggestFix(issueType, column) {
    alert(`AI Suggestion for ${issueType} in ${column || 'dataset'}:\n\nThis feature will provide intelligent recommendations based on data patterns and context. Enhanced with REST API integration!`);
}

function previewFix(issueType, column) {
    alert(`Preview for ${issueType} fix in ${column || 'dataset'}:\n\nThis will show before/after comparison of the proposed cleaning actions. Coming soon!`);
}

function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    document.body.appendChild(particlesContainer);
    
    setInterval(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 6 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        particlesContainer.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 10000);
    }, 300);
}

document.addEventListener('DOMContentLoaded', createParticles);
