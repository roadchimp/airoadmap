/**
 * PDF Branding System for Executive Reports
 * Provides a foundation for customizable themes, colors, and layouts
 */

export interface BrandingTheme {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
    border: string
  }
  typography: {
    fontFamily: string
    titleSize: string
    headingSize: string
    bodySize: string
    captionSize: string
  }
  layout: {
    pageMargin: string
    sectionSpacing: string
    cardPadding: string
    borderRadius: string
  }
  logo?: {
    url: string
    width: string
    height: string
    position: 'header' | 'footer' | 'both'
  }
}

// Default AiRoadmap theme
export const defaultTheme: BrandingTheme = {
  name: 'AiRoadmap Default',
  colors: {
    primary: '#e84c2b',
    secondary: '#f8a97a',
    accent: '#1a1a1a',
    text: '#1a1a1a',
    background: '#ffffff',
    border: '#e5e7eb',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    titleSize: '24pt',
    headingSize: '16pt',
    bodySize: '11pt',
    captionSize: '9pt',
  },
  layout: {
    pageMargin: '20mm',
    sectionSpacing: '24pt',
    cardPadding: '16pt',
    borderRadius: '6pt',
  },
}

// Conservative corporate theme
export const corporateTheme: BrandingTheme = {
  name: 'Corporate Professional',
  colors: {
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#0f172a',
    text: '#0f172a',
    background: '#ffffff',
    border: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Times New Roman", serif',
    titleSize: '22pt',
    headingSize: '14pt',
    bodySize: '10pt',
    captionSize: '8pt',
  },
  layout: {
    pageMargin: '25mm',
    sectionSpacing: '20pt',
    cardPadding: '14pt',
    borderRadius: '4pt',
  },
}

// Modern tech theme
export const techTheme: BrandingTheme = {
  name: 'Modern Technology',
  colors: {
    primary: '#7c3aed',
    secondary: '#a855f7',
    accent: '#111827',
    text: '#111827',
    background: '#ffffff',
    border: '#e5e7eb',
  },
  typography: {
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
    titleSize: '26pt',
    headingSize: '18pt',
    bodySize: '12pt',
    captionSize: '10pt',
  },
  layout: {
    pageMargin: '18mm',
    sectionSpacing: '28pt',
    cardPadding: '18pt',
    borderRadius: '8pt',
  },
}

export const availableThemes = {
  default: defaultTheme,
  corporate: corporateTheme,
  tech: techTheme,
}

/**
 * Generate CSS custom properties for a theme
 */
export const generateThemeCSS = (theme: BrandingTheme): string => {
  return `
    .executive-pdf-layout {
      --pdf-color-primary: ${theme.colors.primary};
      --pdf-color-secondary: ${theme.colors.secondary};
      --pdf-color-accent: ${theme.colors.accent};
      --pdf-color-text: ${theme.colors.text};
      --pdf-color-background: ${theme.colors.background};
      --pdf-color-border: ${theme.colors.border};
      
      --pdf-font-family: ${theme.typography.fontFamily};
      --pdf-font-title: ${theme.typography.titleSize};
      --pdf-font-heading: ${theme.typography.headingSize};
      --pdf-font-body: ${theme.typography.bodySize};
      --pdf-font-caption: ${theme.typography.captionSize};
      
      --pdf-margin-page: ${theme.layout.pageMargin};
      --pdf-spacing-section: ${theme.layout.sectionSpacing};
      --pdf-padding-card: ${theme.layout.cardPadding};
      --pdf-radius-border: ${theme.layout.borderRadius};
    }
  `
}

/**
 * Apply a theme to the PDF layout
 */
export const applyTheme = (themeName: keyof typeof availableThemes) => {
  const theme = availableThemes[themeName]
  const existingStyle = document.getElementById('pdf-theme-override')
  
  if (existingStyle) {
    existingStyle.remove()
  }
  
  const style = document.createElement('style')
  style.id = 'pdf-theme-override'
  style.textContent = generateThemeCSS(theme)
  document.head.appendChild(style)
  
  return theme
}

/**
 * Custom theme creation helper
 */
export const createCustomTheme = (
  name: string,
  overrides: Partial<BrandingTheme>
): BrandingTheme => {
  return {
    ...defaultTheme,
    ...overrides,
    name,
    colors: { ...defaultTheme.colors, ...overrides.colors },
    typography: { ...defaultTheme.typography, ...overrides.typography },
    layout: { ...defaultTheme.layout, ...overrides.layout },
  }
}

/**
 * Client-specific theme configurations
 */
export interface ClientBranding {
  clientName: string
  theme: BrandingTheme
  logo?: {
    lightMode: string
    darkMode?: string
    width: string
    height: string
  }
  headerFooter?: {
    showClientName: boolean
    showGeneratedDate: boolean
    customFooterText?: string
  }
}

/**
 * White-label configuration
 */
export const createWhiteLabelConfig = (
  clientName: string,
  primaryColor: string,
  logoUrl?: string
): ClientBranding => {
  return {
    clientName,
    theme: createCustomTheme(`${clientName} Theme`, {
      colors: {
        primary: primaryColor,
        secondary: adjustColorBrightness(primaryColor, 20),
        accent: '#1a1a1a',
        text: '#1a1a1a',
        background: '#ffffff',
        border: '#e5e7eb',
      },
    }),
    logo: logoUrl ? {
      lightMode: logoUrl,
      width: '120pt',
      height: '40pt',
    } : undefined,
    headerFooter: {
      showClientName: true,
      showGeneratedDate: true,
      customFooterText: `Confidential ${clientName} Assessment`,
    },
  }
}

/**
 * Utility function to adjust color brightness
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
} 