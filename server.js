require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const PORT = process.env.PORT || 3500;

// Connect to MongoDB
connectDB();

mongoose.connection.once('open', () => {
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
  
  // Start server only after successful DB connection
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

// Middleware
app.use(logger); // custom logger
app.use(cors(corsOptions)); // CORS config
app.use(express.urlencoded({ extended: false })); // for form data
app.use(express.json()); // for JSON
app.use('/', express.static(path.join(__dirname, '/public'))); // static files

// Routes
app.use('/states', require('./routes/api/states'));

// Root route (GET /)
app.get('^/$|/index(.html)?', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Catch-all 404 handler
app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: "404 Not Found" });
  } else {
    res.type('txt').send("404 Not Found");
  }
});

// Global error handler
app.use(errorHandler);
