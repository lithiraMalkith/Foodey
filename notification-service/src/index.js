const express = require('express');
const dotenv = require('dotenv'); 
const cors = require('cors'); 
const notificationRoutes = require('./routes/notification');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));