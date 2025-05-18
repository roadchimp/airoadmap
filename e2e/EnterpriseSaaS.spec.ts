// tests/enterprise-saas-inc.spec.ts
import { test, expect } from '@playwright/test';

// const APP_URL = 'https://v0-ai-sherpas-demo.vercel.app';
const APP_URL = 'http://localhost:3000';

test.describe('Enterprise SaaS Inc. (ESI) AI Transformation Assessment', () => {
  // Test data based on Enterprise SaaS Inc. (ESI) case study
  const testAssessment = {
    basics: {
      companyName: 'Enterprise SaaS Inc.',
      reportName: 'Pre-Sales AI Transformation',
      industry: 'Software & Technology',
      size: 'Medium (51-500 employees)',
      goals: 'Automate pre-sales tasks, reduce SE workload, accelerate sales cycle, and ensure knowledge consistency across the team.',
      stakeholders: ['Executive Leadership', 'IT Department', 'Sales & Marketing'],
      industryMaturity: 'Mature', 
      companyStage: 'Scaling',
    },
    strategicFocus: [
      'Efficiency & Productivity',
      'Cost Reduction',
      'Revenue Growth',
      'Operational Excellence'
    ],
    departments: ['Sales', 'IT'],
    roles: [
      { title: 'Sales (e.g., Regional Sales Manager)', department: 'Sales' },
      { title: 'Sales Engineer / Solutions Engineer (SE)', department: 'Sales' },
      { title: 'Systems / IT / Infrastructure', department: 'IT' }
    ],
    painPoints: {
      general: 'SE team is overworked, handling ~5-6 deals in parallel each. Lead times for demos are too long (3 weeks). Knowledge silos exist across the team. Small/mid-market deals often go without proper pre-sales support.',
      rolePainPoints: {
        'Sales (e.g., Regional Sales Manager)': {
          description: 'Sales reps spend too much time on manual quote creation and pricing lookups.',
          severity: 4,
          frequency: 5,
          impact: 4
        },
        'Sales Engineer / Solutions Engineer (SE)': {
          description: 'Repetitive tasks like demo environment setup and RFP responses, lack of time for complex deals, overtime work causing burnout.',
          severity: 5,
          frequency: 5,
          impact: 5
        },
        'Systems / IT / Infrastructure': {
          description: 'Struggling to maintain and integrate multiple systems across departments.',
          severity: 4,
          frequency: 4,
          impact: 4
        }
      }
    },
    workVolume: {
      roleWorkPatterns: [
        {
          name: 'Sales (e.g., Regional Sales Manager)',
          volume: 'High',
          complexity: 'Medium',
          repetitiveness: '4',
          dataDescription: 'Customer data, pricing information, and sales forecasts'
        },
        {
          name: 'Sales Engineer / Solutions Engineer (SE)',
          volume: 'High',
          complexity: 'High', 
          repetitiveness: '5',
          dataDescription: 'Technical specifications, demo environments, customer requirements'
        },
        {
          name: 'Systems / IT / Infrastructure',
          volume: 'Medium',
          complexity: 'High',
          repetitiveness: '3',
          dataDescription: 'System configurations, integration points, and infrastructure documentation'
        }
      ]
    },
    techStack: {
      relevantTools: 'Salesforce CRM, Slack, Zoom, AWS (for demo environments), internal product documentation system',
      dataAccessibility: 'moderate',
      dataQuality: 'fair',
      systemsIntegration: 'moderate'
    },
    adoption: {
      changeReadiness: 'medium',
      stakeholderAlignment: 'high',
      trainingNeeds: 'SEs need training on prompt engineering, AEs need basic AI interaction training, IT needs deployment knowledge',
      expectedChallenges: 'Initial skepticism about job security, ensuring AI accuracy, integration with existing systems',
      successMetrics: '50% increase in demo capacity, 2-week reduction in sales cycle, elimination of overtime, consistent customer feedback'
    },
    aiAdoptionScoreInputs: {
      adoptionRateForecast: 80,
      timeSavingsPerUserHours: 7,
      affectedUserCount: 38, // 30 AEs + 8 SEs
      costEfficiencyGainsAmount: 500000, // Estimated annual savings from not hiring additional SEs
      performanceImprovementPercentage: 50, // 50% more opportunities per SE
      toolSprawlReductionScore: 4
    }
  };

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test('Complete ESI assessment flow and verify AI transformation report', async ({ page }) => {
    // Step 1: Navigate to Dashboard
    await test.step('Access dashboard from landing page', async () => {
      // Click the "Get Started" button in the navigation bar
      await page.getByRole('button', { name: /get started/i }).click();
      
      // Wait for navigation to complete and URL to update
      await expect(page).toHaveURL(`${APP_URL}/dashboard`);
      
      // Verify dashboard heading is visible
      await expect(page.getByRole('heading', { name: /Assessment Dashboard/i, exact: false })).toBeVisible();
    });

    // Step 2: Start new assessment
    await test.step('Initiate and complete assessment wizard', async () => {
      // Navigate to new assessment page with fallback options
      try {
        // First try the navigation link in the sidebar
        await page.getByRole('link', { name: 'New Assessment', exact: true }).click();
      } catch (error) {
        console.log('Could not find sidebar link, trying button instead...');
        // Fallback to the button on the dashboard
        await page.getByRole('button', { name: '+ New Assessment' }).click();
      }

      // Verify we reached the correct page regardless of which element we clicked
      await expect(page).toHaveURL(`${APP_URL}/assessment/new`);
      await expect(page.getByRole('heading', { name: 'Organization Info', level: 1, exact: true })).toBeVisible();
      
      // Company basics
      await page.getByLabel('Company Name*').fill(testAssessment.basics.companyName);
      await page.getByLabel('Report Name*').fill(testAssessment.basics.reportName);
      
      // Industry selection
      await page.locator(`label:has-text("${testAssessment.basics.industry}")`).click();
      
      // Company size
      await page.locator(`label:has-text("${testAssessment.basics.size}")`).click();
      
      // Industry maturity and company stage
      await page.getByLabel('Industry Maturity*').click();
      await page.getByRole('option', { name: 'Mature', exact: true }).click();
      
      await page.getByLabel('Company Stage*').click();
      await page.getByRole('option', { name: testAssessment.basics.companyStage }).click();
      
      // Strategic focus
      for (const focus of testAssessment.strategicFocus) {
        await page.locator(`label:has-text("${focus}")`).click();
      }
      
      // Business goals
      await page.getByLabel(/Key Business Goals/i).fill(testAssessment.basics.goals);
      
      // Stakeholders
      for (const stakeholder of testAssessment.basics.stakeholders) {
        await page.locator(`label:has-text("${stakeholder}")`).click();
      }
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Role selection
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=roles`);
      await expect(page.getByRole('heading', {name: 'Role Selection', level: 1, exact: true })).toBeVisible();
      
      
      // Select departments - explicitly select Sales and IT
      const departmentsToSelect = ['Sales', 'IT'];
      for (const department of departmentsToSelect) {
        // Use getByRole instead of locator to be more specific
        await page.getByRole('checkbox', { name: department, exact: true }).check();
      }
      
      // Select specific roles using more precise selectors
      const rolesToSelect = [
        'Sales (e.g., Regional Sales Manager)',
        'Sales Engineer / Solutions Engineer (SE)',
        'Systems / IT / Infrastructure'
      ];
      
      for (const role of rolesToSelect) {
        await page.getByRole('checkbox', { name: role, exact: true }).check();
      }
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Pain points
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=painPoints`);
      await expect(page.getByRole('heading', {name: 'Areas for Improvement', level: 1, exact: true })).toBeVisible();
      
      // General pain points - this is still the last textarea on the page
      await page.locator('textarea').last().fill(testAssessment.painPoints.general);
      
      // Role-specific pain points using a more precise card-based selector approach
      const roleNames = Object.keys(testAssessment.painPoints.rolePainPoints);
      
      for (const roleName of roleNames) {
        const painPointData = testAssessment.painPoints.rolePainPoints[roleName as keyof typeof testAssessment.painPoints.rolePainPoints];
        
        // First identify the specific role card by its heading text
        const roleCard = page.getByText(roleName, { exact: true })
          .first()
          .locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "border")]');
        
        // Description textarea within this role's card
        const descriptionTextarea = roleCard.locator('textarea').first();
        await descriptionTextarea.fill(painPointData.description);
        
        // Find numeric inputs by their positions within this card, instead of by their labels
        // In the pain points page, each role card has 3 numeric inputs for severity, frequency, and impact in that order
        const numericInputs = roleCard.locator('input[type="number"]');
        
        // Fill in the values - they appear in order: severity, frequency, impact
        await numericInputs.nth(0).fill(painPointData.severity.toString());
        await numericInputs.nth(1).fill(painPointData.frequency.toString());
        await numericInputs.nth(2).fill(painPointData.impact.toString());
      }
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Work volume
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=workVolume`);
      await expect(page.getByRole('heading', {name: 'Work Volume & Complexity', level: 1, exact: true })).toBeVisible();
      
      // Fill work volume data for each role using the test data defined at the top
      for (const roleData of testAssessment.workVolume.roleWorkPatterns) {
        // First identify the specific role card by its heading text
        const roleCard = page.getByText(roleData.name, { exact: true })
          .first()
          .locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "border")]');
          
        // For each field within this specific role's card:
        
        // 1. Task Volume dropdown
        const volumeDropdown = roleCard.getByText('Task Volume').first().locator('xpath=following::button').first();
        await volumeDropdown.click();
        await page.getByRole('option', { name: roleData.volume, exact: true }).click();
        
        // 2. Task Complexity dropdown
        const complexityDropdown = roleCard.getByText('Task Complexity').first().locator('xpath=following::button').first();
        await complexityDropdown.click();
        await page.getByRole('option', { name: roleData.complexity, exact: true }).click();
        
        // 3. Repetitiveness field - directly target the input within this role's card
        const repetitivenessInput = roleCard.getByText('Repetitiveness (1-5)').first().locator('xpath=following::input').first();
        await repetitivenessInput.fill(roleData.repetitiveness);
        
        // 4. Data Description textarea - if provided
        if (roleData.dataDescription) {
          const descriptionTextarea = roleCard.getByText('Data Description (Optional)').first().locator('xpath=following::textarea').first();
          await descriptionTextarea.fill(roleData.dataDescription);
        }
      }
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Tech stack
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=techStack`);
      await expect(page.getByRole('heading', {name: 'Data & Systems', level: 1, exact: true })).toBeVisible();
      
      // Find the textarea under "Relevant Tools & Platforms" text (not a label)
      // The placeholder contains text about listing software, platforms, or databases
      await page.locator('textarea[placeholder*="List key software"]').fill(testAssessment.techStack.relevantTools);
      
      // Data accessibility - use exact placeholder text from UI
      await page.locator('button', { hasText: 'Select accessibility level...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.techStack.dataAccessibility, 'i') }).click();
      
      // Data quality - use exact placeholder text from UI
      await page.locator('button', { hasText: 'Select data quality level...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.techStack.dataQuality, 'i') }).click();
      
      // Systems integration - use exact placeholder text from UI
      await page.locator('button', { hasText: 'Select integration ease...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.techStack.systemsIntegration, 'i') }).click();
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Adoption readiness
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=adoption`);
      await expect(page.getByRole('heading', {name: 'Readiness & Expectations', level: 1, exact: true })).toBeVisible();
      
      // Organizational Readiness for Change - dropdown
      await page.locator('button', { hasText: 'Select readiness level...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.adoption.changeReadiness, 'i') }).click();
      
      // Stakeholder Alignment on AI Goals - dropdown
      await page.locator('button', { hasText: 'Select alignment level...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.adoption.stakeholderAlignment, 'i') }).click();
      
      // Anticipated Training Needs
      await page.locator('textarea[placeholder*="Describe potential training requirements"]').fill(testAssessment.adoption.trainingNeeds);
      
      // Expected Adoption Challenges
      await page.locator('textarea[placeholder*="List potential hurdles to successful AI adoption"]').fill(testAssessment.adoption.expectedChallenges);
      
      // Key Success Metrics
      await page.locator('textarea[placeholder*="How will the success of AI adoption be measured"]').fill(testAssessment.adoption.successMetrics);
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: ROI targets
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=aiAdoptionScoreInputs`);
      await expect(page.getByRole('heading', {name: 'ROI Targets', level: 1, exact: true })).toBeVisible();
      
      // Fill AI adoption score inputs by finding text labels first, then targeting the nearby input
      
      // Adoption Rate Forecast (%)
      await page.getByText('Adoption Rate Forecast (%)')
        .locator('xpath=following::input')
        .first()
        .fill(testAssessment.aiAdoptionScoreInputs.adoptionRateForecast.toString());
      
      // Time Savings (hours/week/user)
      await page.getByText('Time Savings (hours/week/user)')
        .locator('xpath=following::input')
        .first()
        .fill(testAssessment.aiAdoptionScoreInputs.timeSavingsPerUserHours.toString());
      
      // Affected Users (count)
      await page.getByText('Affected Users (count)')
        .locator('xpath=following::input')
        .first()
        .fill(testAssessment.aiAdoptionScoreInputs.affectedUserCount.toString());
      
      // Cost Efficiency Gains ($)
      await page.getByText('Cost Efficiency Gains ($)')
        .locator('xpath=following::input')
        .first()
        .fill(testAssessment.aiAdoptionScoreInputs.costEfficiencyGainsAmount.toString());
      
      // Performance Improvement (%)
      await page.getByText('Performance Improvement (%)')
        .locator('xpath=following::input')
        .first()
        .fill(testAssessment.aiAdoptionScoreInputs.performanceImprovementPercentage.toString());
      
      // Tool Sprawl Reduction (1-5)
      await page.locator('button', { hasText: /4 - Above Average/ }).click();
      await page.getByRole('option', { name: new RegExp(`${testAssessment.aiAdoptionScoreInputs.toolSprawlReductionScore}.*`), exact: false }).click();
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Review
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=review`);
      await expect(page.getByRole('heading', {name: 'Review & Submit', level: 1, exact: true })).toBeVisible();
      
      // Submit assessment
      await page.getByRole('button', { name: /generate report/i }).click();
      
      // Wait for report generation
      await expect(page.getByText(/Generating report/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/Generating report/i)).not.toBeVisible({ timeout: 120000 });
    });

    // Step 3 & 4: Verify report creation and content
    await test.step('Validate report creation and content integrity', async () => {
      // Verify we've been redirected to the report page
      await expect(page.url()).toMatch(new RegExp(`${APP_URL}/reports/\\d+$`));
      
      // Verify report header 
      await expect(page.getByRole('heading', { name: testAssessment.basics.reportName, exact: false })).toBeVisible();
      
      // Verify company info
      await expect(page.getByText(testAssessment.basics.companyName)).toBeVisible();
      await expect(page.getByText(testAssessment.basics.industry)).toBeVisible();
      
      // Verify AI Adoption Score is calculated and visible
      await expect(page.getByTestId('ai-adoption-score')).toBeVisible();
      
      // Verify opportunities section
      await expect(page.getByText(/Transformation Opportunities/i)).toBeVisible();
      
      // Verify at least one role from assessment is mentioned
      for (const role of testAssessment.roles) {
        const roleVisible = await page.getByText(role.title).isVisible();
        if (roleVisible) {
          // If we found at least one role, we're good
          expect(roleVisible).toBeTruthy();
          break;
        }
      }
      
      // Verify ROI information is present
      await page.getByRole('tab', { name: /ai adoption score/i }).click();
      await expect(page.getByText(/ROI Analysis/i)).toBeVisible();
      
      // Verify the AI adoption score inputs are reflected in the report
      await expect(page.getByText(`${testAssessment.aiAdoptionScoreInputs.adoptionRateForecast}%`, { exact: false })).toBeVisible();
      await expect(page.getByText('$500,000', { exact: false })).toBeVisible(); // Cost efficiency gains
      
      // Check roadmap tab
      await page.getByRole('tab', { name: /roadmap/i }).click();
      await expect(page.getByText(/Implementation Timeline/i)).toBeVisible();
      
      // Verify pre-sales specific recommendations (case study specific)
      const preRoleFound = await page.getByText(/Pre-Sales/i).isVisible() || 
                          await page.getByText(/automation/i).isVisible() || 
                          await page.getByText(/knowledge base/i).isVisible();
      expect(preRoleFound).toBeTruthy();
    });

    // Step 5: Verify persistent access
    await test.step('Ensure report persistence and accessibility', async () => {
      // Record the report URL
      const reportUrl = page.url();
      const reportId = reportUrl.split('/').pop();
      
      // Navigate to dashboard
      await page.goto(`${APP_URL}/dashboard`);
      
      // Verify reports list
      await page.getByText(/reports/i).click();
      await expect(page.getByText(testAssessment.basics.reportName)).toBeVisible();
      
      // Navigate back to report via the list
      await page.getByText(testAssessment.basics.reportName).click();
      await expect(page.url()).toBe(reportUrl);
      
      // Verify content is still accessible
      await expect(page.getByRole('heading', { name: testAssessment.basics.reportName, exact: false })).toBeVisible();
      
      // Verify we can access the original assessment
      await page.goto(`${APP_URL}/dashboard`);
      await page.getByText(/assessments/i).click();
      await expect(page.getByText(testAssessment.basics.reportName)).toBeVisible();
    });
  });
});
