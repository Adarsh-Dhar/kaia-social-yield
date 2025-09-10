const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function createTestToken() {
  const payload = { userId: "cmfeia4nm0000u6unxkauywk3" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  console.log("Test token:", token);
  return token;
}

createTestToken();
