import mongoose from "../mongoose";

const schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blog_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }
});

export default mongoose.model('UserBlog', schema);