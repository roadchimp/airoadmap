# Score Calculation Methodology and Implementation

This document highlights the methodology used to calculate the various scores used by the wizard, where these calculations are implemented, and how they are displayed in the application.

## AI Adoption Score Parameters and Implementation

### Input Parameters
1. adoptionRateForecast (%) aka Estimated AI Adoption Rate (%)
2. timeSavingsPerUserHours (hours/week)
3. affectedUserCount (number)
4. costEfficiencyGainsAmount ($)
5. performanceImprovementPercentage (Input: %)
6. toolSprawlReductionScore (Input: 1-5 score)

### Implementation Files
- **Primary Calculation**: `server/lib/aiAdoptionScoreEngine.ts` 
  - Function: `calculateAiAdoptionScore()`
  - This is the core implementation of the AI Adoption Score algorithm
  
- **Default Values**: Defined in the same file under `INDUSTRY_DEFAULTS` and `COMPANY_STAGE_WEIGHTS`
  
- **Usage in Reports**: `app/api/reports/assessment/[assessmentId]/route.ts`
  - The calculated score is stored in the report under `aiAdoptionScoreDetails`
  
- **UI Display**: 
  - Overview tab: `app/(app)/reports/[id]/page.tsx` (AI Adoption Score card)
  - Detailed view: `app/(app)/reports/[id]/ai-adoption-score.tsx` (AI Adoption Score components and ROI)

## ROI Calculation

### Parameters and Formula
1. estimatedInvestment (default = $2000 per affected user)
2. annualBenefit = costEfficiencyGainsAmount + (timeSavingsPerUserHours * affectedUserCount * 48 * 50) 
   - Assumes $50/hr, 48 work weeks per year
3. netBenefit = annualBenefit - estimatedInvestment
4. calculatedRoiPercentage = (netBenefit / estimatedInvestment) * 100
5. paybackPeriodMonths = (estimatedInvestment / annualBenefit) * 12

### Implementation Files
- **Primary Implementation**: `server/lib/aiAdoptionScoreEngine.ts`
  - Lines ~370-390 contain the ROI calculation logic
  
- **Report Formatting**: `app/api/reports/assessment/[assessmentId]/route.ts`
  - Lines ~276-284 format the ROI details for the UI:
  ```typescript
  roiDetails: {
    annualRoi: netBenefitAmount,
    costSavings: netBenefitAmount * 0.6, // 60% of net benefit
    additionalRevenue: netBenefitAmount * 0.4, // 40% of net benefit
    aiInvestment: investmentAmount,
    roiRatio: calculatedRoiPercentage / 100
  }
  ```

- **UI Display**: `app/(app)/reports/[id]/ai-adoption-score.tsx`
  - Displays the ROI details and components in the AI Adoption Score subtab

## Performance Impact ROI (Separate System)

### Implementation
- **Generation**: `server/lib/aiService.ts`
  - Function: `generatePerformanceImpact()` - Makes OpenAI API call to generate metrics
  - Function: `fallbackPerformanceImpact()` - Provides fallback values if API fails
  - Returns both metrics and an estimated ROI value (ranging from $150k-$320k depending on role)
  
- **Aggregation**: `server/lib/prioritizationEngine.ts`
  - Lines ~175-206 aggregate ROI across roles
  - Stores the total in `performanceImpact.estimatedRoi`
  
- **UI Display**: `app/(app)/reports/[id]/page.tsx`
  - Displayed in the "Expected Performance Impact" card on the Overview tab

## Score Component Calculation
```typescript
function calculateScoreComponent(
  inputValue: number,
  weight: number,
  minValue: number,
  maxValue: number,
  details?: string
): CalculatedScoreComponent {
  // Normalize to 0-1 scale
  const normalizedValue = Math.min(1, Math.max(0, (inputValue - minValue) / (maxValue - minValue)));
  
  // Apply weight
  const weightedScore = normalizedValue * weight;
  
  return {
    input: inputValue,
    normalizedScore: normalizedValue,
    weightedScore: weightedScore,
    details: details
  };
}
```

## AI Adoption Score Formula

