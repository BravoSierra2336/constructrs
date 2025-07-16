import dotenv from 'dotenv';
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5050;

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});