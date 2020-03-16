const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = (req, res, next) => {
    // Get token from header
    const token = req.header("x-auth-token");
    // console.log(token);
    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    //Verify token
    try {
        const decoded = jwt.verify(token, config.get("jwtSecret"));
        // console.log("decoded (jwt.verify)=", decoded);
        // console.log("req.user initially =", req.user);
        req.user = decoded.user;
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token is not valid" });
    }
};
