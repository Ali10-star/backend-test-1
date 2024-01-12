import Entity, { ID } from './Entity';

export default class Blog extends Entity {
  title: string;
  description: string;
  image: string;

  constructor({
    id,
    title,
    description,
    image,
  }: {
    id?: ID,
    title: string,
    description: string,
    image: string,
  }) {
    super({ id });
    this.title = title;
    this.description = description;
    this.image = image;
  }

}