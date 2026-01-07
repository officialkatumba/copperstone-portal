// server.js
// require("dotenv").config(); // Load environment variables first
// const app = require("./app"); // Import the Express app

// const PORT = process.env.PORT || 8000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });

// server.js
// require("dotenv").config();
// console.log("🔧 Environment loaded. PORT:", process.env.PORT);

// const app = require("./app");

// const PORT = process.env.PORT || 3000;
// console.log("🔧 Starting server on port:", PORT);

// const server = app.listen(PORT, "localhost", (err) => {
//   if (err) {
//     console.error("❌ Failed to start server:", err);
//     process.exit(1);
//   }
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log("✅ Server is listening...");
// });

// // 🟢 Verify server is listening
// setTimeout(() => {
//   console.log("🔍 Server address:", server.address());
// }, 100);

// server.js
// require("dotenv").config();
// const app = require("./app");

// const PORT = process.env.PORT || 3000;

// // 🟢 CHANGE THIS LINE - Use '127.0.0.1' instead of default
// app.listen(PORT, "127.0.0.1", () => {
//   console.log(`✅ Server running at http://127.0.0.1:${PORT}`);
// });

// server.js
// require("dotenv").config();
// const app = require("./app");

// const PORT = process.env.PORT || 8000; // Keep 8000 as you prefer

// app.listen(PORT, "127.0.0.1", () => {
//   console.log(`✅ Server running at http://127.0.0.1:${PORT}`);
//   console.log(`🌐 Also accessible as http://localhost:${PORT}`);
// });

// backend/server.js

// Load env vars ONLY in local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("======================================");
  console.log("🚀 SERVER STARTED SUCCESSFULLY");
  console.log("🌍 Environment:", process.env.NODE_ENV);
  console.log("🔌 Listening on port:", PORT);
  console.log("======================================");
});
