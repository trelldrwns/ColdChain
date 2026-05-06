const mongoose = require('mongoose');

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Mongoose Schema for Events/Excursions
const eventSchema = new mongoose.Schema({
  sensor_serial: { type: String, required: true, index: true },
  shipment_id: { type: String, required: true, index: true },
  event_type: { type: String, required: true }, // e.g., 'soft_excursion', 'hard_excursion'
  temperature: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  resolved: { type: Boolean, default: false }
});

const EventLog = mongoose.model('EventLog', eventSchema);

module.exports = { connectMongo, EventLog };
