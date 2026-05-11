import mongoose from "mongoose";

const allowedUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email",
      ],
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["editor", "admin"],
      default: "editor",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

allowedUserSchema.set("toJSON", {
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const AllowedUser =
  mongoose.models.AllowedUser ||
  mongoose.model("AllowedUser", allowedUserSchema);

export default AllowedUser;