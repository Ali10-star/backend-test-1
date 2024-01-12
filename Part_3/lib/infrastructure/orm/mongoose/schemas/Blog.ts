import mongoose from "../mongoose";

const schema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
}, { timestamps: true });

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

export default mongoose.model('Blog', schema);