import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    image_url: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    public_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["makeup", "hairstyle", "nails", "facial", "bridal", "other"],
      index: true,
    },
    uploaded_by: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

imageSchema.index({ type: 1, isPinned: -1, pinnedAt: -1, createdAt: -1 });
imageSchema.index({ isPinned: -1, pinnedAt: -1, createdAt: -1 });

imageSchema.set("toJSON", {
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Image = mongoose.models.Image || mongoose.model("Image", imageSchema);

export default Image;