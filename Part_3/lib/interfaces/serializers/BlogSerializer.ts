// import User from "../../domain/entities/User";
import Blog from "../../domain/entities/Blog";
import { ServiceLocator } from "../../infrastructure/config/service-locator";
import Serializer from "./Serializer";

export default class BlogSerializer extends Serializer {
  _serializeSingleEntity(entity: Blog, serviceLocator: ServiceLocator): object {
    const blogObj = {
      'id': entity.id,
      'title': entity.title,
      'description': entity.description,
      'image': entity.image
    };
    return blogObj;
  }
};
