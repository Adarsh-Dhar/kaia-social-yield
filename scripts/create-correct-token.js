const jwt = require('jsonwebtoken');

const JWT_SECRET = "local-dev-secret"; // The actual secret used by the server

function createTestToken() {
  const payload = { userId: "cmfeia4nm0000u6unxkauywk3" };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  console.log("Correct test token:", token);
  return token;
}

createTestToken();
