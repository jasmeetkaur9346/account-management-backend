// models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Original (display) username — keep the user’s chosen casing
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true, // optional but fine to keep
    },

    // Canonical lowercase username for case-insensitive lookups/uniqueness
    usernameLower: {
      type: String,
      required: true,
      trim: true,
      unique: true, // enforce case-insensitive uniqueness via this field
    },

    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Keep usernameLower in sync on create/save
userSchema.pre("save", function (next) {
  if (this.isModified("username") || this.isNew) {
    this.usernameLower = (this.username || "").toLowerCase();
  }
  next();
});

// Keep usernameLower in sync on findOneAndUpdate({ username: ... })
userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  if (update.username) {
    update.usernameLower = String(update.username).toLowerCase();
    this.setUpdate(update);
  }
  next();
});

// Extra safety: ensure index exists (Mongo will create it if missing)
userSchema.index({ usernameLower: 1 }, { unique: true });

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;