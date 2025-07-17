# OpenAI Integration Test Examples

## Available AI Endpoints

### 1. General AI Chat
**POST** `/ai/chat`
- Requires: JWT token
- Body: `{ "message": "Your question about construction or employees" }`

### 2. Employee Analysis  
**POST** `/ai/analyze-employee/:id`
- Requires: JWT token (admin or self)
- Body: `{ "analysisType": "summary|performance|recommendations" }`

### 3. Generate Reports
**POST** `/ai/generate-report`
- Requires: Admin JWT token
- Body: `{ "reportType": "monthly|performance|safety", "data": {...} }`

### 4. Employee Management Suggestions
**POST** `/ai/employee-suggestions`
- Requires: Admin JWT token
- No body required

### 5. Construction Safety Advice
**POST** `/ai/safety-advice`
- Requires: JWT token
- Body: `{ "situation": "Describe safety situation", "jobType": "concrete|electrical|roofing" }`

### 6. Project Analysis
**POST** `/ai/analyze-project/:id`
- Requires: JWT token (admin, project manager, or assigned employee)
- Body: `{ "analysisType": "summary|progress|budget|timeline|inspections|risks" }`

### 7. Project Reports Analysis
**POST** `/ai/analyze-project-reports/:id`
- Requires: JWT token (admin, project manager, or assigned employee)
- Body: `{ "reportLimit": 10 }` (optional)

### 8. Inspector Recommendations
**POST** `/ai/inspector-recommendations/:id`
- Requires: Admin JWT token
- No body required

## Example Usage (with curl or frontend)

```javascript
// Frontend example - AI Chat
const response = await fetch('/ai/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What are the safety requirements for roofing work?"
  })
});

// Frontend example - Safety Advice
const safetyResponse = await fetch('/ai/safety-advice', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    situation: "Working on a steep roof in windy conditions",
    jobType: "roofing"
  })
});

// Frontend example - Project Analysis
const projectAnalysis = await fetch('/ai/analyze-project/64f8a9b2c1234567890abcde', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    analysisType: "progress"
  })
});

// Frontend example - Inspector Recommendations (Admin only)
const inspectorRecs = await fetch('/ai/inspector-recommendations/64f8a9b2c1234567890abcde', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});
```

## Features:
- ✅ Secure API key storage in backend
- ✅ JWT authentication for all AI endpoints  
- ✅ Role-based access (admin vs regular users)
- ✅ Construction industry specialized responses
- ✅ Employee data analysis with privacy protection
- ✅ Safety advice and recommendations
- ✅ Report generation capabilities
- ✅ Usage tracking for cost monitoring

## Project Features:
- ✅ **Inspector Management**: Add/remove inspectors with specializations
- ✅ **Last Working Day Tracking**: Automatically updated from reports
- ✅ **Reports Integration**: Link reports to projects with full data access
- ✅ **Project Analysis**: AI-powered insights on progress, budget, timeline
- ✅ **Reports Trend Analysis**: Identify patterns and issues from reports
- ✅ **Inspector Recommendations**: AI suggestions for optimal inspection scheduling
- ✅ **Activity Summaries**: Days since last work, report counts, inspector status

## Inspector Object Structure:
```javascript
{
  id: ObjectId,
  name: "Inspector Name",
  company: "Inspection Company",
  phone: "555-0123",
  email: "inspector@company.com",
  specialization: "safety|quality|structural|electrical|plumbing",
  certifications: ["OSHA 30", "Quality Control"],
  addedDate: Date,
  isActive: true
}
```
