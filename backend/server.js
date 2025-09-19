// server.js
require("dotenv").config(); // Load environment variables first
const app = require("./app"); // Import the Express app

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
