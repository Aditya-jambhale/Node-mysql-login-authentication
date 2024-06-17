const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const helmet = require("helmet");
const mysql = require('mysql');
const cookieParser = require("cookie-parser");

// Load environment variables from .env file
dotenv.config({ path: './.env' });

if (!process.env.DATABASE_HOST || !process.env.DATABASE_USER || !process.env.DATABASE_PASS || !process.env.DATABASE) {
    console.error("Missing required environment variables. Please check your .env file.");
    process.exit(1);
}

const app = express();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE
});

db.connect((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("MySQL connected...");
    }
});

// Middleware
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static files
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

// Set view engine
app.set('view engine', 'hbs');

// Define routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
});
