const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connectDB = async () => {
    try {
        const response = await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("Shit happened!", error);
        // exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
