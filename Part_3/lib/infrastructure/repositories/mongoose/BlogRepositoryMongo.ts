import Blog from "../../../domain/entities/Blog";
import MongoBlog from "../../orm/mongoose/schemas/Blog";
import BlogRepository from "../../../domain/repositories/BlogRepository";
import BlogSTO from "../../stos/mongoose/BlogSTO";
import { ID } from "../../../domain/entities/Entity";

export default class BlogRepositoryMongo implements BlogRepository {

  async find(): Promise<Blog[]> {
    const blogs = await MongoBlog.find().sort({ createdAt: -1 });
    return blogs
      .map((blog) => BlogSTO(blog))
      .filter((blog: Blog | null): blog is Blog => blog != null);
  }

  async get(entityId: ID): Promise<Blog | null> {
    const blogPost = await MongoBlog.findById(entityId);
    if (!blogPost) return null;
    return BlogSTO(blogPost);
  }

  async persist(domainEntity: Blog): Promise<Blog | null> {
    const { title, description, image } = domainEntity;
    const newBlog = new MongoBlog({ title, description, image });
    await newBlog.save();
    return BlogSTO(newBlog);
  }

  async merge(domainEntity: Blog): Promise<Blog | null> {
    const { id, title, description, image } = domainEntity;
    const updatedBlog = await MongoBlog.findByIdAndUpdate(
      id,
      {
        id,
        title,
        description,
        image
      },
      { new: true }
    );
    return BlogSTO(updatedBlog);
  }

  async remove(entityId: ID): Promise<boolean | null> {
    return MongoBlog.findOneAndDelete({ _id: entityId });
  }
}