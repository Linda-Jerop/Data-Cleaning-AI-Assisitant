# Data-Cleaning-AI-Assisitant
An AI exclusively tailored for data analysts to ease their work in data analysis. 80% of 
what data analysts do is cleaning data. They spend very little time coding the info into
the system

# Design Idea:
Modern glassmorphism ✅
Smooth micro-interactions ✅
Professional gradient palette ✅
Attention to animation details ✅


HAS AN API
IS RESPONSIVE
IS DEPLOYED

# API Used:
Hugging Face API

# Responsiveness
Uploads CSVs.
Detects missing values, duplicates, and outliers.
Shows a dashboard with stats and a data preview.
Has an AI section (even if the recommendations aren’t perfect yet).


# AI-Powered CSV Data Cleaner & Analyzer

An interactive web application that allows users to upload CSV datasets and automatically analyzes them for data quality issues using both built-in checks and AI-powered recommendations. The tool provides insights into missing values, duplicates, outliers, and overall dataset statistics, with optional AI guidance for cleaning actions.

AI is integrated through the Hugging Face Inference API (facebook/bart-large) to provide intelligent, context-aware recommendations for data cleaning.

## Features

- **CSV Upload & Preview**  
  Drag-and-drop or select CSV files for analysis. Preview data in a paginated table with type detection icons.

- **Automatic Data Quality Checks**  
  - Detect missing values and highlight them in red.  
  - Identify duplicate rows.  
  - Detect numeric outliers using standard deviation thresholds.

- **AI-Powered Recommendations**  
  - Integration with Hugging Face `facebook/bart-large` model (requires a token).  
  - Provides actionable recommendations for cleaning, standardizing, and validating datasets.  
  - Demo mode available for testing without an API key.

- **Interactive Issue Management**  
  - View detailed issues in a card layout.  
  - Suggest AI-powered fixes for specific columns or the entire dataset.  
  - Preview proposed fixes before applying (coming soon).

- **User-Friendly UI**  
  - File info and upload progress indicators.  
  - Dataset statistics (rows, columns, numeric/text columns, missing values).  
  - Dynamic paginated table with type-aware formatting.  
  - Fun visual effects (particles animation).

---

## Demo

For demo mode without API access, AI responses are simulated with predefined insights.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-csv-cleaner.git



# Next Improvements
Accessibility
Ensure sufficient color contrast (light text on gradient backgrounds might be harder for some users).
Add :focus styles for keyboard navigation (currently, only hover is styled).
Performance
Animations with heavy box shadows can be GPU-intensive. I could transform + opacity animations instead, where possible.
Maintainability
I could extract repeated gradient colors (#667eea, #764ba2) into CSS variables for easier theme changes: