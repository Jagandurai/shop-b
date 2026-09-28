import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Image",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userId: 1, imageId: 1 }, { unique: true });

favoriteSchema.set("toJSON", {
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Favorite =
  mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);

export default Favorite;
