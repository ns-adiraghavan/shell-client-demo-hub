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
  downloadFile(content, `innovationengine-bibliography-${query.replace(/\s+/g, '-')}-${Date.now()}.bib`, 'text/plain');
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

  const content = `Provider: Innovation Insights Engine\nDatabase: Multi-source Research Database\nContent: text/plain; charset="utf-8"\n\n${risEntries}`;
  downloadFile(content, `innovationengine-bibliography-${query.replace(/\s+/g, '-')}-${Date.now()}.ris`, 'application/x-research-info-systems');
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
  downloadFile(content, `innovationengine-bibliography-${query.replace(/\s+/g, '-')}-${Date.now()}.enw`, 'text/plain');
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
  downloadFile(csvContent, `innovationengine-results-${query.replace(/\s+/g, '-')}-${Date.now()}.csv`, 'text/csv');
};

// Convert markdown to formatted HTML for export
const markdownToHtml = (markdown: string): string => {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert bullet lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Convert numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Convert line breaks to paragraphs
  html = html.split('\n\n').map(para => {
    if (para.trim() && !para.startsWith('<h') && !para.startsWith('<ul') && !para.startsWith('<li')) {
      return `<p>${para.replace(/\n/g, ' ')}</p>`;
    }
    return para;
  }).join('\n');
  
  return html;
};

export const exportExecutiveBrief = async (
  query: string,
  results: SearchResult[],
  synthesis: string
) => {
  // Calculate metrics for Executive Snapshot
  const newsCount = results.filter(r => r.source === 'News' || r.source === 'BusinessNews' || r.source === 'IndustryNews').length;
  const patentCount = results.filter(r => r.source === 'Patents').length;
  const projectCount = results.filter(r => r.source === 'ClinicalTrials').length;
  
  const momentum = results.length > 15 ? "High" : results.length > 5 ? "Moderate" : "Low";
  const competitive = newsCount > 5 ? "Intense" : newsCount > 2 ? "Active" : "Limited";
  const commercial = projectCount > 3 ? "Advanced" : projectCount > 0 ? "Developing" : "Early Stage";
  const innovation = patentCount > 3 ? "Strong" : patentCount > 0 ? "Active" : "Emerging";
  
  // Extract Executive Signal
  const lines = synthesis.split('\n').filter(line => line.trim());
  const keyInsight = lines.find(line => 
    line.includes('significant') || 
    line.includes('opportunity') || 
    line.includes('growth') ||
    line.includes('emerging') ||
    line.includes('leading')
  ) || lines[1] || "Multiple market signals detected across intelligence sources.";
  const cleanInsight = keyInsight.replace(/^[#*\-\s]+/, '').replace(/\*\*/g, '').slice(0, 180);
  
  // Convert synthesis markdown to HTML
  const synthesisHtml = markdownToHtml(synthesis);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Executive Intelligence Brief - ${query}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      max-width: 900px;
      margin: 0 auto;
      padding: 48px 32px;
      background: #fafafa;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 3px solid #ea580c;
    }
    h1 {
      color: #1a1a2e;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
    .meta {
      color: #9ca3af;
      font-size: 12px;
      margin-top: 16px;
    }
    
    /* Executive Snapshot */
    .snapshot {
      background: #f3f4f6;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .snapshot-title {
      color: #ea580c;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .metric {
      background: white;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e5e7eb;
    }
    .metric-label {
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .metric-value.highlight {
      color: #ea580c;
    }
    
    /* Executive Signal */
    .signal {
      background: #fef3e2;
      border-left: 4px solid #ea580c;
      border-radius: 0 8px 8px 0;
      padding: 20px 24px;
      margin-bottom: 32px;
    }
    .signal-title {
      color: #ea580c;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .signal-text {
      color: #1a1a2e;
      font-size: 15px;
      font-weight: 500;
      margin: 0;
    }
    
    /* Synthesis Content */
    .synthesis {
      background: white;
      border-radius: 12px;
      padding: 32px;
      border: 1px solid #e5e7eb;
    }
    .synthesis h2 {
      color: #ea580c;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 24px 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .synthesis h2:first-child {
      margin-top: 0;
    }
    .synthesis h3 {
      color: #1a1a2e;
      font-size: 14px;
      font-weight: 600;
      margin: 16px 0 8px 0;
    }
    .synthesis p {
      color: #374151;
      font-size: 14px;
      margin: 0 0 12px 0;
    }
    .synthesis ul {
      margin: 0 0 16px 0;
      padding-left: 20px;
    }
    .synthesis li {
      color: #374151;
      font-size: 14px;
      margin-bottom: 6px;
    }
    .synthesis strong {
      color: #ea580c;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 11px;
    }
    
    @media print {
      body {
        background: white;
        padding: 24px;
      }
      .snapshot, .synthesis {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Executive Intelligence Brief</h1>
    <p class="subtitle">CXO-level synthesis of market signals, competition, and commercialization</p>
    <p class="meta">Query: ${query} • ${results.length} sources analyzed • ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="snapshot">
    <div class="snapshot-title">Executive Snapshot</div>
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Market Momentum</div>
        <div class="metric-value ${momentum === 'High' ? 'highlight' : ''}">${momentum}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Competitive Intensity</div>
        <div class="metric-value ${competitive === 'Intense' ? 'highlight' : ''}">${competitive}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Commercial Readiness</div>
        <div class="metric-value ${commercial === 'Advanced' ? 'highlight' : ''}">${commercial}</div>
      </div>
      <div class="metric">
        <div class="metric-label">IP & Innovation</div>
        <div class="metric-value ${innovation === 'Strong' ? 'highlight' : ''}">${innovation}</div>
      </div>
    </div>
  </div>

  <div class="signal">
    <div class="signal-title">Executive Signal</div>
    <p class="signal-text">${cleanInsight}</p>
  </div>

  <div class="synthesis">
    ${synthesisHtml}
  </div>

  <div class="footer">
    Generated by Innovation Insights Engine • Executive Intelligence Brief
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `executive-brief-${query.replace(/\s+/g, '-')}-${Date.now()}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Keep legacy function for backward compatibility
export const exportToPDF = exportExecutiveBrief;
