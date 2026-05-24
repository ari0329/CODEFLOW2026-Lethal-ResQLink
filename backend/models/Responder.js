"use strict";
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true, maxlength: 100 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, select: false },
  role:         { type: String, enum: ["admin","responder","ngo","analyst","public"], default: "public" },
  organization: { type: String, trim: true },
  badgeId:      { type: String, trim: true },
  phone:        { type: String, trim: true },
  isActive:     { type: Boolean, default: true },
  isVerified:   { type: Boolean, default: false },


  loginAttempts: { type: Number, default: 0 },
  lockUntil:     Date,
  lastLogin:     Date,

 
  permissions: {
    canVerifyAlerts:    { type: Boolean, default: false },
    canManageUsers:     { type: Boolean, default: false },
    canDeleteAlerts:    { type: Boolean, default: false },
    canViewAnalytics:   { type: Boolean, default: true  },
    canAssignResponders:{ type: Boolean, default: false },
  },

  notifyRegions: [String],
}, { timestamps: true });

UserSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const ROLE_PERMS = {
  admin:     { canVerifyAlerts:true, canManageUsers:true, canDeleteAlerts:true, canViewAnalytics:true, canAssignResponders:true },
  responder: { canVerifyAlerts:true, canManageUsers:false,canDeleteAlerts:false,canViewAnalytics:true, canAssignResponders:false},
  ngo:       { canVerifyAlerts:false,canManageUsers:false,canDeleteAlerts:false,canViewAnalytics:true, canAssignResponders:false},
  analyst:   { canVerifyAlerts:false,canManageUsers:false,canDeleteAlerts:false,canViewAnalytics:true, canAssignResponders:false},
  public:    { canVerifyAlerts:false,canManageUsers:false,canDeleteAlerts:false,canViewAnalytics:false,canAssignResponders:false},
};

UserSchema.pre("save", function (next) {
  if (this.isModified("role")) this.permissions = ROLE_PERMS[this.role] || ROLE_PERMS.public;
  next();
});

UserSchema.methods.comparePassword = function (plain) {
  return require("bcryptjs").compare(plain, this.password);
};

UserSchema.methods.incLoginAttempts = function () {
  const upd = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked)
    upd.$set = { lockUntil: Date.now() + 2 * 3_600_000 };
  return this.updateOne(upd);
};

module.exports = mongoose.model("User", UserSchema);