#### Variables and Weighting
1. **Usage Extent (U)**: Adoption Rate - calculated from adoptionRateForecast
2. **Impact Realization (I)**: Time Savings - calculated from timeSavingsPerUserHours
3. **Employee Interaction (E)**: Cost Efficiency - calculated from costEfficiencyGainsAmount
4. **Strategic Integration (S)**: Performance Improvement - calculated from performanceImprovementPercentage
5. **Barriers and Limitations (B)**: Tool Sprawl Reduction - calculated from toolSprawlReductionScore
6. **Industry Benchmarking Factor (IB)**: Adjustment based on industry maturity
    
#### Formula Implementation

```typescript
// In server/lib/aiAdoptionScoreEngine.ts
const numerator = 
  adoptionComponent.weightedScore + 
  timeSavingsComponent.weightedScore + 
  costEfficiencyComponent.weightedScore + 
  performanceComponent.weightedScore + 
  toolSprawlComponent.weightedScore;

const denominatorIB = 1; // Using adjustment factor instead

// Scale to 0-100 range and apply maturity adjustment
const rawScore = numerator / denominatorIB;
const scaledScore = Math.min(100, Math.max(0, rawScore * 20)); // Scale to 0-100
const finalScore = scaledScore * industryMaturityFactor;
```

## Value/Effort Scoring and Prioritization

### Implementation File
- **Calculation**: `server/lib/prioritizationEngine.ts`
  
### Score Calculation
- **Value Score**: Based on pain points (severity, frequency, impact)
  ```typescript
  const valueScore = ((severity + frequency + impact) / 3) * 1.67; // Scale to ~1-5
  ```
  
- **Effort Score**: Influenced by data quality
  ```typescript
  const effortScore = 6 - dataQuality; // Lower is better
  ```
  
- **Value/Effort Levels**: Determined by thresholds 
  ```typescript
  // Value level determination
  if (valueScore >= 4) valueLevel = "high";
  else if (valueScore >= 3) valueLevel = "medium";
  else valueLevel = "low";
  
  // Effort level determination
  if (effortScore <= 2.5) effortLevel = "low";
  else if (effortScore <= 3.5) effortLevel = "medium";
  else effortLevel = "high";
  ```

### UI Display
- **Opportunities Table**: `app/(app)/reports/[id]/opportunities-table.tsx`
- **Detailed View**: Components within that file display prioritized roles

## Industry-Specific Defaults and Company-Stage Weight Profiles

The application includes comprehensive default values for different industries and company stages. These defaults are used when user inputs are missing or to provide guidance for settings.

AIadoptionscore parameters
1. adoptionRateForecast (%) aka Estimated AI Adoption Rate (%)?
2. timeSavingsPerUserHours (hours/week)
3. affectedUserCount (number)
4. costEfficiencyGainsAmount
5. performanceImprovementPercentage (Input: %)
6. toolSprawlReductionScore (Input: 1-5 score)
   
ROI calculation
7. estimatedInvestment (default = 10000)
8. annualBenefit = (inputs.costEfficiencyGainsAmount ?? 0) +((inputs.timeSavingsPerUserHours ?? 0) * (inputs.affectedUserCount ?? 0) * 52 * 25); // Assume $25/hr, 52 weeks
9. netBenefit = annualBenefit - estimatedInvestment
10. calculatedRoiPercentage = estimatedInvestment > 0 ? (netBenefit / estimatedInvestment) * 100 : 0
11. paybackPeriodMonths = annualBenefit > 0 ? (estimatedInvestment / annualBenefit) * 12 : Infinity;

AiAdoptionScore calculation
1. overallScore: Math.max(0, Math.min(overallScore, 100))
2. formula needs to be derived from inputs
  
We need research baseline levels of reasonable estimates for values or ranges of values for each of the parameters which can serve as default values. We want users to input values themselves, however they might not have realistic understanding of information, so we need to construct a survey to help them extract this data, where some of the input might be qualitative in nature and we need to convert it to some actual values to perform calculations on. We have constructed a survey that prompts users to input some of this data. help us to amend the survey to specifically obtain required information to derive the 6 values above

### **AIAdoption Score Formula**

 
#### **Variables:**

1. **Usage Extent** (U): Average score from questions on the degree of AI deployment across functions.
    
2. **Impact Realization** (I): Weighted average of scores reflecting tangible benefits (e.g., cost savings, improved efficiency).
    
3. **Employee Interaction** (E): Average score for user engagement with AI systems.
    
