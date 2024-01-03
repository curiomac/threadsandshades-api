const express = require('express');
const app = express();
const errorMiddleware = require('./middlewares/error')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const auth = require('./routes/auth');
const theme = require('./routes/theme');
const vehicle = require('./routes/vehicle');

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname,'uploads')));
app.use('/api/v1/', auth);
app.use('/api/v1/', theme);
app.use('/api/v1/', vehicle);

app.use(errorMiddleware)

module.exports = app;