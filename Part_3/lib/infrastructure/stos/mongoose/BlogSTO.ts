import Blog from '../../../domain/entities/Blog';

export default (schemaEntity: any): Blog | null => {
  if (!schemaEntity) return null;
  return new Blog({
    id: schemaEntity.id,
    title: schemaEntity.title,
    description: schemaEntity.description,
    image: schemaEntity.image,
  });
};
