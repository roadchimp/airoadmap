# Test info

- Name: Enterprise SaaS Inc. (ESI) AI Transformation Assessment >> Complete ESI assessment flow and verify AI transformation report
- Location: /Users/samsena/Documents/Repos/airoadmap/e2e/EnterpriseSaaS.spec.ts:107:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByRole('heading', { name: 'Pre-Sales AI Transformation' })
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Pre-Sales AI Transformation' })

    at /Users/samsena/Documents/Repos/airoadmap/e2e/EnterpriseSaaS.spec.ts:368:105
```

# Page snapshot

```yaml
- alert
- link "AI Prioritize Transformation Tool":
  - /url: /dashboard
  - img
  - heading "AI Prioritize" [level=1]
  - paragraph: Transformation Tool
- navigation:
  - link "Dashboard":
    - /url: /dashboard
    - img
    - text: Dashboard
  - link "New Assessment":
    - /url: /assessment/new
    - img
    - text: New Assessment
  - link "Current Assessments":
    - /url: /assessment/current
    - img
    - text: Current Assessments
  - link "Previous Reports":
    - /url: /reports
    - img
    - text: Previous Reports
  - link "Libraries":
    - /url: /library
    - img
    - text: Libraries
  - link "Scoring Settings":
    - /url: /settings/scoring
    - img
    - text: Scoring Settings
  - link "Home":
    - /url: /
    - img
    - text: Home
- button "Collapse sidebar":
  - text: Hide Menu
  - img
- img
- paragraph: Consultant User
- paragraph: consultant@example.com
- button:
  - img
- banner:
  - heading "AI Transformation Assessment" [level=1]
  - button "Help":
    - img
    - text: Help
- main:
  - heading "AI Transformation Report" [level=1]
  - paragraph: Generated on 5/18/2025, 7:35:56 PM
  - button "Print/PDF":
    - img
    - text: Print/PDF
  - button "Export":
    - img
    - text: Export
  - text: "Assessment Context Assessment For: N/A Organization: Default Organization Industry: Software & Technology Industry Maturity: Mature Company Stage: Scaling Strategic Focus: Efficiency & Productivity, Cost Reduction, Revenue Growth, Operational Excellence"
  - tablist:
    - tab "Overview" [selected]
    - tab "Priority Matrix"
    - tab "Opportunities"
    - tab "Performance Metrics"
    - tab "AI Adoption Score"
  - tabpanel "Overview":
    - text: Executive Summary
    - paragraph: "Executive Summary: Enterprise SaaS Inc., given its stance in the highly competitive software and technology industry, has a direct opportunity to leverage the potential of Artificial Intelligence (AI) to augment productivity, drive operational efficiency, and accelerate sales cycles. This summary puts forth strategic insights for leveraging AI to attain core objectives such as automating pre-sales tasks, reducing Solutions Engineer (SE) workload, hastening sales, and standardizing knowledge across the team. Our assessment pinpoints three focal areas of AI transformation that align well with the organization's vision and goals. These are: Sales (Regional Sales Manager level), SE operations, and Systems/IT/Infrastructure, all carrying medium priority, yet promising substantial business value. AI application in sales can customize customer interaction, leading to an efficient sales process. AI can automate several tasks of an SE, reducing the workload and freeing them up for more critical business operations. Moreover, incorporating AI into systems and IT infrastructure can enhance the IT performance as a whole by promoting informed decision-making. The expected outcomes of this AI transformation venture are multi-faceted. The incorporation of AI can help in making the pre-sales tasks autonomous which would expedite the sales cycle. It could also curtail the efforts put in by Sales Engineers in repetitive tasks, thereby enhancing productivity and efficiency. The utilization of AI in IT infrastructure indicates towards systematic knowledge management ensuring seamless operations. A high-level implementation approach would revolve around progressive transformation, starting with pinpointed automation in sales operations and scaling it over time across domains. Riding on collaborations with expert AI vendors, meticulously planned pilot projects, and robust system integration capabilities, the phased manner adoption to AI will mitigate risks and ensure seamless transition. Potential strategic benefits include a notable improvement in sales velocity due to the intelligent automation of pre-sales tasks, an advancement in operational effectiveness delivered by reducing the SE workload, and a positive impact on the internal culture with the introduction of AI, fostering an environment of innovation and learning. Moreover, implementing AI can standardize and maintain the consistency of knowledge across the team, providing a long-term strategic edge in this dynamic industry. In conclusion, the thoughtful integration of AI in a phased manner can enhance Enterprise SaaS Inc.'s operational and sales efficiency, positioning the company to embrace the future of work and continue thriving."
    - img
    - text: Expected Performance Impact
    - heading "$790000" [level=3]
    - paragraph: Estimated Annual ROI
    - paragraph: Based on time savings and increased throughput
    - text: 📈 AI Adoption Score
    - img
    - text: "0"
    - paragraph: Click to view details
    - text: Consultant Commentary
    - button "Edit":
      - img
      - text: Edit
    - paragraph: No commentary has been added yet.
