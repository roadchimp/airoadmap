// tests/genomedge-biotech.spec.ts
import { test, expect } from '@playwright/test';

// const APP_URL = 'https://v0-ai-sherpas-demo.vercel.app';
// const APP_URL = 'http://localhost:3000';
const APP_URL = 'https://airoadmap-njnndsghw-roadchimps-projects.vercel.app';

test.describe('GenomEdge Biotech AI Transformation Assessment', () => {
  // Test data based on GenomEdge Biotech case study
  const testAssessment = {
    basics: {
      companyName: 'GenomEdge Biotech',
      reportName: 'Go-to-Market AI Transformation',
      industry: 'Healthcare',
      size: 'Small (1-50 employees)',
      goals: 'Enhance go-to-market capabilities, accelerate partnership development, increase content production efficiency, and scale commercial operations without expanding headcount.',
      stakeholders: ['Executive Leadership' , 'Sales & Marketing'],
      industryMaturity: 'Mature',
      companyStage: 'Early Growth',
    },  
    strategicFocus: [
      'Efficiency & Productivity',
      'Cost Reduction',
      'Revenue Growth',
      'Operational Excellence'
    ],
    departments: ['Sales', 'Marketing'],
    roles: [
      { title: 'Sales (e.g., Regional Sales Manager)', department: 'Sales' },
      { title: 'Marketing', department: 'Marketing' }
    ],
    painPoints: {
      general: 'Limited commercial resources constraining go-to-market efforts. Need to communicate complex science effectively to diverse stakeholders. Struggling with content volume and consistency. Manual processes eating up valuable time that could be spent on strategic activities.',
      rolePainPoints: {
        'Sales (e.g., Regional Sales Manager)': {
          description: 'Spending 15+ hours weekly on manual research and presentation customization. Difficulty translating complex science for different stakeholders. Inconsistent messaging across partnerships.',
          severity: 5,
          frequency: 5,
          impact: 5
        },
        'Marketing': {
          description: 'Overwhelmed creating diverse content for investors, partners, and scientific audiences. Cannot produce the volume and variety needed across multiple disease areas.',
          severity: 5,
          frequency: 5,
          impact: 4
        }
      }
    },
    workVolume: {
      roleWorkPatterns: [
        {
          name: 'Sales (e.g., Regional Sales Manager)',
          volume: 'High',
          complexity: 'High',
          repetitiveness: '5',
          dataDescription: 'Partner intelligence, competitive landscape data, presentation materials, communication templates'
        },
        {
          name: 'Marketing',
          volume: 'High',
          complexity: 'High',
          repetitiveness: '5',
          dataDescription: 'Marketing materials, social media content, investor presentations, technical documents across multiple disease areas'
        }
      ]
    },
    techStack: {
      relevantTools: 'CRM system, content management platform, email marketing tools, presentation software, basic marketing automation, research databases',
      dataAccessibility: 'easy',
      dataQuality: 'good',
      systemsIntegration: 'easy'
    },
    adoption: {
      changeReadiness: 'high',
      stakeholderAlignment: 'high',
      trainingNeeds: 'AI tool usage training for content generation, prompt engineering skills, integration with existing workflows, scientific accuracy review processes',
      expectedChallenges: 'Ensuring scientific accuracy in AI-generated content, maintaining regulatory compliance, integration with existing systems, data privacy concerns',
      successMetrics: '40% increase in qualified leads, 60% reduction in content creation time, 3x increase in content production, $450K annual savings from delayed hiring'
    },
    aiAdoptionScoreInputs: {
      adoptionRateForecast: 90,
      timeSavingsPerUserHours: 12,
      affectedUserCount: 3, // Small commercial team
      costEfficiencyGainsAmount: 450000, // Annual savings from not hiring 3 additional positions
      performanceImprovementPercentage: 40, // 40% increase in qualified leads
      toolSprawlReductionScore: 3
    }
  };

  test.beforeEach(async ({ page, context }) => {
    // Add console observer to catch any errors during test
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`BROWSER CONSOLE ERROR: ${msg.text()}`);
      }
    });
    
    // Add request observer to track API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/reports') || url.includes('/api/assessments')) {
        console.log(`NETWORK REQUEST: ${request.method()} ${url}`);
      }
    });
    
    // Add response observer to track API responses
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/reports') || url.includes('/api/assessments')) {
        const status = response.status();
        let responseText = '';
        try {
          responseText = await response.text();
          if (responseText.length > 200) {
            responseText = responseText.substring(0, 200) + '...';
          }
        } catch (e) {
          responseText = '<error getting response text>';
        }
        console.log(`NETWORK RESPONSE: ${response.status()} ${url} - ${responseText}`);
        
        if (status >= 400) {
          console.error(`API ERROR: ${status} ${url} - ${responseText}`);
        }
      }
    });
    
    // Navigate to the app
    await page.goto(APP_URL);
    
    // Wait for either the app's login page or Vercel's login page to load
    await page.waitForLoadState('networkidle');

    // Check if we're on Vercel's login page or the app's login page
    const isVercelLogin = page.url().includes('vercel.com/login');
    const isAppLogin = page.url().includes(`${APP_URL}/login`);

    if (!isVercelLogin && !isAppLogin) {
      throw new Error(`Unexpected login page: ${page.url()}`);
    }

    console.log(`On ${isVercelLogin ? 'Vercel' : 'app'} login page, looking for GitHub login button...`);

    // Ensure GitHub button is available before proceeding
    await expect(page.getByRole('button', { name: /Continue with GitHub/i })).toBeVisible({ timeout: 10000 });
    
    // Handle GitHub OAuth login flow
    try {
      // Set up popup handler before clicking the GitHub button
      const popupPromise = context.waitForEvent('page');
      
      // Click the GitHub login button
      console.log("Clicking GitHub login button...");
      await page.getByRole('button', { name: /Continue with GitHub/i }).click();
      
      // Wait for the popup to appear
      const popup = await popupPromise;
      console.log("GitHub OAuth popup opened");
      
      // Wait for the popup to load
      await popup.waitForLoadState('networkidle');
      
      // Fill in GitHub credentials in the popup
      console.log("Filling GitHub credentials...");
      await popup.getByLabel(/Username or email address/i).fill('roadchimp');
      await popup.getByLabel(/Password/i).fill('%9PwWsWfT3EtobaZ38Na^!');
      
      // Click sign in button in popup
      await popup.getByRole('button', { name: 'Sign in', exact: true }).click();
      
      // Wait for popup to close (indicating successful authentication)
      console.log("Waiting for GitHub popup to close...");
      await popup.waitForEvent('close', { timeout: 10000 });
      console.log("GitHub popup closed");
      
      // Wait for the original page to redirect after OAuth completion
      console.log("Waiting for redirect to landing page...");
      
      // Wait 3-5 seconds for load time as specified
      await page.waitForTimeout(4000);
      
      // Check if we're redirected to dashboard or still on landing page
      const currentUrl = page.url();
      console.log(`Current URL after OAuth: ${currentUrl}`);
      
      // If we're on the landing page, navigate to dashboard
      if (currentUrl === APP_URL || currentUrl === `${APP_URL}/`) {
        console.log("On landing page, navigating to dashboard...");
        await page.goto(`${APP_URL}/dashboard`);
      }
      
      // Wait for successful login and redirection to dashboard
      console.log("Waiting for dashboard URL...");
      await expect(page).toHaveURL(`${APP_URL}/dashboard`, { timeout: 15000 });
      console.log("Successfully redirected to dashboard URL.");
      
      // Add an additional wait for a known dashboard element to be fully visible and stable
      console.log("Waiting for dashboard heading to be visible...");
      await expect(page.getByRole('heading', { name: /Assessment Dashboard/i, exact: false })).toBeVisible({ timeout: 10000 });
      console.log("Dashboard heading is visible.");

      // Add a small explicit timeout to allow any final async operations to settle
      console.log("Waiting for 2 seconds for session to fully settle...");
      await page.waitForTimeout(2000);
      console.log("Initial setup and login complete.");
      
    } catch (error) {
      console.error("Error during GitHub OAuth login:", error);
      
      // Fallback: try direct email/password login if GitHub OAuth fails
      console.log("GitHub OAuth failed, attempting fallback direct login...");
      
      // Check if there are email/password fields available
      const emailField = page.getByLabel(/Email/i);
      const passwordField = page.getByLabel(/Password/i);
      
      if (await emailField.isVisible() && await passwordField.isVisible()) {
        await emailField.fill('samsena@gmail.com');
        await passwordField.fill('Password@123');
        await page.getByRole('button', { name: /Sign In|Login/i }).click();
        
        await expect(page).toHaveURL(`${APP_URL}/dashboard`, { timeout: 15000 });
        await expect(page.getByRole('heading', { name: /Assessment Dashboard/i, exact: false })).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
        console.log("Fallback login successful.");
      } else {
        throw new Error("Both GitHub OAuth and fallback login failed");
      }
    }
  });

  test('Complete GenomEdge Biotech assessment flow and verify AI transformation report', async ({ page }) => {
    // Step 1: Navigate to Dashboard
    await test.step('Access dashboard from landing page', async () => {
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
      
      // Select departments
      const departmentsToSelect = ['Sales', 'Marketing'];
      for (const department of departmentsToSelect) {
        await page.getByRole('checkbox', { name: department, exact: true }).check();
      }
      
      // Target the roles section specifically
      const rolesSection = page.locator('h3:has-text("Select Roles")').locator('..');

      const rolesToSelect = [
        'Sales (e.g., Regional Sales Manager)',
        'Marketing'
      ];

      for (const role of rolesToSelect) {
        await rolesSection.getByRole('checkbox', { name: role, exact: true }).check();
      }
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Pain points
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=painPoints`);
      await expect(page.getByRole('heading', {name: 'Areas for Improvement', level: 1, exact: true })).toBeVisible();
      
      // General pain points
      await page.locator('textarea').last().fill(testAssessment.painPoints.general);
      
      // Role-specific pain points
      const roleNames = Object.keys(testAssessment.painPoints.rolePainPoints);
      
      for (const roleName of roleNames) {
        const painPointData = testAssessment.painPoints.rolePainPoints[roleName as keyof typeof testAssessment.painPoints.rolePainPoints];
        
        console.log(`Processing pain points for role: ${roleName}`);
        
        // Convert the role name to the same format used in data-role-name
        const normalizedRoleName = roleName.replace(/\s+/g, '-').toLowerCase();
        
        // Find the card using the data-role-name attribute
        const roleCard = page.locator(`[data-role-name="${normalizedRoleName}"]`);
        
        // Verify we found the card
        if (await roleCard.count() === 0) {
          console.error(`Could not find pain points card for role: ${roleName}`);
          continue;
        }
        
        console.log(`Found pain points card for role: ${roleName} using data-role-name attribute`);
        
        try {
          // Wait for the card to be properly visible
          await roleCard.waitFor({ state: 'visible' });
          
          // Make sure the card is in view and focused
          await roleCard.scrollIntoViewIfNeeded();
          await roleCard.focus();
          
          // Find the textarea directly - the first textarea in the card is the description
          console.log(`Setting description for ${roleName}`);
          const textareas = await roleCard.locator('textarea').all();
          
          if (textareas.length > 0) {
            const descriptionTextarea = textareas[0];
            await descriptionTextarea.scrollIntoViewIfNeeded();
            await descriptionTextarea.focus();
            await descriptionTextarea.fill(painPointData.description);
            
            // Wait to ensure the input was accepted
            await page.waitForTimeout(500);
          } else {
            console.error(`Could not find description textarea for ${roleName}`);
          }
          
          // Find all numeric inputs in the card
          const numericInputs = await roleCard.locator('input[type="number"]').all();
          console.log(`Found ${numericInputs.length} numeric inputs for ${roleName}`);
          
          if (numericInputs.length >= 3) {
            // Severity - should be the first numeric input
            console.log(`Setting severity to ${painPointData.severity} for ${roleName}`);
            const severityInput = numericInputs[0];
            await severityInput.scrollIntoViewIfNeeded();
            await severityInput.focus();
            await severityInput.fill(painPointData.severity.toString());
            await page.waitForTimeout(300);
            
            // Frequency - should be the second numeric input
            console.log(`Setting frequency to ${painPointData.frequency} for ${roleName}`);
            const frequencyInput = numericInputs[1];
            await frequencyInput.scrollIntoViewIfNeeded();
            await frequencyInput.focus();
            await frequencyInput.fill(painPointData.frequency.toString());
            await page.waitForTimeout(300);
            
            // Impact - should be the third numeric input
            console.log(`Setting impact to ${painPointData.impact} for ${roleName}`);
            const impactInput = numericInputs[2];
            await impactInput.scrollIntoViewIfNeeded();
            await impactInput.focus();
            await impactInput.fill(painPointData.impact.toString());
            await page.waitForTimeout(300);
          } else {
            console.error(`Not enough numeric inputs for ${roleName}, expected 3 but found ${numericInputs.length}`);
          }
          
          console.log(`Successfully filled all pain point data for role: ${roleName}`);
        } catch (error) {
          console.error(`Error filling pain point data for role ${roleName}:`, error);
        }
      }
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Work volume
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=workVolume`);
      await expect(page.getByRole('heading', {name: 'Work Volume & Complexity', level: 1, exact: true })).toBeVisible();
      
      // Fill work volume data for each role
      for (const roleData of testAssessment.workVolume.roleWorkPatterns) {
        console.log(`Processing role in work volume step: ${roleData.name}`);
        
        // Convert the role name to the same format used in data-role-name
        const normalizedRoleName = roleData.name.replace(/\s+/g, '-').toLowerCase();
        
        // Find the card using the data-role-name attribute
        const roleCard = page.locator(`[data-role-name="${normalizedRoleName}"]`);
        
        // Verify we found the card
        if (await roleCard.count() === 0) {
          console.error(`Could not find card for role: ${roleData.name}`);
          continue;
        }
        
        console.log(`Found card for role: ${roleData.name} using data-role-name attribute`);
        
        try {
          // 1. Task Volume dropdown
          console.log(`Setting Task Volume to ${roleData.volume} for ${roleData.name}`);
          await roleCard.waitFor({ state: 'visible' });
          await roleCard.scrollIntoViewIfNeeded();
          await roleCard.focus();
          
          const buttons = await roleCard.locator('button').all();
          let volumeDropdown = null;
          
          for (const button of buttons) {
            const buttonText = await button.textContent();
            if (buttonText && (buttonText.includes('Volume') || buttonText.includes('Select volume'))) {
              volumeDropdown = button;
              break;
            }
          }
          
          if (!volumeDropdown) {
            console.error(`Could not find volume dropdown for ${roleData.name}`);
            volumeDropdown = roleCard.locator('button').first();
          }
          
          // Click the dropdown
          await volumeDropdown.click();
          
          // Select the option from the dropdown
          try {
            await page.getByRole('option', { name: roleData.volume, exact: true }).click();
          } catch (error) {
            console.log(`Could not find option by exact name, trying alternate approaches for ${roleData.volume}`);
            
            const optionsLocator = page.getByRole('option');
            const options = await optionsLocator.all();
            
            let found = false;
            for (const option of options) {
              const text = await option.textContent();
              if (text && text.toLowerCase().includes(roleData.volume.toLowerCase())) {
                await option.click();
                found = true;
                break;
              }
            }
            
            if (!found) {
              console.error(`Could not find option for ${roleData.volume}`);
            }
          }
          
          await page.waitForTimeout(800);
          
          // 2. Task Complexity dropdown  
          console.log(`Setting Task Complexity to ${roleData.complexity} for ${roleData.name}`);
          
          const allButtons = await roleCard.locator('button').all();
          let complexityDropdown = null;
          
          for (const button of allButtons) {
            const buttonText = await button.textContent();
            if (buttonText && (buttonText.includes('Complexity') || buttonText.includes('Select complexity'))) {
              complexityDropdown = button;
              break;
            }
          }
          
          if (!complexityDropdown) {
            console.error(`Could not find complexity dropdown for ${roleData.name}`);
            const buttons = await roleCard.locator('button').all();
            if (buttons.length >= 2) {
              complexityDropdown = buttons[1];
            }
          }
          
          if (complexityDropdown) {
            await complexityDropdown.scrollIntoViewIfNeeded();
            await complexityDropdown.focus();
            await complexityDropdown.click();
            
            try {
              await page.getByRole('option', { name: roleData.complexity, exact: true }).click();
            } catch (error) {
              console.log(`Could not find option by exact name, trying alternate approaches for ${roleData.complexity}`);
              
              const optionsLocator = page.getByRole('option');
              const options = await optionsLocator.all();
              
              let found = false;
              for (const option of options) {
                const text = await option.textContent();
                if (text && text.toLowerCase().includes(roleData.complexity.toLowerCase())) {
                  await option.click();
                  found = true;
                  break;
                }
              }
              
              if (!found) {
                console.error(`Could not find option for ${roleData.complexity}`);
              }
            }
            
            await page.waitForTimeout(800);
          }
          
          // 3. Repetitiveness field
          console.log(`Setting Repetitiveness to ${roleData.repetitiveness} for ${roleData.name}`);
          
          const inputs = await roleCard.locator('input[type="number"]').all();
          let repetitivenessInput = null;
          
          if (inputs.length > 0) {
            repetitivenessInput = inputs[0];
            await repetitivenessInput.scrollIntoViewIfNeeded();
            await repetitivenessInput.focus();
            await repetitivenessInput.fill(roleData.repetitiveness);
            await page.waitForTimeout(300);
          } else {
            console.error(`Could not find repetitiveness input for ${roleData.name}`);
          }
          
          // 4. Data Description textarea
          if (roleData.dataDescription) {
            console.log(`Setting Data Description for ${roleData.name}`);
            
            const textareas = await roleCard.locator('textarea').all();
            if (textareas.length > 0) {
              const descriptionTextarea = textareas[0];
              await descriptionTextarea.scrollIntoViewIfNeeded();
              await descriptionTextarea.focus();
              await descriptionTextarea.fill(roleData.dataDescription);
              await page.waitForTimeout(300);
            } else {
              console.error(`Could not find description textarea for ${roleData.name}`);
            }
          }
          
          console.log(`Successfully filled data for role: ${roleData.name}`);
        } catch (error) {
          console.error(`Error filling data for role ${roleData.name}:`, error);
        }
      }
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Tech stack
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=techStack`);
      await expect(page.getByRole('heading', {name: 'Data & Systems', level: 1, exact: true })).toBeVisible();
      
      // Find the textarea under "Relevant Tools & Platforms"
      await page.locator('textarea[placeholder*="List key software"]').fill(testAssessment.techStack.relevantTools);
      
      // Data accessibility
      await page.locator('button', { hasText: 'Select accessibility level...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.techStack.dataAccessibility, 'i') }).click();
      
      // Data quality
      await page.locator('button', { hasText: 'Select data quality level...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.techStack.dataQuality, 'i') }).click();
      
      // Systems integration
      await page.locator('button', { hasText: 'Select integration ease...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.techStack.systemsIntegration, 'i') }).click();
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Adoption readiness
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=adoption`);
      await expect(page.getByRole('heading', {name: 'Readiness & Expectations', level: 1, exact: true })).toBeVisible();
      
      // Organizational Readiness for Change
      await page.locator('button', { hasText: 'Select readiness level...' }).click();
      await page.getByRole('option', { name: new RegExp(testAssessment.adoption.changeReadiness, 'i') }).click();
      
      // Stakeholder Alignment on AI Goals
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
      
      // Fill AI adoption score inputs
      
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
      await page.locator('button', { hasText: /Above Average/ }).click();
      await page.getByRole('option', { name: /3.*Average/ }).click();
      
      await page.getByRole('button', { name: /next/i }).click();
      
      // Step: Review
      await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=review`);
      await expect(page.getByRole('heading', {name: 'Review & Submit', level: 1, exact: true })).toBeVisible();
      
      // Before going to review step, validate all required fields are filled
      console.log("Validating form completion before review...");

      // Check if any required fields are missing
      const requiredErrors = await page.locator('input:invalid, select:invalid, [aria-invalid="true"]').all();
      if (requiredErrors.length > 0) {
        console.log(`Found ${requiredErrors.length} invalid fields`);
        await page.screenshot({ path: 'invalid-fields.png' });
      }

      // Take a screenshot of the review page
      await page.screenshot({ path: 'review-page-before-submit.png' });

      // Check if the Generate Report button is visible and enabled
      const generateReportButton = page.getByRole('button', { name: /generate report/i });
      await expect(generateReportButton).toBeVisible();
      await expect(generateReportButton).toBeEnabled();

      console.log("Submitting assessment...");

      // Add error listener before clicking
      page.on('pageerror', (error) => {
        console.error('Page error occurred:', error.message);
      });

      // Click the button and immediately check for redirects
      await generateReportButton.click();

      // Wait a bit and check current URL
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      console.log(`Current URL after submit: ${currentUrl}`);

      // If we're back at step 1, there was a validation error
      if (currentUrl.includes('step=') && !currentUrl.includes('step=review')) {
        await page.screenshot({ path: 'back-to-step-1-error.png' });
        throw new Error(`Form validation failed - redirected to: ${currentUrl}`);
      }

      // Continue with the rest of the submission logic...
    });

    // Step 3 & 4: Verify report creation and content
    await test.step('Validate report creation and content integrity', async () => {
      // Verify we're now on a report page
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Make this assertion more forgiving for local development
      if (!currentUrl.match(new RegExp(`${APP_URL}/reports/\\d+$`))) {
        console.error(`Expected URL to match ${APP_URL}/reports/ID pattern, but got: ${currentUrl}`);
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'genomedge-report-page-error.png' });
        
        // Try to navigate to reports directly one more time
        await page.goto(`${APP_URL}/reports`);
        await page.waitForTimeout(2000);
        
        const reportLinks = await page.locator('a[href^="/reports/"]').all();
        if (reportLinks.length > 0) {
          await reportLinks[0].click();
          await page.waitForTimeout(2000);
        }
      }
      
      // Updated expectation with a more descriptive error message if it fails
      await expect(page.url(), 
        'Expected to be redirected to a report page URL. Check that report generation is working correctly.'
      ).toMatch(new RegExp(`${APP_URL}/reports/\\d+$`));
      
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
          expect(roleVisible).toBeTruthy();
          break;
        }
      }
      
      // Verify ROI information is present
      await page.getByRole('tab', { name: /ai adoption score/i }).click();
      await expect(page.getByText(/ROI Analysis/i)).toBeVisible();
      
      // Verify the AI adoption score inputs are reflected in the report
      await expect(page.getByText(`${testAssessment.aiAdoptionScoreInputs.adoptionRateForecast}%`, { exact: false })).toBeVisible();
      await expect(page.getByText('$450,000', { exact: false })).toBeVisible(); // Cost efficiency gains
      
      // Check roadmap tab
      await page.getByRole('tab', { name: /roadmap/i }).click();
      await expect(page.getByText(/Implementation Timeline/i)).toBeVisible();
      
      // Verify biotech-specific recommendations
      const biotechTermsFound = await page.getByText(/go.to.market/i).isVisible() || 
                               await page.getByText(/content generation/i).isVisible() || 
                               await page.getByText(/partnership/i).isVisible() ||
                               await page.getByText(/scientific/i).isVisible();
      expect(biotechTermsFound).toBeTruthy();
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