4. **Strategic Integration** (S): Average score from responses on alignment with organizational strategy.
    
5. **Barriers and Limitations** (B): Score inversely weighted based on the severity of adoption barriers.
    
6. **Industry Benchmarking Factor** (IB): Normalize the score against industry averages for contextual comparison.
    
#### **Formula:**

AI Adoptionscore
  
\text{AIAdoption Score} = \frac{\alpha \cdot U + \beta \cdot I + \gamma \cdot E + \delta \cdot S - \epsilon \cdot B}{IB}

Where:

- \alpha, \beta, \gamma, \delta, \epsilon are weights assigned to reflect relative importance.
    
- IB = \text{Industry Benchmarking Factor}.

### **Example Weighting**

  

If strategic integration (S) and impact realization (I) are deemed most critical:

- Set \alpha = 0.2, \beta = 0.3, \gamma = 0.2, \delta = 0.3, and \epsilon = 0.1.
    
- Adjust weights based on feedback or the primary focus of the assessment.

# **AI Adoption & ROI Scoring Presets**
  
## **Industry-Specific Defaults**

- **Software & Technology:**
    
    - _Adoption Rate:_ ~40–60% (default ~50%). Tech firms lead AI usage (46% of software companies are "AI leaders" ).
        
    - _Time Saved:_ ~5–10 hrs/user/week (default ~7). Developers see ~55% faster task completion with AI (Federal Reserve: 5.4% of work hours saved by generative AI , ~2 h/week).
        
    - _Affected Users:_ ~50–200 (default ~100) users per mid-sized firm.
        
    - _Cost Efficiency:_ ~10–20% savings (default ~15%). Many firms report ~10–19% cost reduction after AI (e.g. 32% of manufacturing saw 10–19% cost cuts ).
        
    - _Performance Gain:_ ~20–40% (default ~30%). High-skilled workers can gain ~40% performance boost from AI tools .
        
    - _Tool Sprawl Reduction:_ ~4/5 (default 4). Tech teams often consolidate redundant tools via AI platforms.
        
    - _Weightings:_ Adoption 25%, Time 20%, Users 10%, Cost 15%, Performance 25%, Sprawl 5%. _(Software companies emphasize innovation and performance_ _and value productivity gains_ _.)_
        
    
- **Finance & Banking:**
    
    - _Adoption Rate:_ ~30–50% (default ~40%). Banking/fintech are among highest AI adopters (49% fintech firms are AI leaders ).
        
    - _Time Saved:_ ~3–6 hrs/week (default ~4). Financial pros expect modest near-term time savings (~4 h/week next year ).
        
    - _Affected Users:_ ~50–200 (default ~100). E.g. traders, analysts, risk teams.
        
    - _Cost Efficiency:_ ~5–15% (default ~10%). AI fraud detection alone could save ~$10.4B globally by 2027 . Many banks report 5–10%+ reductions in ops costs.
        
    - _Performance Gain:_ ~10–20% (default ~15%). AI-enabled algorithms can boost trading, risk forecasting, and personalization (e.g. analytics tasks).
        
    - _Tool Sprawl Reduction:_ ~3. Financial firms consolidate platforms (e.g. regtech suites) via AI tools.
        
    - _Weightings:_ Cost 30%, Performance 25%, Adoption 15%, Time 15%, Sprawl 15%. _(Finance stresses risk and cost gains_ _; Thomson Reuters survey finds 77% expect high AI impact on workflows_ _.)_
        
    
- **Healthcare:**
    
    - _Adoption Rate:_ ~20–50% (default ~30%). Clinical AI use is rising (e.g. 66% of doctors used AI in 2024 ). However, organizational deployment lags due to regulation.
        
    - _Time Saved:_ ~2–5 hrs/week (default ~3). AI scribes save physicians ~1 hour/day (~5 h/week) by automating notes.
        
    - _Affected Users:_ ~10–50 (default ~30). Key users: doctors, nurses, administrators.
        
    - _Cost Efficiency:_ ~5–15% (default ~10%). AI can cut admin/diagnostic costs (studies show 10–19% savings in medtech/processes ).
        
    - _Performance Gain:_ ~10–20% (default ~15%). AI aids diagnostics and workflow (improves accuracy/outcomes by reducing errors).
        
    - _Tool Sprawl Reduction:_ ~2. Many specialized systems remain.
        
    - _Weightings:_ Performance 30%, Adoption 20%, Time 15%, Cost 20%, Sprawl 15%. _(Healthcare prioritizes accuracy and patient outcomes_ _; AI drives administrative efficiencies_ _.)_
        
    
