const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: String,
  text: String,
});

module.exports = mongoose.model('Message', messageSchema);