```

# Test source

```ts
  268 |       // The placeholder contains text about listing software, platforms, or databases
  269 |       await page.locator('textarea[placeholder*="List key software"]').fill(testAssessment.techStack.relevantTools);
  270 |       
  271 |       // Data accessibility - use exact placeholder text from UI
  272 |       await page.locator('button', { hasText: 'Select accessibility level...' }).click();
  273 |       await page.getByRole('option', { name: new RegExp(testAssessment.techStack.dataAccessibility, 'i') }).click();
  274 |       
  275 |       // Data quality - use exact placeholder text from UI
  276 |       await page.locator('button', { hasText: 'Select data quality level...' }).click();
  277 |       await page.getByRole('option', { name: new RegExp(testAssessment.techStack.dataQuality, 'i') }).click();
  278 |       
  279 |       // Systems integration - use exact placeholder text from UI
  280 |       await page.locator('button', { hasText: 'Select integration ease...' }).click();
  281 |       await page.getByRole('option', { name: new RegExp(testAssessment.techStack.systemsIntegration, 'i') }).click();
  282 |       
  283 |       await page.getByRole('button', { name: /next/i }).click();
  284 |       
  285 |       // Step: Adoption readiness
  286 |       await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=adoption`);
  287 |       await expect(page.getByRole('heading', {name: 'Readiness & Expectations', level: 1, exact: true })).toBeVisible();
  288 |       
  289 |       // Organizational Readiness for Change - dropdown
  290 |       await page.locator('button', { hasText: 'Select readiness level...' }).click();
  291 |       await page.getByRole('option', { name: new RegExp(testAssessment.adoption.changeReadiness, 'i') }).click();
  292 |       
  293 |       // Stakeholder Alignment on AI Goals - dropdown
  294 |       await page.locator('button', { hasText: 'Select alignment level...' }).click();
  295 |       await page.getByRole('option', { name: new RegExp(testAssessment.adoption.stakeholderAlignment, 'i') }).click();
  296 |       
  297 |       // Anticipated Training Needs
  298 |       await page.locator('textarea[placeholder*="Describe potential training requirements"]').fill(testAssessment.adoption.trainingNeeds);
  299 |       
  300 |       // Expected Adoption Challenges
  301 |       await page.locator('textarea[placeholder*="List potential hurdles to successful AI adoption"]').fill(testAssessment.adoption.expectedChallenges);
  302 |       
  303 |       // Key Success Metrics
  304 |       await page.locator('textarea[placeholder*="How will the success of AI adoption be measured"]').fill(testAssessment.adoption.successMetrics);
  305 |       
  306 |       await page.getByRole('button', { name: /next/i }).click();
  307 |       
  308 |       // Step: ROI targets
  309 |       await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=aiAdoptionScoreInputs`);
  310 |       await expect(page.getByRole('heading', {name: 'ROI Targets', level: 1, exact: true })).toBeVisible();
  311 |       
  312 |       // Fill AI adoption score inputs by finding text labels first, then targeting the nearby input
  313 |       
  314 |       // Adoption Rate Forecast (%)
  315 |       await page.getByText('Adoption Rate Forecast (%)')
  316 |         .locator('xpath=following::input')
  317 |         .first()
  318 |         .fill(testAssessment.aiAdoptionScoreInputs.adoptionRateForecast.toString());
  319 |       
  320 |       // Time Savings (hours/week/user)
  321 |       await page.getByText('Time Savings (hours/week/user)')
  322 |         .locator('xpath=following::input')
  323 |         .first()
  324 |         .fill(testAssessment.aiAdoptionScoreInputs.timeSavingsPerUserHours.toString());
  325 |       
  326 |       // Affected Users (count)
  327 |       await page.getByText('Affected Users (count)')
  328 |         .locator('xpath=following::input')
  329 |         .first()
  330 |         .fill(testAssessment.aiAdoptionScoreInputs.affectedUserCount.toString());
  331 |       
  332 |       // Cost Efficiency Gains ($)
  333 |       await page.getByText('Cost Efficiency Gains ($)')
  334 |         .locator('xpath=following::input')
  335 |         .first()
  336 |         .fill(testAssessment.aiAdoptionScoreInputs.costEfficiencyGainsAmount.toString());
  337 |       
  338 |       // Performance Improvement (%)
  339 |       await page.getByText('Performance Improvement (%)')
  340 |         .locator('xpath=following::input')
  341 |         .first()
  342 |         .fill(testAssessment.aiAdoptionScoreInputs.performanceImprovementPercentage.toString());
  343 |       
  344 |       // Tool Sprawl Reduction (1-5)
  345 |       await page.locator('button', { hasText: /4 - Above Average/ }).click();
  346 |       await page.getByRole('option', { name: new RegExp(`${testAssessment.aiAdoptionScoreInputs.toolSprawlReductionScore}.*`), exact: false }).click();
  347 |       
  348 |       await page.getByRole('button', { name: /next/i }).click();
  349 |       
  350 |       // Step: Review
  351 |       await expect(page).toHaveURL(`${APP_URL}/assessment/new?step=review`);
  352 |       await expect(page.getByRole('heading', {name: 'Review & Submit', level: 1, exact: true })).toBeVisible();
  353 |       
  354 |       // Submit assessment
  355 |       await page.getByRole('button', { name: /generate report/i }).click();
  356 |       
  357 |       // Wait for report generation
  358 |       await expect(page.getByText(/Generating report/i)).toBeVisible({ timeout: 5000 });
  359 |       await expect(page.getByText(/Generating report/i)).not.toBeVisible({ timeout: 120000 });
  360 |     });
  361 |
  362 |     // Step 3 & 4: Verify report creation and content
  363 |     await test.step('Validate report creation and content integrity', async () => {
  364 |       // Verify we've been redirected to the report page
  365 |       await expect(page.url()).toMatch(new RegExp(`${APP_URL}/reports/\\d+$`));
  366 |       
  367 |       // Verify report header 
> 368 |       await expect(page.getByRole('heading', { name: testAssessment.basics.reportName, exact: false })).toBeVisible();
      |                                                                                                         ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  369 |       
  370 |       // Verify company info
  371 |       await expect(page.getByText(testAssessment.basics.companyName)).toBeVisible();
  372 |       await expect(page.getByText(testAssessment.basics.industry)).toBeVisible();
  373 |       
  374 |       // Verify AI Adoption Score is calculated and visible
  375 |       await expect(page.getByTestId('ai-adoption-score')).toBeVisible();
  376 |       
  377 |       // Verify opportunities section
  378 |       await expect(page.getByText(/Transformation Opportunities/i)).toBeVisible();
  379 |       
  380 |       // Verify at least one role from assessment is mentioned
  381 |       for (const role of testAssessment.roles) {
  382 |         const roleVisible = await page.getByText(role.title).isVisible();
  383 |         if (roleVisible) {
  384 |           // If we found at least one role, we're good
  385 |           expect(roleVisible).toBeTruthy();
  386 |           break;
  387 |         }
  388 |       }
  389 |       
  390 |       // Verify ROI information is present
  391 |       await page.getByRole('tab', { name: /ai adoption score/i }).click();
  392 |       await expect(page.getByText(/ROI Analysis/i)).toBeVisible();
  393 |       
  394 |       // Verify the AI adoption score inputs are reflected in the report
  395 |       await expect(page.getByText(`${testAssessment.aiAdoptionScoreInputs.adoptionRateForecast}%`, { exact: false })).toBeVisible();
  396 |       await expect(page.getByText('$500,000', { exact: false })).toBeVisible(); // Cost efficiency gains
  397 |       
  398 |       // Check roadmap tab
  399 |       await page.getByRole('tab', { name: /roadmap/i }).click();
  400 |       await expect(page.getByText(/Implementation Timeline/i)).toBeVisible();
  401 |       
  402 |       // Verify pre-sales specific recommendations (case study specific)
  403 |       const preRoleFound = await page.getByText(/Pre-Sales/i).isVisible() || 
  404 |                           await page.getByText(/automation/i).isVisible() || 
  405 |                           await page.getByText(/knowledge base/i).isVisible();
  406 |       expect(preRoleFound).toBeTruthy();
  407 |     });
  408 |
  409 |     // Step 5: Verify persistent access
  410 |     await test.step('Ensure report persistence and accessibility', async () => {
  411 |       // Record the report URL
  412 |       const reportUrl = page.url();
  413 |       const reportId = reportUrl.split('/').pop();
  414 |       
  415 |       // Navigate to dashboard
  416 |       await page.goto(`${APP_URL}/dashboard`);
  417 |       
  418 |       // Verify reports list
  419 |       await page.getByText(/reports/i).click();
  420 |       await expect(page.getByText(testAssessment.basics.reportName)).toBeVisible();
  421 |       
  422 |       // Navigate back to report via the list
  423 |       await page.getByText(testAssessment.basics.reportName).click();
  424 |       await expect(page.url()).toBe(reportUrl);
  425 |       
  426 |       // Verify content is still accessible
  427 |       await expect(page.getByRole('heading', { name: testAssessment.basics.reportName, exact: false })).toBeVisible();
  428 |       
  429 |       // Verify we can access the original assessment
  430 |       await page.goto(`${APP_URL}/dashboard`);
  431 |       await page.getByText(/assessments/i).click();
  432 |       await expect(page.getByText(testAssessment.basics.reportName)).toBeVisible();
  433 |     });
  434 |   });
  435 | });
  436 |
```