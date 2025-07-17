// Load environment configuration first
import './config/env.js';

// Now import the app
import app from "./app.js";

const PORT = process.env.PORT || 5050;

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});