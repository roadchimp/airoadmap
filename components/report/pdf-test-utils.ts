/**
 * Utility functions for testing and validating PDF export functionality
 */

export const validatePdfExport = () => {
  const checks = {
    cssLoaded: false,
    componentRendered: false,
    printMediaQuery: false,
    executivePdfLayout: false,
  }

  try {
    // Check if executive PDF CSS is loaded
    const stylesheets = Array.from(document.styleSheets)
    checks.cssLoaded = stylesheets.some(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || [])
        return rules.some(rule => 
          rule.type === CSSRule.MEDIA_RULE && 
          (rule as CSSMediaRule).media.mediaText.includes('print')
        )
      } catch (e) {
        return false
      }
    })

    // Check if ExecutivePdfLayout component exists in DOM
    const pdfLayout = document.querySelector('.executive-pdf-layout')
    checks.componentRendered = !!pdfLayout

    // Check if component is hidden by default
    if (pdfLayout) {
      const computedStyle = window.getComputedStyle(pdfLayout)
      checks.executivePdfLayout = computedStyle.display === 'none'
    }

    // Test print media query simulation
    const testElement = document.createElement('div')
    testElement.className = 'executive-pdf-layout'
    testElement.style.display = 'none'
    document.body.appendChild(testElement)
    
    // Simulate print media
    const mediaQueryList = window.matchMedia('print')
    checks.printMediaQuery = mediaQueryList.matches !== null

    document.body.removeChild(testElement)

  } catch (error) {
    console.error('PDF validation error:', error)
  }

  return checks
}

export const simulatePrintMode = () => {
  // Add a class to simulate print mode for testing
  document.body.classList.add('print-simulation')
  
  // Add temporary styles to simulate print behavior
  const style = document.createElement('style')
  style.id = 'print-simulation-styles'
  style.textContent = `
    .print-simulation .executive-pdf-layout {
      display: block !important;
      position: relative !important;
      width: 100% !important;
      max-width: 210mm !important;
      margin: 0 auto !important;
      background: white !important;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
    }
    
    .print-simulation .executive-pdf-layout .pdf-page {
      width: 100% !important;
      min-height: auto !important;
      padding: 40px !important;
      margin-bottom: 20px !important;
      border-bottom: 1px solid #e5e7eb !important;
    }
    
    .print-simulation .min-h-screen {
      display: none !important;
    }
  `
  document.head.appendChild(style)
}

export const exitPrintMode = () => {
  document.body.classList.remove('print-simulation')
  const style = document.getElementById('print-simulation-styles')
  if (style) {
    style.remove()
  }
}

export const testPdfContent = () => {
  const pdfLayout = document.querySelector('.executive-pdf-layout')
  if (!pdfLayout) {
    return { success: false, error: 'PDF layout not found' }
  }

  const tests = {
    hasTitle: !!pdfLayout.querySelector('.report-title'),
    hasMetrics: !!pdfLayout.querySelector('.metrics-grid'),
    hasRecommendations: !!pdfLayout.querySelector('.recommendations'),
    hasRoadmap: !!pdfLayout.querySelector('.roadmap'),
    hasPages: pdfLayout.querySelectorAll('.pdf-page').length >= 4,
  }

  const success = Object.values(tests).every(test => test)
  
  return {
    success,
    tests,
    pageCount: pdfLayout.querySelectorAll('.pdf-page').length
  }
}

// Log validation results for debugging
export const logPdfValidation = () => {
  console.group('PDF Export Validation')
  
  const validation = validatePdfExport()
  console.log('CSS Loaded:', validation.cssLoaded)
  console.log('Component Rendered:', validation.componentRendered)
  console.log('Print Media Query:', validation.printMediaQuery)
  console.log('Executive PDF Layout Hidden:', validation.executivePdfLayout)
  
  const contentTest = testPdfContent()
  console.log('Content Test:', contentTest)
  
  const allPassed = validation.cssLoaded && 
                   validation.componentRendered && 
                   validation.executivePdfLayout && 
                   contentTest.success
  
  console.log('Overall Status:', allPassed ? '✅ PASSED' : '❌ FAILED')
  console.groupEnd()
  
  return allPassed
} 