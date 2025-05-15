import { FilmRepository, UserRepository, PurchaseRepository } from '../repositories';
import { FilmService } from './film-service';
import { UserService } from './user-service';

const filmRepository = new FilmRepository();
const userRepository = new UserRepository();
const purchaseRepository = new PurchaseRepository();

export const filmService = new FilmService(filmRepository, purchaseRepository, userRepository);
export const userService = new UserService(userRepository, purchaseRepository);

export { FilmService, UserService };