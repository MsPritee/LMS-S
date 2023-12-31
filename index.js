process.on("uncaughtException", () => {
    console.log("uncaughtExceptionError")
})

import express from "express"
import dbConnection from "./database/dbConnection.js";
import userRouter from "./src/modules/User/user.router.js";
import bookRouter from "./src/modules/Book/book.router.js";
import * as dotenv from 'dotenv'
import cors from 'cors'
import { AppError } from "./src/utils/AppError.js";
import { globalErrorHandling } from "./src/utils/globalErrorHandling.js";

dotenv.config()

const app = express();
const port = 5000;

app.use(cors())
app.use(express.json());
app.use(express.static('uploads'))

dbConnection()


// const Registration = require('./database/models/Registration.js');
app.use('/user', userRouter)
app.use('/book', bookRouter)

app.all('*', (req, res, next) => {
    next(new AppError("Invalid url. Page not found", 404))
})



// app.use(cors({
//     origin: "*"
// }));




app.get('/book', async (req, res) => {
    try {
        const books = await Book.find({}, 'title author thumbnailURL');

        res.json({ books }); 
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// protected route
app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'You have access to this protected route!', user: req.user });
});




// middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.user = user;
        next();
    });
}


app.use(globalErrorHandling)

app.listen(process.env.PORT || port, () => {
    console.log(`Server is running on port: ${process.env.PORT} .......`)
})



process.on('unhandledRejection', () => {
    console.log("unhandledRejectionError")
})