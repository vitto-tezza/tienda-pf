import { roles } from '../roles';

const grantAccess = (action, resource) => {
  return async (req, res, next) => {
    const permission = roles.can(req.payload.role)[action](resource);

    if (!permission.granted) {
      return res.status(403).json({ error: "No tienes permiso para realizar esta acción." });
    }

    next();
  };
};

export default grantAccess;
