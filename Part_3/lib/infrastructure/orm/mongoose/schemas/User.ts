import { CallbackError } from 'mongoose';
import mongoose from '../mongoose';
import Blog from './Blog';
import UserBlog from './UserBlog';

const schema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: String,
    required: false,
    default: null,
  },
  password: String,
}, { timestamps: true });

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

// this ensures that all blogs and their references are deleted when a user is deleted
schema.pre('remove', async function (next) {
  try {
    const userId = this.getQuery()['_id'];
    const userBlog = await UserBlog.findOne({ user_id: userId });
    await Blog.deleteMany({ _id: userBlog?.blog_id });
    await userBlog?.delete();
    next();
  } catch (err: unknown) {
    console.log(err);
    next(err as CallbackError);
  }
});


export default mongoose.model('User', schema);
