/**
 * Adds custom CSS to print styles
 */
export function addPrintStyles() {
  // Add print-specific CSS to the report for better export formatting
  const style = document.createElement('style')
  style.textContent = `
    @media print {
      /* Hide navigation and UI elements not needed for printing */
      nav,
      button,
      .no-print,
      [role="tablist"] {
        display: none !important;
      }
    
      /* Show all tab content when printing */
      [role="tabpanel"] {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        height: auto !important;
        margin-bottom: 2rem;
      }
    
      /* Ensure backgrounds and text colors print well */
      body,
      div,
      main {
        background-color: white !important;
        color: black !important;
      }
    
      /* Ensure text is readable when printed */
      p,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      span,
      td,
      th {
        color: black !important;
      }
    
      /* Add page breaks where appropriate */
      .card,
      section {
        page-break-inside: avoid;
      }
    
      /* Adjust layout for printing */
      .container {
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
    
      /* Ensure the matrix prints well */
      svg text {
        fill: black !important;
      }
    
      svg rect {
        stroke: #333 !important;
      }
    }
  `
  document.head.appendChild(style)
} 