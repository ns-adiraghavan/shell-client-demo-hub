import { SearchResult } from "./searchService";

export const exportToBibTeX = (results: SearchResult[], query: string) => {
  const bibEntries = results.map((result, index) => {
    const key = `${result.source.toLowerCase()}${index + 1}`;
    const year = result.date ? new Date(result.date).getFullYear() : 'n.d.';
    const authors = result.authors || 'Anonymous';
    
    let entry = '';
    if (result.source === 'PubMed' || result.source === 'arXiv') {
      entry = `@article{${key},\n`;
      entry += `  author = {${authors}},\n`;
      entry += `  title = {${result.title}},\n`;
      entry += `  year = {${year}},\n`;
      if (result.abstract) entry += `  abstract = {${result.abstract.substring(0, 200)}...},\n`;
      entry += `  url = {${result.url}}\n`;
      entry += `}`;
    } else if (result.source === 'ClinicalTrials') {
      entry = `@misc{${key},\n`;
      entry += `  title = {${result.title}},\n`;
      entry += `  year = {${year}},\n`;
      if (result.phase) entry += `  note = {Phase: ${result.phase}},\n`;
      entry += `  howpublished = {ClinicalTrials.gov},\n`;
      entry += `  url = {${result.url}}\n`;
      entry += `}`;
    } else if (result.source === 'Patents') {
      entry = `@patent{${key},\n`;
      entry += `  author = {${authors}},\n`;
      entry += `  title = {${result.title}},\n`;
      entry += `  year = {${year}},\n`;
      entry += `  url = {${result.url}}\n`;
      entry += `}`;
    }
    
    return entry;
  }).join('\n\n');

  const content = `% BibTeX Bibliography\n% Query: ${query}\n% Generated: ${new Date().toLocaleDateString()}\n\n${bibEntries}`;
  downloadFile(content, `pharmaai-bibliography-${query.replace(/\s+/g, '-')}-${Date.now()}.bib`, 'text/plain');
};

export const exportToRIS = (results: SearchResult[], query: string) => {
  const risEntries = results.map(result => {
    const year = result.date ? new Date(result.date).getFullYear() : '';
    const authors = (result.authors || 'Anonymous').split(',').map(a => a.trim());
    
    let entry = '';
    if (result.source === 'PubMed' || result.source === 'arXiv') {
      entry = 'TY  - JOUR\n';
    } else if (result.source === 'ClinicalTrials') {
      entry = 'TY  - DATA\n';
    } else if (result.source === 'Patents') {
      entry = 'TY  - PAT\n';
    }
    
    authors.forEach(author => {
      entry += `AU  - ${author}\n`;
    });
    entry += `TI  - ${result.title}\n`;
    if (year) entry += `PY  - ${year}\n`;
    if (result.abstract) entry += `AB  - ${result.abstract}\n`;
    entry += `UR  - ${result.url}\n`;
    if (result.phase) entry += `N1  - Phase: ${result.phase}\n`;
    entry += 'ER  - \n';
    
    return entry;
  }).join('\n');

  const content = `Provider: PharmaAI\nDatabase: Multi-source Research Database\nContent: text/plain; charset="utf-8"\n\n${risEntries}`;
  downloadFile(content, `pharmaai-bibliography-${query.replace(/\s+/g, '-')}-${Date.now()}.ris`, 'application/x-research-info-systems');
};

export const exportToEndNote = (results: SearchResult[], query: string) => {
  const endNoteEntries = results.map(result => {
    const year = result.date ? new Date(result.date).getFullYear() : '';
    const authors = (result.authors || 'Anonymous').split(',').map(a => a.trim());
    
    let entry = '';
    if (result.source === 'PubMed' || result.source === 'arXiv') {
      entry = '%0 Journal Article\n';
    } else if (result.source === 'ClinicalTrials') {
      entry = '%0 Online Database\n';
    } else if (result.source === 'Patents') {
      entry = '%0 Patent\n';
    }
    
    authors.forEach(author => {
      entry += `%A ${author}\n`;
    });
    entry += `%T ${result.title}\n`;
    if (year) entry += `%D ${year}\n`;
    if (result.abstract) entry += `%X ${result.abstract}\n`;
    entry += `%U ${result.url}\n`;
    if (result.phase) entry += `%Z Phase: ${result.phase}\n`;
    
    return entry;
  }).join('\n\n');

  const content = endNoteEntries;
  downloadFile(content, `pharmaai-bibliography-${query.replace(/\s+/g, '-')}-${Date.now()}.enw`, 'text/plain');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToCSV = (results: SearchResult[], query: string) => {
  const headers = ['Source', 'ID', 'Title', 'Authors', 'Date', 'Abstract/Status', 'URL'];
  const csvRows = [headers.join(',')];

  results.forEach(result => {
    const row = [
      result.source,
      result.id,
      `"${result.title.replace(/"/g, '""')}"`,
      `"${(result.authors || '').replace(/"/g, '""')}"`,
      result.date || '',
      `"${((result.abstract || result.status || '').replace(/"/g, '""'))}"`,
      result.url
    ];
    csvRows.push(row.join(','));
  });

  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, `pharmaai-results-${query.replace(/\s+/g, '-')}-${Date.now()}.csv`, 'text/csv');
};

export const exportToPDF = async (
  query: string,
  results: SearchResult[],
  synthesis: string
) => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>PharmaAI Research Report - ${query}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        h1 {
          color: #2563eb;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 10px;
        }
        h2 {
          color: #1e40af;
          margin-top: 30px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .meta {
          color: #6b7280;
          font-size: 0.9em;
          margin-bottom: 30px;
        }
        .synthesis {
          background: #f3f4f6;
          padding: 20px;
          border-left: 4px solid #2563eb;
          margin: 20px 0;
        }
        .result {
          margin-bottom: 25px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .result-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .result-meta {
          font-size: 0.85em;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .result-abstract {
          color: #4b5563;
          font-size: 0.95em;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: 500;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 0.85em;
        }
      </style>
    </head>
    <body>
      <h1>PharmaAI Research Report</h1>
      <div class="meta">
        <strong>Query:</strong> ${query}<br>
        <strong>Results:</strong> ${results.length} sources<br>
        <strong>Generated:</strong> ${new Date().toLocaleString()}
      </div>

      <h2>AI Synthesis</h2>
      <div class="synthesis">
        ${synthesis.split('\n\n').map(p => `<p>${p}</p>`).join('')}
      </div>

      <h2>Detailed Results</h2>
      ${results.map(result => `
        <div class="result">
          <span class="badge">${result.source}</span>
          <div class="result-title">${result.title}</div>
          <div class="result-meta">
            ${result.authors ? `<strong>Authors:</strong> ${result.authors}<br>` : ''}
            ${result.date ? `<strong>Date:</strong> ${result.date}<br>` : ''}
            ${result.phase ? `<strong>Phase:</strong> ${result.phase}<br>` : ''}
            ${result.status ? `<strong>Status:</strong> ${result.status}<br>` : ''}
            <strong>Link:</strong> <a href="${result.url}">${result.url}</a>
          </div>
          ${result.abstract ? `<div class="result-abstract">${result.abstract}</div>` : ''}
        </div>
      `).join('')}

      <div class="footer">
        Generated by PharmaAI - Biomedical Literature Synthesizer<br>
        Powered by Lovable Cloud
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `pharmaai-report-${query.replace(/\s+/g, '-')}-${Date.now()}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Note: For true PDF export, we'd need a library like jsPDF or server-side generation
  // This exports as HTML which can be printed to PDF by the browser
};
