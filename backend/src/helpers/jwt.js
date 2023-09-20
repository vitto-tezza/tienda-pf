import JWT from "jsonwebtoken";
import Boom from "boom";

const signAccessToken = (data) => {
  return new Promise((resolve, reject) => {
    const payload = {
      ...data,
    };

    const options = {
      expiresIn: "10d",
      issuer: "ecommerce.app",
    };

    JWT.sign(payload, process.env.JWT_SECRET, options, (err, token) => {
      if (err) {
        console.log(err);
        reject(Boom.internal());
      }

      resolve(token);
    });
  });
};

const verifyAccessToken = (req, res, next) => {
  const authorizationToken = req.headers["authorization"];
  if (!authorizationToken) {
    next(Boom.unauthorized());
  }

  JWT.verify(authorizationToken, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return next(
        Boom.unauthorized(
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message
        )
      );
    }

    req.payload = payload;
    next();
  });
};

const signRefreshToken = (user_id) => {
  return new Promise((resolve, reject) => {
    const payload = {
      user_id,
    };
    const options = {
      expiresIn: "180d",
      issuer: "ecommerce.app",
    };

    JWT.sign(payload, process.env.JWT_REFRESH_SECRET, options, (err, token) => {
      if (err) {
        console.log(err);
        reject(Boom.internal());
      }

      resolve(token);
    });
  });
};

const verifyRefreshToken = async (refresh_token) => {
  return new Promise(async (resolve, reject) => {
    JWT.verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET,
      async (err, payload) => {
        if (err) {
          return reject(Boom.unauthorized());
        }

        resolve(payload.user_id);
      }
    );
  });
};

export {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
