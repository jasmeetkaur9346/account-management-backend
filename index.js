const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const connectDB = require("./config/db")

// Import Routes
const routes = require('./routes/index')

connectDB();

const app = express()

const allowedOrigins = [
    'https://account-management-frontend-ten.vercel.app',
    process.env.FORNTEND_URL, // आपके .env से
    'http://localhost:3000' // लोकल डेवलपमेंट के लिए
  ];
  app.use(cors({
    origin: function(origin, callback) {
      // मोबाइल ऐप्स या नो-ओरिजिन रिक्वेस्ट्स के लिए अनुमति दें
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Origin not allowed by CORS:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
  }));
  

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', routes);
// Health Check Route
app.get('/', (req, res) => {
  res.json({
    message: "Server is running successfully! 🚀",
    success: true
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));