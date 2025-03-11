const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"]; // Get token from headers

  if (!token) {
    console.log("no token");
    return res
      .status(401)
      .json({ success: false, message: "Access Denied: No token provided" });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    req.user = decoded; // Attach decoded user info to `req`
    next(); // Proceed to the next middleware or route
  });
};

module.exports = verifyJWT;
