const mongoose = require("mongoose");

const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const ContactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => emailRegex.test(v),
        message: "Invalid email format",
      },
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "contact_messages" }
);

module.exports =
  mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema);
