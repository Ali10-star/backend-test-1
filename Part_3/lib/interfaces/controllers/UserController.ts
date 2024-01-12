import { Request, Response } from 'express';
import { ValidationError } from 'joi';
import ListUsers from '../../application/use_cases/user/ListUsers';
import GetUser from '../../application/use_cases/user/GetUser';
import CreateUser from '../../application/use_cases/user/CreateUser';
import UpdateUser from '../../application/use_cases/user/UpdateUser';
import DeleteUser from '../../application/use_cases/user/DeleteUser';
import { ServiceLocator } from '../../infrastructure/config/service-locator';
import User from '../../domain/entities/User';
import BlogMongo from '../../infrastructure/orm/mongoose/schemas/Blog';
import UserBlogMongo from '../../infrastructure/orm/mongoose/schemas/UserBlog';

export default {

  async findUsers(request: Request, response: Response) {
    // Context
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    // Treatment
    const users = await ListUsers(serviceLocator);

    // Output
    const output = users
      .map((user: User) => serviceLocator.userSerializer.serialize(user, serviceLocator));
    return response.json(output);
  },

  async getUser(request: Request, response: Response) {
    // Context
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    // Input
    const userId = request.params.id;

    // Treatment
    let user = null;
    try {
      user = await GetUser(userId, serviceLocator);
    } catch (err) {
      console.log(err);
    }

    // Output
    if (!user) {
      return response.status(404).json({ message: 'Not Found' });
    }
    const output = serviceLocator.userSerializer.serialize(user, serviceLocator);
    return response.json(output);
  },

  async createUser(request: Request, response: Response) {
    // Context
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    // Input
    let data = request.body;
    data = {
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
    };

    // Treatment
    let user = null;
    let error = null;
    try {
      user = await CreateUser(data, serviceLocator);
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        error = err.details[0].message;
      } else if (err instanceof Error) {
        // 'Error occurred while creating user'
        error = err.message;
      }
    }

    // Output
    if (!user) {
      return response.status(400).json({ message: error });
    }
    const output = serviceLocator.userSerializer.serialize(user, serviceLocator);
    return response.status(201).json(output);
  },

  async updateUser(request: Request, response: Response) {
    // Context
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    // Input
    const userId = request.params.id;
    const inputData = request.body;
    const data: any = {
      id: userId
    };
    const acceptedFields: string[][] = [
      ['first_name', 'firstName'],
      ['last_name', 'lastName'],
      ['email'],
      ['phone'],
      ['active'],
      ['role'],
      ['country'],
      ['city'],
      ['nationality'],
      ['photo'],
    ];
    acceptedFields.forEach((acceptedField) => {
      if (inputData[acceptedField[0]] === undefined) return;
      data[acceptedField.length > 1
        ? acceptedField[1]
        : acceptedField[0]
      ] = inputData[acceptedField[0]];
    });

    // Treatment
    let user = null;
    let error = null;
    try {
      user = await UpdateUser(data, serviceLocator);
    } catch (err) {
      if (err instanceof ValidationError) {
        error = err.details[0].message;
      } else if (err instanceof Error) {
        // 'Error occurred while creating user'
        error = err.message;
      }
    }

    // Output
    if (!user) {
      return response.status(400).json({ message: error });
    }
    const output = serviceLocator.userSerializer.serialize(user, serviceLocator);
    return response.json(output);
  },

  async deleteUser(request: Request, response: Response) {
    // Context
    const serviceLocator: ServiceLocator = request.serviceLocator!;

    // Input
    const toDeleteUserId = request.params.id;

    // ---------------------------------------------
    // THIS IS HOW TO ACCESS userId FROM AccessToken
    // ---------------------------------------------
    const userId = request.userId;
    // ---------------------------------------------
    // ---------------------------------------------

    // Treatment
    let user = null;
    try {
      // Delete all blogs and relationships when deleting a user
      const userBlogs = await UserBlogMongo.find({ user_id: toDeleteUserId });
      const blogIds = userBlogs.map((userBlog) => userBlog.blog_id);
      await UserBlogMongo.deleteMany({ user_id: toDeleteUserId });
      await BlogMongo.deleteMany({ _id: { $in: blogIds }});

      user = await DeleteUser(toDeleteUserId, serviceLocator);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(err);
      }
    }

    // Output
    if (!user) {
      return response.status(404).json({ message: 'Not Found' });
    }
    return response.sendStatus(204);
  },

};