- **Retail & E-Commerce:**
    
    - _Adoption Rate:_ ~10–30% (default ~20%). Retailers adopt AI (e.g. personalization) at a moderate pace.
        
    - _Time Saved:_ ~2–4 hrs/week (default ~3). Sales teams report 1–5 h/week saved by AI assistants .
        
    - _Affected Users:_ ~50–300 (default ~150). Primarily marketing, sales, inventory teams.
        
    - _Cost Efficiency:_ ~5–10% (default ~8%). AI-driven logistics and demand forecasting cut costs (20% of retail/marketing leaders saw 10–19% savings ).
        
    - _Performance Gain:_ ~15–25% (default ~20%). AI personalization lifts conversion/upsell ~19–22% in retail .
        
    - _Tool Sprawl Reduction:_ ~3. Some consolidation of marketing and CRM tools.
        
    - _Weightings:_ Performance 25%, Cost 25%, Adoption 15%, Time 15%, Sprawl 20%. _(Retail values customer personalization and efficiency_ _; AI can reduce costs in marketing/ops_ _.)_
        
    
- **Manufacturing:**
    
    - _Adoption Rate:_ ~20–40% (default ~30%). Automation and AI are growing in factories.
        
    - _Time Saved:_ ~3–6 hrs/week (default ~4). AI optimizes workflows (e.g. predictive maintenance) to save engineer hours.
        
    - _Affected Users:_ ~100–500 (default ~300). Includes production, quality, and R&D teams.
        
    - _Cost Efficiency:_ ~10–20% (default ~15%). Many manufacturers report 10–19% cost reductions via AI (supply chain, defect reduction).
        
    - _Performance Gain:_ ~10–20% (default ~15%). AI improves yield and throughput (e.g. defect detection, 20%+ efficiency gains).
        
    - _Tool Sprawl Reduction:_ ~3. Moderate integration of OT/IT platforms.
        
    - _Weightings:_ Cost 30%, Performance 25%, Adoption 15%, Time 15%, Sprawl 15%. _(Manufacturing sees clear efficiency gains; 32% saw 10–19% cost cuts_ _.)_
        
    
- **Education:**
    
    - _Adoption Rate:_ ~5–15% (default ~10%). Education tech is emerging; adoption is slower (some surveys suggest ~50% of teachers use AI in some form, but institutions are cautious).
        
    - _Time Saved:_ ~1–3 hrs/week (default ~2). AI tools (grading, content creation) save a few hours.
        
    - _Affected Users:_ ~10–50 (default ~20). Teachers and admin staff primarily.
        
    - _Cost Efficiency:_ ~5–10% (default ~8%). Potential savings in admin/assessment (few cited studies yet).
        
    - _Performance Gain:_ ~5–10% (default ~8%). AI can personalize learning (e.g. adaptive learning systems).
        
    - _Tool Sprawl Reduction:_ ~2. EdTech platforms are still fragmented.
        
    - _Weightings:_ Time 30%, Adoption 20%, Performance 20%, Cost 15%, Sprawl 15%. _(Education prioritizes implementation ease and outcomes; institutions tend to move slower on AI.)_
        
    
- **Professional Services (e.g. Consulting, Legal):**
    
    - _Adoption Rate:_ ~20–40% (default ~30%). Many firms experiment with AI tools (e.g. legal research, audit).
        
    - _Time Saved:_ ~4–8 hrs/week (default ~5). Consultants at Grant Thornton/EY saved ~7.5 h/week with AI . Legal professionals expect 4 h/week soon .
        
    - _Affected Users:_ ~50–200 (default ~100). Analysts, consultants, lawyers.
        
    - _Cost Efficiency:_ ~5–10% (default ~8%). Efficiency gains translate to billable hours.
        
    - _Performance Gain:_ ~20–30% (default ~25%). Complex analysis and report drafting are boosted by AI (MIT: 40% boost for skilled work ).
        
    - _Tool Sprawl Reduction:_ ~3. Moderately consolidating research and project tools.
        
    - _Weightings:_ Time 30%, Performance 25%, Adoption 15%, Cost 20%, Sprawl 10%. _(Services value productivity—Thomson Reuters: 77% expect high AI impact_ _; consultants report large time savings_ _.)_
        
    
