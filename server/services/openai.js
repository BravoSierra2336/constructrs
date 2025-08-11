import '../config/env.js'; // Load environment variables first
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const OpenAI = require('openai');

// Initialize OpenAI client with fallback handling
const createOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not found. AI features will be disabled.');
    return null;
  }
  console.log('OpenAI client initialized successfully');
  return new OpenAI({ apiKey });
};

// Function to reinitialize client if needed
export const reinitializeOpenAI = () => {
  openai = createOpenAIClient();
  return openai;
};

let openai = createOpenAIClient();

// Chat completion service
export const chatCompletion = async (messages, options = {}) => {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI service is not available. API key not configured.'
      };
    }

    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: options.maxTokens || 150,
      temperature: options.temperature || 0.7,
      ...options
    });

    return {
      success: true,
      data: response.choices[0].message.content,
      usage: response.usage
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Employee data analysis service
export const analyzeEmployeeData = async (employeeData, analysisType = 'summary') => {
  try {
    let prompt;
    
    switch (analysisType) {
      case 'performance':
        prompt = `Analyze this employee's performance data and provide insights: ${JSON.stringify(employeeData)}`;
        break;
      case 'summary':
        prompt = `Provide a professional summary of this employee: ${JSON.stringify(employeeData)}`;
        break;
      case 'recommendations':
        prompt = `Based on this employee data, provide development recommendations: ${JSON.stringify(employeeData)}`;
        break;
      default:
        prompt = `Analyze this employee data: ${JSON.stringify(employeeData)}`;
    }

    const messages = [
      {
        role: 'system',
        content: 'You are an HR analyst providing professional insights about employee data. Be concise and professional.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await chatCompletion(messages, { maxTokens: 300 });
  } catch (error) {
    console.error('Employee analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate report service
export const generateReport = async (reportData, reportType) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional report generator. Create well-structured, professional reports in markdown format.'
      },
      {
        role: 'user',
        content: `Generate a ${reportType} report based on this data: ${JSON.stringify(reportData)}`
      }
    ];

    return await chatCompletion(messages, { 
      maxTokens: 1000,
      model: 'gpt-3.5-turbo'
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// General AI assistant for construction/employee management
export const constructionAssistant = async (userMessage, context = {}) => {
  try {
    const systemPrompt = `You are an AI assistant specialized in construction project management and employee records. 
    You help with:
    - Employee management questions
    - Construction project insights
    - Safety recommendations
    - Performance analysis
    - HR best practices
    - Project timeline and progress analysis
    - Inspector coordination and compliance
    - Report analysis and trends
    
    Be professional, helpful, and focus on construction industry context.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // Add context if provided
    if (context.employeeData) {
      messages.splice(1, 0, {
        role: 'system',
        content: `Context - Current employee data: ${JSON.stringify(context.employeeData)}`
      });
    }

    if (context.projectData) {
      messages.splice(1, 0, {
        role: 'system',
        content: `Context - Current project data: ${JSON.stringify(context.projectData)}`
      });
    }

    return await chatCompletion(messages, { maxTokens: 500 });
  } catch (error) {
    console.error('Construction assistant error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Analyze project data and performance
export const analyzeProjectData = async (projectData, analysisType = 'summary') => {
  try {
    let prompt;
    
    switch (analysisType) {
      case 'timeline':
        prompt = `Analyze this construction project's timeline and schedule: ${JSON.stringify(projectData)}`;
        break;
      case 'location':
        prompt = `Analyze this project's location and logistical considerations: ${JSON.stringify(projectData)}`;
        break;
      case 'inspections':
        prompt = `Analyze the inspection schedule and compliance for this project: ${JSON.stringify(projectData)}`;
        break;
      case 'risks':
        prompt = `Identify potential risks and issues for this construction project: ${JSON.stringify(projectData)}`;
        break;
      case 'progress':
        prompt = `Analyze this project's progress based on contract days and reporting activity: ${JSON.stringify(projectData)}`;
        break;
      case 'summary':
      default:
        prompt = `Provide a comprehensive summary and analysis of this construction project: ${JSON.stringify(projectData)}`;
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a construction project analyst providing professional insights about project data. Focus on practical recommendations, timeline analysis, safety compliance, team coordination, and project tracking based on contract days and reporting patterns.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await chatCompletion(messages, { maxTokens: 400 });
  } catch (error) {
    console.error('Project analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Analyze project reports and trends
export const analyzeProjectReports = async (reportsData, projectInfo) => {
  try {
    const prompt = `Analyze these construction project reports and identify trends, issues, and recommendations:
    
    Project Info: ${JSON.stringify(projectInfo)}
    Reports: ${JSON.stringify(reportsData)}
    
    Focus on:
    - Work progress trends
    - Safety incidents or concerns
    - Quality issues
    - Timeline adherence
    - Resource utilization
    - Inspector feedback patterns`;

    const messages = [
      {
        role: 'system',
        content: 'You are a construction project analyst specializing in report analysis. Provide actionable insights based on project reports, focusing on trends, safety, quality, and progress tracking.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await chatCompletion(messages, { maxTokens: 600 });
  } catch (error) {
    console.error('Project reports analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate inspector recommendations
export const generateInspectorRecommendations = async (projectData, inspectionHistory) => {
  try {
    const prompt = `Based on this construction project data and inspection history, provide recommendations for inspector scheduling and compliance:
    
    Project: ${JSON.stringify(projectData)}
    Inspection History: ${JSON.stringify(inspectionHistory)}
    
    Provide recommendations for:
    - Optimal inspection frequency
    - Required inspector specializations
    - Compliance improvements
    - Risk mitigation strategies`;

    const messages = [
      {
        role: 'system',
        content: 'You are a construction compliance specialist. Provide practical recommendations for inspection scheduling, compliance management, and quality assurance based on project requirements and history.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await chatCompletion(messages, { maxTokens: 500 });
  } catch (error) {
    console.error('Inspector recommendations error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  chatCompletion,
  analyzeEmployeeData,
  generateReport,
  constructionAssistant,
  analyzeProjectData,
  analyzeProjectReports,
  generateInspectorRecommendations
};
