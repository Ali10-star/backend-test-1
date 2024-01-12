import { ServiceLocator } from '../../../infrastructure/config/service-locator';

export default async ({ blogRepository }: ServiceLocator) => blogRepository!.find();