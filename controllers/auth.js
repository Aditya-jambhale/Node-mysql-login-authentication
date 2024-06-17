const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE
});

const query = promisify(db.query).bind(db);

exports.register = async (req, res) => {
    try {
        const { name, email, password, passwordconfirm } = req.body;

        if (!name || !email || !password || !passwordconfirm) {
            return res.render('register', {
                message: "Please fill in all fields"
            });
        }

        const results = await query("SELECT Emailid FROM users WHERE Emailid = ?", [email]);

        if (results.length > 0) {
            return res.render('register', {
                message: "Email is already registered"
            });
        } else if (password !== passwordconfirm) {
            return res.render('register', {
                message: "Passwords do not match"
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        await query('INSERT INTO users SET ?', { Name: name, Emailid: email, Password: hashedPassword });
        return res.render('register', {
            message: "User registered"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).render('register', {
            message: "An error occurred. Please try again later."
        });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).render('login', {
                message: "Please provide an email and password"
            });
        }

        const results = await query('SELECT * FROM users WHERE Emailid = ?', [email]);

        if (!results.length || !(await bcrypt.compare(password, results[0].Password))) {
            return res.status(401).render('login', {
                message: 'Email or Password is incorrect'
            });
        } else {
            const id = results[0].id;
            const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });

            console.log("The token is " + token);

            const cookieOptions = {
                expires: new Date(
                    Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                ),
                httpOnly: true
            };
            res.cookie('userSave', token, cookieOptions);
            res.status(200).redirect("/");
        }
    } catch (error) {
        console.log(error);
        return res.status(500).render('login', {
            message: "An error occurred. Please try again later."
        });
    }
}

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.userSave) {
        try {
            // 1. Verify the token
            const decoded = await promisify(jwt.verify)(req.cookies.userSave, process.env.JWT_SECRET);
            console.log(decoded);

            // 2. Check if the user still exists
            const results = await query('SELECT * FROM users WHERE id = ?', [decoded.id]);
            console.log(results);
            if (!results.length) {
                return next();
            }

            req.user = results[0];
            return next();
        } catch (err) {
            console.log(err);
            return next();
        }
    } else {
        next();
    }
}

exports.logout = (req, res) => {
    res.cookie('userSave', 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect("/");
}
