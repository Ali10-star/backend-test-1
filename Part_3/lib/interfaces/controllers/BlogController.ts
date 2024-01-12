import { Request, Response } from 'express';
import { ValidationError } from 'joi';
import ListBlogs from '../../application/use_cases/blog/ListBlogs';
import GetBlog from '../../application/use_cases/blog/GetBlog';
import CreateBlog from '../../application/use_cases/blog/CreateBlog';
import UpdateBlog from '../../application/use_cases/blog/UpdateBlog';
import DeleteBlog from '../../application/use_cases/blog/DeleteBlog';
import { ServiceLocator } from '../../infrastructure/config/service-locator';
import Blog from '../../domain/entities/Blog';
import UserBlogMongo from '../../infrastructure/orm/mongoose/schemas/UserBlog';

export default {

  async findBlogs(request: Request, response: Response) {
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    const blogs = await ListBlogs(serviceLocator);

    const result = blogs.map((blog: Blog) => serviceLocator.blogSerializer.serialize(blog, serviceLocator));

    return response.status(200).json(result);
  },

  async getBlog(request: Request, response: Response) {
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    const blogId = request.params.id;
    let blog = null;
    try {
      blog = await GetBlog(blogId, serviceLocator);
    } catch (error) {
      console.log(error);
    }

    if (!blog) {
      return response.status(404).json({ message: 'Not Found.' });
    }
    const result = serviceLocator.blogSerializer.serialize(blog, serviceLocator);

    return response.status(200).json(result);
  },

  async createBlog(request: Request, response: Response) {
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    let blogData = request.body;
    blogData = {
      title: blogData.title,
      description: blogData.description,
      image: blogData.image
    };
    let blog;
    let error;
    try {
      blog = await CreateBlog(blogData, serviceLocator);
      // Create new UserBlog document for the many-to-many relationship
      const newUserBlog = new UserBlogMongo({
        blog_id: blog?.id,
        user_id: request.userId
      });
      await newUserBlog.save();
    } catch(err: unknown) {
      if (err instanceof ValidationError) {
        error = err.details[0].message;
      } else if (err instanceof Error) {
        error = err.message;
      }
    }

    if (!blog) {
      return response.status(400).json({ message: error });
    }
    const result = serviceLocator.blogSerializer.serialize(blog, serviceLocator);
    return response.status(201).json(result);
  },

  async updateBlog(request: Request, response: Response) {
    // Context
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    const blogId = request.params.id;
    let data = request.body;
    data = {
      id: blogId,
      ...data,
    };

    let blog = null;
    let error = null;
    try {
      blog = await UpdateBlog(data, serviceLocator);
    } catch (err) {
      if (err instanceof ValidationError) {
        error = err.details[0].message;
      } else if (err instanceof Error) {
        error = err.message;
      }
    }

    if (!blog) {
      return response.status(400).json({ message: error });
    }
    const result = serviceLocator.blogSerializer.serialize(blog, serviceLocator);
    return response.json(result);
  },

  async deleteBlog(request: Request, response: Response) {
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    const toDeleteBlogId = request.params.id;

    // ---------------------------------------------
    // THIS IS HOW TO ACCESS userId FROM AccessToken
    // ---------------------------------------------
    const userId = request.userId;
    // ---------------------------------------------
    // ---------------------------------------------

    let blog = null;
    try {
      blog = await DeleteBlog(toDeleteBlogId, serviceLocator);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(err);
      }
    }

    // Output
    if (!blog) {
      return response.status(404).json({ message: 'Not Found' });
    }
    return response.sendStatus(204);
  },

}