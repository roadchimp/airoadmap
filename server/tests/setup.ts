import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
process.env.LINKEDIN_EMAIL = 'test@example.com';
process.env.LINKEDIN_PASSWORD = 'test-password';

// Mock storage methods
jest.mock('../storage', () => ({
  storage: {
    createJobDescription: jest.fn().mockResolvedValue(true),
    updateJobScraperConfigLastRun: jest.fn().mockResolvedValue(true),
    listJobDescriptions: jest.fn().mockResolvedValue([
      {
        id: 1,
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        jobBoard: 'linkedin',
        sourceUrl: 'https://linkedin.com/jobs/test',
        rawContent: 'This is a test job description with substantial content...',
        keywords: ['test'],
        status: 'raw',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]),
    listActiveJobScraperConfigs: jest.fn().mockResolvedValue([])
  }
}));

// Mock puppeteer
jest.mock('puppeteer', () => ({
  __esModule: true,
  default: {
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setUserAgent: jest.fn().mockResolvedValue(null),
        goto: jest.fn().mockResolvedValue(null),
        waitForSelector: jest.fn().mockResolvedValue(null),
        waitForNavigation: jest.fn().mockResolvedValue(null),
        type: jest.fn().mockResolvedValue(null),
        click: jest.fn().mockResolvedValue(null),
        waitForTimeout: jest.fn().mockResolvedValue(null),
        evaluate: jest.fn()
          .mockResolvedValueOnce(true) // login check
          .mockResolvedValueOnce(['https://linkedin.com/jobs/test']) // job links
          .mockResolvedValue({ // job details
            title: 'Test Job',
            company: 'Test Company',
            location: 'Test Location',
            description: 'This is a test job description with substantial content...'
          }),
        close: jest.fn().mockResolvedValue(null)
      }),
      close: jest.fn().mockResolvedValue(null)
    })
  }
})); 