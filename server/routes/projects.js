import express from "express";
import Project from "../models/project.js";
import { 
  authenticateToken, 
  canManageProjects, 
  canAssignProjects, 
  canUpdateProjects, 
  canDeleteProjects,
  requirePermission 
} from "../middleware/auth.js";

const router = express.Router();

// GET /api/projects - List projects (all authenticated users can view)
router.get("/", authenticateToken, requirePermission("project:read"), async (req, res) => {
  try {
    const projects = await Project.getAll();
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST /api/projects - Create new project (project managers and admins only)
router.post("/", authenticateToken, canManageProjects, async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user.id,
      createdAt: new Date()
    };

    const project = new Project(projectData);
    const validation = project.validate();
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    const result = await project.save();
    
    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: result
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// PUT /api/projects/:id - Update project
router.put("/:id", authenticateToken, canUpdateProjects, async (req, res) => {
  try {
    const projectId = req.params.id;
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: req.user.id
    };

    const result = await Project.updateById(projectId, updateData);
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      success: true,
      message: "Project updated successfully"
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// PUT /api/projects/:id/assign - Assign inspectors to project
router.put("/:id/assign", authenticateToken, canAssignProjects, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { inspectors } = req.body;

    if (!inspectors || !Array.isArray(inspectors)) {
      return res.status(400).json({ error: "Inspectors array is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Assign inspectors to project
    const result = await project.assignInspectors(inspectors);
    
    res.json({
      success: true,
      message: "Inspectors assigned successfully",
      data: result
    });
  } catch (error) {
    console.error("Error assigning inspectors:", error);
    res.status(500).json({ error: "Failed to assign inspectors" });
  }
});

// DELETE /api/projects/:id - Delete project (admins and project managers only)
router.delete("/:id", authenticateToken, canDeleteProjects, async (req, res) => {
  try {
    const projectId = req.params.id;
    
    const result = await Project.deleteById(projectId);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// GET /api/projects/my-projects - Get projects assigned to current user
router.get("/my-projects", authenticateToken, requirePermission("project:read"), async (req, res) => {
  try {
    const projects = await Project.getByInspector(req.user.id);
    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

export default router;
