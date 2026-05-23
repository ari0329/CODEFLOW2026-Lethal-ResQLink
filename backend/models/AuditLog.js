const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true },
  userName: { 
    type: String, 
    required: true },
  role: { 
    type: String, 
    required: true },
  action: { 
    type: String, 
    required: true }, 
  targetId: { 
    type: String 
},
  targetType: { 
    type: String
 }, 
  ipAddress: { 
    type: String },
  details: { 
    type: String
 }, 
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);