- **Media & Entertainment:**
    
    - _Adoption Rate:_ ~30–60% (default ~40%). Rapid uptake of generative AI for content (e.g. half of top media companies use or pilot AI).
        
    - _Time Saved:_ ~3–6 hrs/week (default ~4). Content creation and editing tasks are accelerated by AI (e.g. 52% faster case handling ).
        
    - _Affected Users:_ ~20–100 (default ~50). Creatives, marketers, producers.
        
    - _Cost Efficiency:_ ~5–15% (default ~10%). AI reduces outsourcing/content costs (studies highlight gains in media personalization and production).
        
    - _Performance Gain:_ ~15–25% (default ~20%). AI-generated content boosts output (e.g. 26% of AI value in media comes from sales/marketing use ).
        
    - _Tool Sprawl Reduction:_ ~4. Creative teams often adopt unified AI platforms for writing, editing, design.
        
    - _Weightings:_ Performance 30%, Adoption 20%, Time 20%, Cost 10%, Sprawl 20%. _(Media firms see AI-driven growth in marketing/content_ _; fast-paced industry rewards high performance.)_
        
    

  

## **Company-Stage Weight Profiles**

- **Startup:**
    
    - _Focus:_ Growth and speed.
        
    - _Weights:_ Time Saved 30%, Adoption Rate 20%, Performance 20%, Affected Users 10%, Cost 10%, Sprawl 10%.
        
    - _Rationale:_ Startups aggressively invest in AI (90% did in one survey ) to gain quick wins. They prioritize time savings and adopting new tools; cost minimization is secondary at this stage.
        
    
- **Early Growth:**
    
    - _Focus:_ Scaling operations and execution.
        
    - _Weights:_ Time 25%, Adoption 20%, Performance 20%, Users 15%, Cost 10%, Sprawl 10%.
        
    - _Rationale:_ Early growth firms still value speed and productivity but begin weighing cost and broader user impact more.
        
    
- **Scaling:**
    
    - _Focus:_ Efficiency and ROI.
        
    - _Weights:_ Cost 20%, Users 20%, Time 20%, Performance 15%, Adoption 15%, Sprawl 10%.
        
    - _Rationale:_ As organizations scale, optimizing costs and ensuring many users benefit becomes critical. (BCG notes that ~62% of AI's value comes from core functions like operations .)
        
    
- **Mature Enterprise:**
    
    - _Focus:_ Profitability and consolidation.
        
    - _Weights:_ Cost 30%, Users 20%, Sprawl 15%, Performance 10%, Time 15%, Adoption 10%.
        
    - _Rationale:_ Large incumbents emphasize cost savings and reducing tool sprawl. They extract AI value in core functions, focusing more on ROI and governance than on raw speed.
        
    
## **Survey Input Mappings (Qualitative → Numeric)**


For all of the following factors, map user responses **Low/Medium/High** (or 1/2/3 scale) to numeric scores **1/2/3**, respectively (optionally normalizing to 0–1 as needed). For example:

|**Factor**|**Low (1)**|**Medium (2)**|**High (3)**|
|---|---|---|---|
|Openness to change|1|2|3|
|Skills readiness|1|2|3|
|Suitability of task to AI|1|2|3|
|Task complexity|1|2|3|
|Error risk|1|2|3|
|Repetitiveness|1|2|3|
|Data quality|1|2|3|
|Decision complexity|1|2|3|
|Pain point severity|1|2|3|
|Pain point frequency|1|2|3|
|Pain point impact|1|2|3|

This standard mapping ensures high/medium/low responses feed consistently into scoring formulas. (_In scoring rules, "High" typically boosts the AI adoption/ROI score more than "Low."_)


**Sources:** Industry insights and surveys are used to set these defaults. For example, BCG notes software and fintech lead in AI adoption ; McKinsey and MIT report large productivity gains from AI ; Thomson Reuters and AMA highlight time savings in knowledge work ; IndataLabs/McKinsey find 10–19% cost reductions in many sectors . These inform the ranges and recommended default values above.
