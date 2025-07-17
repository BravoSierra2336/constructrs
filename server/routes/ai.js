import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  chatCompletion, 
  analyzeEmployeeData, 
  generateReport, 
  constructionAssistant,
  analyzeProjectData,
  analyzeProjectReports,
  generateInspectorRecommendations
} from '../services/openai.js';
import User from '../models/user.js';
import Project from '../models/project.js';

const router = express.Router();

// General AI chat endpoint - requires authentication
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add user context for personalized responses
    const userContext = {
      userId: req.user.id,
      isAdmin: req.user.isAdmin,
      firstName: req.user.firstName,
      ...context
    };

    const response = await constructionAssistant(message, userContext);

    if (!response.success) {
      return res.status(500).json({ error: 'AI service error', details: response.error });
    }

    res.json({
      message: response.data,
      usage: response.usage
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analyze employee data - admin only or self
router.post('/analyze-employee/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { analysisType = 'summary' } = req.body;

    // Check if user can access this employee data
    const isAdmin = req.user.isAdmin;
    const isOwnData = id === req.user.id;

    if (!isAdmin && !isOwnData) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get employee data
    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Remove sensitive data before analysis
    const safeEmployeeData = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      jobName: employee.jobName,
      isAdmin: employee.isAdmin,
      createdAt: employee.createdAt
    };

    const analysis = await analyzeEmployeeData(safeEmployeeData, analysisType);

    if (!analysis.success) {
      return res.status(500).json({ error: 'Analysis failed', details: analysis.error });
    }

    res.json({
      employeeId: id,
      analysisType,
      analysis: analysis.data,
      usage: analysis.usage
    });

  } catch (error) {
    console.error('Employee analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate reports - admin only
router.post('/generate-report', requireAdmin, async (req, res) => {
  try {
    const { reportType, data } = req.body;

    if (!reportType || !data) {
      return res.status(400).json({ error: 'Report type and data are required' });
    }

    const report = await generateReport(data, reportType);

    if (!report.success) {
      return res.status(500).json({ error: 'Report generation failed', details: report.error });
    }

    res.json({
      reportType,
      report: report.data,
      generatedBy: req.user.id,
      generatedAt: new Date(),
      usage: report.usage
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI suggestions for employee management - admin only
router.post('/employee-suggestions', requireAdmin, async (req, res) => {
  try {
    // Get all employees for analysis
    const employees = await User.find({}, {
      firstName: 1,
      lastName: 1,
      email: 1,
      jobName: 1,
      isAdmin: 1,
      createdAt: 1
    });

    const suggestions = await constructionAssistant(
      'Based on this employee data, provide suggestions for team optimization, training needs, and management improvements.',
      { employeeData: employees }
    );

    if (!suggestions.success) {
      return res.status(500).json({ error: 'Suggestions generation failed', details: suggestions.error });
    }

    res.json({
      suggestions: suggestions.data,
      employeeCount: employees.length,
      generatedAt: new Date(),
      usage: suggestions.usage
    });

  } catch (error) {
    console.error('Employee suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI help for construction safety
router.post('/safety-advice', authenticateToken, async (req, res) => {
  try {
    const { situation, jobType } = req.body;

    if (!situation) {
      return res.status(400).json({ error: 'Situation description is required' });
    }

    const prompt = `Provide safety advice for this construction situation: ${situation}. Job type: ${jobType || 'general construction'}`;
    
    const advice = await constructionAssistant(prompt);

    if (!advice.success) {
      return res.status(500).json({ error: 'Safety advice generation failed', details: advice.error });
    }

    res.json({
      situation,
      jobType,
      advice: advice.data,
      requestedBy: req.user.id,
      usage: advice.usage
    });

  } catch (error) {
    console.error('Safety advice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analyze project performance and insights
router.post('/analyze-project/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { analysisType = 'summary' } = req.body;

    // Get project data with reports
    const project = await Project.findByIdWithReports(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has access to this project (admin, project manager, or assigned employee)
    const isAdmin = req.user.isAdmin;
    const isProjectManager = project.projectManager && project.projectManager.toString() === req.user.id;
    const isAssignedEmployee = project.assignedEmployees.some(empId => empId.toString() === req.user.id);

    if (!isAdmin && !isProjectManager && !isAssignedEmployee) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Prepare safe project data for analysis
    const safeProjectData = {
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      location: project.location,
      clientName: project.clientName,
      lastWorkingDay: project.lastWorkingDay,
      contractDay: project.contractDay,
      inspectors: project.inspectors,
      totalReports: project.reportsData ? project.reportsData.length : 0,
      daysSinceLastWork: project.lastWorkingDay ? Math.ceil((new Date() - new Date(project.lastWorkingDay)) / (1000 * 60 * 60 * 24)) : null
    };

    const analysis = await analyzeProjectData(safeProjectData, analysisType);

    if (!analysis.success) {
      return res.status(500).json({ error: 'Project analysis failed', details: analysis.error });
    }

    res.json({
      projectId: id,
      projectName: project.name,
      analysisType,
      analysis: analysis.data,
      usage: analysis.usage,
      analyzedBy: req.user.id
    });

  } catch (error) {
    console.error('Project analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analyze project reports and trends
router.post('/analyze-project-reports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reportLimit = 10 } = req.body;

    // Get project with reports
    const project = await Project.findByIdWithReports(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access permissions
    const isAdmin = req.user.isAdmin;
    const isProjectManager = project.projectManager && project.projectManager.toString() === req.user.id;
    const isAssignedEmployee = project.assignedEmployees.some(empId => empId.toString() === req.user.id);

    if (!isAdmin && !isProjectManager && !isAssignedEmployee) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    if (!project.reportsData || project.reportsData.length === 0) {
      return res.status(400).json({ error: 'No reports found for this project' });
    }

    // Limit reports for analysis (most recent ones)
    const recentReports = project.reportsData.slice(0, reportLimit);

    // Prepare safe data for analysis
    const safeProjectInfo = {
      name: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      contractDay: project.contractDay,
      lastWorkingDay: project.lastWorkingDay
    };

    const safeReportsData = recentReports.map(report => ({
      date: report.createdAt,
      type: report.type || 'general',
      summary: report.summary || report.description,
      status: report.status
    }));

    const analysis = await analyzeProjectReports(safeReportsData, safeProjectInfo);

    if (!analysis.success) {
      return res.status(500).json({ error: 'Reports analysis failed', details: analysis.error });
    }

    res.json({
      projectId: id,
      projectName: project.name,
      reportsAnalyzed: recentReports.length,
      totalReports: project.reportsData.length,
      analysis: analysis.data,
      usage: analysis.usage,
      analyzedBy: req.user.id
    });

  } catch (error) {
    console.error('Project reports analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate inspector recommendations for project
router.post('/inspector-recommendations/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByIdWithReports(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Prepare project data for analysis
    const projectData = {
      name: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      contractDay: project.contractDay,
      location: project.location,
      inspectors: project.inspectors,
      lastWorkingDay: project.lastWorkingDay
    };

    // Get inspection history from reports
    const inspectionHistory = project.reportsData ? project.reportsData.filter(report => 
      report.type === 'inspection' || report.category === 'inspection'
    ).map(report => ({
      date: report.createdAt,
      inspector: report.inspector || 'Unknown',
      findings: report.findings || report.summary,
      status: report.status
    })) : [];

    const recommendations = await generateInspectorRecommendations(projectData, inspectionHistory);

    if (!recommendations.success) {
      return res.status(500).json({ error: 'Inspector recommendations failed', details: recommendations.error });
    }

    res.json({
      projectId: id,
      projectName: project.name,
      currentInspectors: project.inspectors.length,
      activeInspectors: project.inspectors.filter(i => i.isActive).length,
      inspectionHistory: inspectionHistory.length,
      recommendations: recommendations.data,
      usage: recommendations.usage,
      generatedBy: req.user.id
    });

  } catch (error) {
    console.error('Inspector recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
