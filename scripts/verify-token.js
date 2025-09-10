const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function verifyToken() {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZlaWE0bm0wMDAwdTZ1bnhrYXV5d2szIiwiaWF0IjoxNzU3NTQwNjg0LCJleHAiOjE3NTgxNDU0ODR9.z5YeCw0qJJg3gXSa_K0LCpjHlKua_c2_phKWcVvwvdU";
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token is valid:", decoded);
  } catch (error) {
    console.log("Token verification failed:", error.message);
  }
}

verifyToken();
