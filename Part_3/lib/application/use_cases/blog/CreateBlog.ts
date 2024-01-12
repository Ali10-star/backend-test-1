import Blog from '../../../domain/entities/Blog';
import BlogValidator from '../../../domain/validators/BlogValidator';
import { ServiceLocator } from '../../../infrastructure/config/service-locator';

export default async (blogData: any, { blogRepository }: ServiceLocator) => {
  await BlogValidator.tailor('create').validateAsync(blogData);
  const blog = new Blog({
    title: blogData.title,
    description: blogData.description,
    image: blogData.image,
  });
  return blogRepository!.persist(blog);
};