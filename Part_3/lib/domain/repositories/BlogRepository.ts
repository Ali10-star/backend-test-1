import { ID } from "../entities/Entity";
import Blog from "../entities/Blog";

export default interface BlogRepository {
  persist(domainEntity: Blog): Promise<Blog | null>;

  merge(domainEntity: Blog): Promise<Blog | null>;

  remove(entityId: ID): Promise<boolean | null>;

  get(entityId: ID): Promise<Blog | null>;

  find(): Promise<Blog[]>;
};
