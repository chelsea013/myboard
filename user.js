
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userid: { type: String, unique: true },
  userpw: String,
  usergroup: String,
  useremail: String,
  friends: [{ type: String }],
});

module.exports = mongoose.model('User', userSchema);
