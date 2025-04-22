# AI Roadmap Generator

A web application that generates personalized AI learning roadmaps based on user input and preferences. Built with React, TypeScript, and Express.

## Features

- Modern, responsive landing page with key features and benefits
- Interactive wizard interface for collecting user preferences
- Dynamic roadmap generation based on user responses
- Support for both local development and Replit deployment
- 7-point scale rating system for preference collection
- Dark/Light theme support
- Responsive design for all screen sizes
- Real-time progress tracking
- Customizable learning paths

## Landing Page

The landing page provides an engaging introduction to the AI Roadmap Generator:

- **Hero Section**: Clear value proposition and call-to-action
- **Features Overview**: Visual representation of key features
- **How It Works**: Step-by-step guide to using the application
- **Benefits**: Clear explanation of value for organizations
- **Getting Started**: Quick access to assessment wizard
- **Responsive Design**: Optimized for all devices and screen sizes

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **State Management**: React Context API
- **API Integration**: OpenAI API
- **Deployment**: Replit, Local Development

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Git
- OpenAI API key

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
HOST=0.0.0.0  # Updated for Replit compatibility

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

The application will be available at `http://localhost:5000`

### Replit Deployment

1. Create a new Replit project
2. Connect your GitHub repository
3. Set up the environment variables in Replit's Secrets tab:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 5000 (or your preferred port)
4. The application will automatically deploy and be available at your Replit URL

## Project Structure

```
airoadmap/
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── landing/   # Landing page components
│   │   │   ├── wizard/    # Assessment wizard components
│   │   │   ├── ui/        # Shared UI components
│   │   │   └── layout/    # Layout components
│   │   ├── pages/      # Page components
│   │   │   ├── Landing.tsx   # Landing page
│   │   │   ├── Dashboard.tsx # User dashboard
│   │   │   └── ...          # Other pages
│   │   ├── types/      # TypeScript types
│   │   └── utils/      # Utility functions
├── server/           # Backend Express server
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── utils/     # Utility functions
├── shared/           # Shared types and utilities
├── .env              # Environment variables
├── package.json      # Project dependencies
└── README.md         # This file
```

## Development Guidelines

### Frontend Development
- Uses Vite for fast development and building
- Implements responsive design with TailwindCSS
- Follows component-based architecture
- Uses TypeScript for type safety

### Backend Development
- RESTful API design
- TypeScript for type safety
- Modular route and service structure
- Error handling middleware

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent code formatting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 