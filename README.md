# AI Roadmap Generator

A web application that generates personalized AI learning roadmaps based on user input and preferences.

## Features

- Interactive wizard interface for collecting user preferences
- Dynamic roadmap generation based on user responses
- Support for both local development and Replit deployment
- 7-point scale rating system for preference collection

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd airoadmap
```

2. Install dependencies:
```bash
npm install
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
HOST=127.0.0.1  # Only used in local development

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Replit-specific (automatically set when deployed to Replit)
REPL_ID=your_repl_id
```

## Running the Application

### Local Development

1. Start the development server:
```bash
npm run dev
```

The application will be available at `http://127.0.0.1:5000`

### Replit Deployment

1. Create a new Replit project
2. Connect your GitHub repository
3. Set up the environment variables in Replit's Secrets tab
4. The application will automatically deploy and be available at your Replit URL

Note: When running on Replit, the server automatically binds to `0.0.0.0` to allow external connections. In local development, it uses `127.0.0.1` for security.

## Project Structure

```
airoadmap/
├── client/           # Frontend React application
├── server/           # Backend Express server
├── shared/           # Shared types and utilities
├── .env              # Environment variables
├── package.json      # Project dependencies
└── README.md         # This file
```

## Development

- Frontend development server runs on port 5173
- Backend server runs on port 5000
- The application uses Vite for frontend development
- TypeScript is used throughout the project

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Add your license information here]

## Support

For support, please [add your support contact information] 