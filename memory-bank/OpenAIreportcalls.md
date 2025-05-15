# OpenAI API Calls in the AIRoadmap Application

## Overview
The AIRoadmap application uses OpenAI's API for several key functionalities through the GPT-4 model. The primary API integration is found in `server/lib/aiService.ts`, which handles various types of AI-generated content for reports and assessments.

## API Call Patterns

### 1. Executive Summary Generation
**Function:** `generateEnhancedExecutiveSummary()`  
**Model:** GPT-4  
**Inputs:**
- Company name, industry, goals from assessment
- Top prioritized roles with their scores
- Custom prompt constructed with this data

**Processing:**
- Makes a completion request to OpenAI
- Uses system prompt to set the context as an "AI transformation consultant"
- Returns the generated text directly

**Response Usage:**
- The response is used as the executive summary in assessment reports
- If OpenAI call fails, falls back to template-based summary

### 2. AI Capability Recommendations
**Function:** `generateAICapabilityRecommendations()`  
**Model:** GPT-4  
**Inputs:**
- Job role data (title, responsibilities)
- Department information
- Pain points data (severity, frequency, impact)

**Processing:**
- Formats a detailed prompt with role information
- Request previously used response_format JSON (now removed)
- Calls the OpenAI API and expects a JSON response
- Attempts to parse the response text as JSON

**Response Usage:**
- Returns an array of AI capability recommendations per role
- Each recommendation includes a name and description
- Used in the "Opportunities" section of reports
- Falls back to role-specific templates if parsing fails

### 3. Performance Impact Predictions
**Function:** `generatePerformanceImpact()`  
**Model:** GPT-4  
**Inputs:**
- Job role data
- Department information

**Processing:**
- Formats a prompt asking for performance predictions
- Request previously used response_format JSON (now removed)
- Calls the OpenAI API and expects a JSON response
- Attempts to parse the response as JSON

**Response Usage:**
- Returns metrics (name and improvement percentage) for each role
- Includes an estimated ROI value
- Used to calculate the overall ROI in reports
- Falls back to predefined values if parsing fails

### 4. General AI Response
**Function:** `generateAIResponse()`  
**Model:** GPT-3.5 Turbo  
**Inputs:**
- Direct string prompt from application

**Processing:**
- Simple completion request with user-provided prompt
- No special response formatting

**Response Usage:**
- Returns raw text response
- Used for ad-hoc AI responses in the application

## Error Handling
- Each API call is wrapped in try/catch blocks
- If an API call fails, fallback functions provide sensible defaults:
  - `fallbackExecutiveSummary()`: A template-based summary
  - `fallbackAICapabilities()`: Role-specific capability recommendations
  - `fallbackPerformanceImpact()`: Role-specific metrics with estimated ROI
- JSON parsing errors are caught and also trigger fallbacks

## API Configuration
- API key loaded from environment variables (OPENAI_API_KEY)
- OpenAI client initialized conditionally based on API key availability
- Dev/prod environment detection for loading environment variables

## Recent Changes
- Removed `response_format: { type: "json_object" }` parameter from API calls
- Added manual JSON parsing of response content
- This change was made to improve compatibility with different OpenAI client versions
