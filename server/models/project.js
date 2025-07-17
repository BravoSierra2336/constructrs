import { ObjectId } from "mongodb";
import db from "../db/connection.js";

class Project {
  constructor(projectData) {
    this.name = projectData.name;
    this.description = projectData.description || "";
    this.startDate = projectData.startDate ? new Date(projectData.startDate) : new Date();
    this.endDate = projectData.endDate ? new Date(projectData.endDate) : null;
    this.location = projectData.location || "";
    this.clientName = projectData.clientName || "";
    this.projectManager = projectData.projectManager; // User ID reference
    this.assignedEmployees = projectData.assignedEmployees || []; // Array of User IDs
    this.inspectors = projectData.inspectors || []; // Array of inspector objects with details
    this.lastWorkingDay = projectData.lastWorkingDay || null; // Date of last report/activity
    this.reports = projectData.reports || []; // Array of report IDs related to this project
    this.createdAt = new Date();
    this.updatedAt = new Date();
    // Number of days since startDate (contractDay)
    this.contractDay = Math.floor((new Date() - this.startDate) / (1000 * 60 * 60 * 24));
  }

  // Validation method
  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push("Project name is required");
    }

    if (this.name && this.name.length > 100) {
      errors.push("Project name must be 100 characters or less");
    }

    if (this.endDate && this.startDate && this.endDate < this.startDate) {
      errors.push("End date cannot be before start date");
    }

    return errors;
  }

  // Save project to database
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    try {
      const collection = db.collection("projects");
      const result = await collection.insertOne(this);
      this._id = result.insertedId;
      return this;
    } catch (error) {
      throw new Error(`Error saving project: ${error.message}`);
    }
  }

  // Update project
  async update(updateData) {
    try {
      // Update the instance with new data
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== '_id') {
          this[key] = updateData[key];
        }
      });

      this.updatedAt = new Date();

      const errors = this.validate();
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join(", ")}`);
      }

      const collection = db.collection("projects");
      const result = await collection.updateOne(
        { _id: this._id },
        { $set: this }
      );

      if (result.matchedCount === 0) {
        throw new Error("Project not found");
      }

      return this;
    } catch (error) {
      throw new Error(`Error updating project: ${error.message}`);
    }
  }

  // Static methods for database operations
  static async findAll(filter = {}, options = {}) {
    try {
      const collection = db.collection("projects");
      const projects = await collection.find(filter, options).toArray();
      return projects;
    } catch (error) {
      throw new Error(`Error fetching projects: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error("Invalid project ID");
      }

      const collection = db.collection("projects");
      const project = await collection.findOne({ _id: new ObjectId(id) });
      return project;
    } catch (error) {
      throw new Error(`Error fetching project: ${error.message}`);
    }
  }

  static async findByProjectManager(managerId) {
    try {
      if (!ObjectId.isValid(managerId)) {
        throw new Error("Invalid manager ID");
      }

      const collection = db.collection("projects");
      const projects = await collection.find({ 
        projectManager: new ObjectId(managerId) 
      }).toArray();
      return projects;
    } catch (error) {
      throw new Error(`Error fetching projects by manager: ${error.message}`);
    }
  }

  static async findByEmployee(employeeId) {
    try {
      if (!ObjectId.isValid(employeeId)) {
        throw new Error("Invalid employee ID");
      }

      const collection = db.collection("projects");
      const projects = await collection.find({ 
        assignedEmployees: new ObjectId(employeeId) 
      }).toArray();
      return projects;
    } catch (error) {
      throw new Error(`Error fetching projects by employee: ${error.message}`);
    }
  }

  static async findByLocation(location) {
    try {
      const collection = db.collection("projects");
      const projects = await collection.find({ location }).toArray();
      return projects;
    } catch (error) {
      throw new Error(`Error fetching projects by location: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error("Invalid project ID");
      }

      const collection = db.collection("projects");
      const result = await collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        throw new Error("Project not found");
      }

      return { success: true, message: "Project deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting project: ${error.message}`);
    }
  }

  // Helper methods
  static async getProjectStats() {
    try {
      const collection = db.collection("projects");
      
      const totalProjects = await collection.countDocuments();
      const projectsByLocation = await collection.aggregate([
        {
          $group: {
            _id: "$location",
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      return {
        totalProjects,
        projectsByLocation
      };
    } catch (error) {
      throw new Error(`Error getting project stats: ${error.message}`);
    }
  }

  // Add employee to project
  async addEmployee(employeeId) {
    try {
      if (!ObjectId.isValid(employeeId)) {
        throw new Error("Invalid employee ID");
      }

      const employeeObjectId = new ObjectId(employeeId);
      
      if (!this.assignedEmployees.some(id => id.equals(employeeObjectId))) {
        this.assignedEmployees.push(employeeObjectId);
        this.updatedAt = new Date();

        const collection = db.collection("projects");
        await collection.updateOne(
          { _id: this._id },
          { 
            $addToSet: { assignedEmployees: employeeObjectId },
            $set: { updatedAt: this.updatedAt }
          }
        );
      }

      return this;
    } catch (error) {
      throw new Error(`Error adding employee to project: ${error.message}`);
    }
  }

  // Remove employee from project
  async removeEmployee(employeeId) {
    try {
      if (!ObjectId.isValid(employeeId)) {
        throw new Error("Invalid employee ID");
      }

      const employeeObjectId = new ObjectId(employeeId);
      this.assignedEmployees = this.assignedEmployees.filter(id => !id.equals(employeeObjectId));
      this.updatedAt = new Date();

      const collection = db.collection("projects");
      await collection.updateOne(
        { _id: this._id },
        { 
          $pull: { assignedEmployees: employeeObjectId },
          $set: { updatedAt: this.updatedAt }
        }
      );

      return this;
    } catch (error) {
      throw new Error(`Error removing employee from project: ${error.message}`);
    }
  }

  // Update contract day calculation
  updateContractDay() {
    this.contractDay = Math.floor((new Date() - this.startDate) / (1000 * 60 * 60 * 24));
    this.updatedAt = new Date();
  }

  // Add inspector to project
  async addInspector(inspectorData) {
    try {
      const inspector = {
        id: new ObjectId(),
        name: inspectorData.name,
        company: inspectorData.company || "",
        phone: inspectorData.phone || "",
        email: inspectorData.email || "",
        specialization: inspectorData.specialization || "", // safety, quality, structural, etc.
        certifications: inspectorData.certifications || [],
        addedDate: new Date(),
        isActive: inspectorData.isActive !== undefined ? inspectorData.isActive : true
      };

      // Validate required fields
      if (!inspector.name) {
        throw new Error("Inspector name is required");
      }

      this.inspectors.push(inspector);
      this.updatedAt = new Date();

      const collection = db.collection("projects");
      await collection.updateOne(
        { _id: this._id },
        { 
          $push: { inspectors: inspector },
          $set: { updatedAt: this.updatedAt }
        }
      );

      return inspector;
    } catch (error) {
      throw new Error(`Error adding inspector: ${error.message}`);
    }
  }

  // Remove inspector from project
  async removeInspector(inspectorId) {
    try {
      if (!ObjectId.isValid(inspectorId)) {
        throw new Error("Invalid inspector ID");
      }

      this.inspectors = this.inspectors.filter(inspector => 
        !inspector.id.equals(new ObjectId(inspectorId))
      );
      this.updatedAt = new Date();

      const collection = db.collection("projects");
      await collection.updateOne(
        { _id: this._id },
        { 
          $pull: { inspectors: { id: new ObjectId(inspectorId) } },
          $set: { updatedAt: this.updatedAt }
        }
      );

      return this;
    } catch (error) {
      throw new Error(`Error removing inspector: ${error.message}`);
    }
  }

  // Update inspector status (active/inactive)
  async updateInspectorStatus(inspectorId, isActive) {
    try {
      if (!ObjectId.isValid(inspectorId)) {
        throw new Error("Invalid inspector ID");
      }

      const inspectorIndex = this.inspectors.findIndex(inspector => 
        inspector.id.equals(new ObjectId(inspectorId))
      );

      if (inspectorIndex === -1) {
        throw new Error("Inspector not found");
      }

      this.inspectors[inspectorIndex].isActive = isActive;
      this.updatedAt = new Date();

      const collection = db.collection("projects");
      await collection.updateOne(
        { _id: this._id, "inspectors.id": new ObjectId(inspectorId) },
        { 
          $set: { 
            "inspectors.$.isActive": isActive,
            updatedAt: this.updatedAt
          }
        }
      );

      return this;
    } catch (error) {
      throw new Error(`Error updating inspector status: ${error.message}`);
    }
  }

  // Add report to project and update last working day
  async addReport(reportId, reportDate = new Date()) {
    try {
      if (!ObjectId.isValid(reportId)) {
        throw new Error("Invalid report ID");
      }

      const reportObjectId = new ObjectId(reportId);
      
      // Add report if not already exists
      if (!this.reports.some(id => id.equals(reportObjectId))) {
        this.reports.push(reportObjectId);
      }

      // Update last working day if this report is more recent
      const reportDateObj = new Date(reportDate);
      if (!this.lastWorkingDay || reportDateObj > this.lastWorkingDay) {
        this.lastWorkingDay = reportDateObj;
      }

      this.updatedAt = new Date();

      const collection = db.collection("projects");
      await collection.updateOne(
        { _id: this._id },
        { 
          $addToSet: { reports: reportObjectId },
          $set: { 
            lastWorkingDay: this.lastWorkingDay,
            updatedAt: this.updatedAt
          }
        }
      );

      return this;
    } catch (error) {
      throw new Error(`Error adding report to project: ${error.message}`);
    }
  }

  // Remove report from project and recalculate last working day
  async removeReport(reportId) {
    try {
      if (!ObjectId.isValid(reportId)) {
        throw new Error("Invalid report ID");
      }

      const reportObjectId = new ObjectId(reportId);
      this.reports = this.reports.filter(id => !id.equals(reportObjectId));

      // Recalculate last working day from remaining reports
      if (this.reports.length > 0) {
        const reportsCollection = db.collection("reports");
        const remainingReports = await reportsCollection.find({
          _id: { $in: this.reports }
        }).sort({ createdAt: -1 }).limit(1).toArray();

        this.lastWorkingDay = remainingReports.length > 0 ? remainingReports[0].createdAt : null;
      } else {
        this.lastWorkingDay = null;
      }

      this.updatedAt = new Date();

      const collection = db.collection("projects");
      await collection.updateOne(
        { _id: this._id },
        { 
          $pull: { reports: reportObjectId },
          $set: { 
            lastWorkingDay: this.lastWorkingDay,
            updatedAt: this.updatedAt
          }
        }
      );

      return this;
    } catch (error) {
      throw new Error(`Error removing report from project: ${error.message}`);
    }
  }

  // Get project with populated reports data
  static async findByIdWithReports(id) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new Error("Invalid project ID");
      }

      const collection = db.collection("projects");
      const reportsCollection = db.collection("reports");

      const project = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!project) {
        return null;
      }

      // Get all reports for this project
      if (project.reports && project.reports.length > 0) {
        project.reportsData = await reportsCollection.find({
          _id: { $in: project.reports }
        }).sort({ createdAt: -1 }).toArray();
      } else {
        project.reportsData = [];
      }

      return project;
    } catch (error) {
      throw new Error(`Error fetching project with reports: ${error.message}`);
    }
  }

  // Get projects with their latest report information
  static async findAllWithLatestReports(filter = {}) {
    try {
      const collection = db.collection("projects");
      
      const projects = await collection.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "reports",
            localField: "reports",
            foreignField: "_id",
            as: "reportsData"
          }
        },
        {
          $addFields: {
            latestReport: { $arrayElemAt: [{ $sortArray: { input: "$reportsData", sortBy: { createdAt: -1 } } }, 0] },
            totalReports: { $size: "$reportsData" }
          }
        },
        {
          $sort: { updatedAt: -1 }
        }
      ]).toArray();

      return projects;
    } catch (error) {
      throw new Error(`Error fetching projects with reports: ${error.message}`);
    }
  }

  // Get active inspectors for the project
  getActiveInspectors() {
    return this.inspectors.filter(inspector => inspector.isActive);
  }

  // Get inspectors by specialization
  getInspectorsBySpecialization(specialization) {
    return this.inspectors.filter(inspector => 
      inspector.isActive && 
      inspector.specialization.toLowerCase() === specialization.toLowerCase()
    );
  }

  // Calculate days since last work
  getDaysSinceLastWork() {
    if (!this.lastWorkingDay) {
      return null;
    }

    const now = new Date();
    const lastWork = new Date(this.lastWorkingDay);
    const diffTime = Math.abs(now - lastWork);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get project activity summary
  async getActivitySummary() {
    try {
      const reportsCollection = db.collection("reports");
      
      const summary = await reportsCollection.aggregate([
        { $match: { _id: { $in: this.reports } } },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            firstReport: { $min: "$createdAt" },
            lastReport: { $max: "$createdAt" },
            avgReportsPerWeek: { $avg: 1 } // This would need more complex calculation
          }
        }
      ]).toArray();

      return {
        totalReports: summary[0]?.totalReports || 0,
        firstReportDate: summary[0]?.firstReport || null,
        lastReportDate: summary[0]?.lastReport || null,
        daysSinceLastWork: this.getDaysSinceLastWork(),
        activeInspectors: this.getActiveInspectors().length,
        totalInspectors: this.inspectors.length
      };
    } catch (error) {
      throw new Error(`Error getting activity summary: ${error.message}`);
    }
  }
}

export default Project;
