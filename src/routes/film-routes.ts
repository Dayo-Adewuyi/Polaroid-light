import { Router } from 'express';
import { FilmController } from '../controllers/film-controllers';
import { 
  filmValidation, 

  asyncHandler,
  rateLimiter,
} from '../middlewares';
const router = Router();
const filmController = new FilmController();



const purchaseRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: 'Too many purchase attempts'
});

const createRateLimiter =  rateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  message: 'Too many film uploads'
});

router.get(
  '/films',
  asyncHandler(filmController.getAllFilms)
);


router.get(
  '/films/:id',
  filmValidation.id,
  asyncHandler(filmController.getFilmById)
);

router.get(
  '/films/:id/stats',
  filmValidation.id,
  asyncHandler(filmController.getFilmStats)
);

router.post(
  '/films',
  createRateLimiter,
  filmValidation.create,
  asyncHandler(filmController.createFilm)
);

router.post(
  '/films/:id/purchase',
  purchaseRateLimiter,
  filmValidation.id,
  filmValidation.purchase,
  asyncHandler(filmController.purchaseFilm)
);

router.put(
  '/films/:id',
  filmValidation.id,
  filmValidation.update,
  asyncHandler(filmController.updateFilm)
);

router.delete(
  '/films/:id',
  filmValidation.id,
  asyncHandler(filmController.deleteFilm)
);

export default router;