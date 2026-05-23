const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const responderSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true },
  password: { 
    type: String, 
    required: true 
},
  role: {
     type: String, 
     enum: ["admin", "responder"], 
     default: "responder" },
  organization: { 
    type: String 
},
  phone: { 
    type: String 
},
  isActive: { 
    type: Boolean, 
    default: true },
  lastLogin: Date,
}, { timestamps: true });


responderSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


responderSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = { Responder: mongoose.model("Responder", responderSchema) };
