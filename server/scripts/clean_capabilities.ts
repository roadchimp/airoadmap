import fs from 'fs';
import path from 'path';

const capabilities = [
  {
    "id": 1,
    "name": "AI-Powered Prospect Research & Targeting",
    "description": "Utilizes AI to analyze CRM data and external signals to identify Ideal Customer Profiles (ICPs) and high-value prospects, automating research and dynamically adjusting targeting criteria."
  },
  {
    "id": 2,
    "name": "AI Communication & Follow-up",
    "description": "Automates timely and contextual follow-up messages, answers common prospect questions, addresses basic concerns, and handles auto-replies or initial referral intake."
  },
  {
    "id": 3,
    "name": "AI-Driven Multi-Channel Outreach",
    "description": "Executes automated outreach sequences across multiple channels (email, LinkedIn, text) using predefined Sales Playbooks and incorporating industry context."
  },
  {
    "id": 4,
    "name": "AI Message Personalization",
    "description": "Generates highly personalized communication tailored to specific target personas based on available data and defined templates."
  },
  {
    "id": 5,
    "name": "Brand Voice & Tone Alignment",
    "description": "Ensures all AI-generated communication aligns strictly with the defined brand voice, tone guidelines, and desired level of human touch."
  },
  {
    "id": 6,
    "name": "Sales & Marketing Analytics",
    "description": "Analyzes campaign performance data to provide insights into the most effective strategies, customer segments, and outreach results."
  },
  {
    "id": 7,
    "name": "CRM Integration & Workflow Automation",
    "description": "Provides native two-way integration with CRMs (e.g., Salesforce, Hubspot) to enroll leads into campaigns based on sales journey stage and intent signals, enabling automated nurturing and follow-up task creation for sales teams."
  }
];

async function main() {
  try {
    const outputPath = path.resolve('server/SDR_capabilities_clean.json');

    // Write the clean JSON
    fs.writeFileSync(outputPath, JSON.stringify(capabilities, null, 2));
    console.log(`Successfully created clean capabilities file at ${outputPath}`);

  } catch (error) {
    console.error('Error creating capabilities file:', error);
    process.exit(1);
  }
}

main(); 