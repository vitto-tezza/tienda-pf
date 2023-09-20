import { Router } from 'express';

// Helpers
import { verifyAccessToken } from '../helpers/jwt';

// Rutas
import auth from './auth';
import product from './product';
import order from './order';

const router = Router();

router.get('/', (req, res) => {
  res.end('¡Hola!');
});

router.use('/auth', auth);
router.use('/product', product);
router.use('/order', verifyAccessToken, order);

export default router;
