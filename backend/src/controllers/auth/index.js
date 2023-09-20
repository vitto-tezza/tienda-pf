import nodemailer from "nodemailer";
import Boom from "boom";
import User from "../../models/user";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../helpers/jwt";
import ValidationSchema from "./validations";

const transport = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  auth: {
    user: "vittorio.tezza93@gmail.com",
    pass: "vuzhilddcxtqrbjv",
  },
});

const Register = async (req, res, next) => {
  const input = req.body;

  const { error } = ValidationSchema.validate(input);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  try {
    const isExists = await User.findOne({ email: input.email });

    if (isExists) {
      return next(Boom.conflict("This e-mail is already in use."));
    }

    const user = new User(input);
    const data = await user.save();
    const userData = data.toObject();

    delete userData.password;
    delete userData.__v;

    const accessToken = await signAccessToken({
      user_id: user._id,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(user._id);

    res.json({
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (e) {
    next(e);
  }
};

const Login = async (req, res, next) => {
  const input = req.body;

  const { error } = ValidationSchema.validate(input);

  if (error) {
    return next(Boom.badRequest(error.details[0].message));
  }

  try {
    const user = await User.findOne({ email: input.email });

    if (!user) {
      throw Boom.notFound("The email address was not found.");
    }

    const isMatched = await user.isValidPass(input.password);
    if (!isMatched) {
      throw Boom.unauthorized("Email or password is not correct.");
    }

    const accessToken = await signAccessToken({
      user_id: user._id,
      role: user.role,
    });
    const refreshToken = await signRefreshToken(user._id);

    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.json({ user: userData, accessToken, refreshToken });
  } catch (e) {
    return next(e);
  }
};

const RefreshToken = async (req, res, next) => {
  const { refresh_token } = req.body;

  try {
    if (!refresh_token) {
      throw Boom.badRequest("Refresh token is missing.");
    }

    const user_id = await verifyRefreshToken(refresh_token);
    const accessToken = await signAccessToken(user_id);
    const refreshToken = await signRefreshToken(user_id);

    res.json({ accessToken, refreshToken });
  } catch (e) {
    next(e);
  }
};

const Logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      throw Boom.badRequest("Refresh token is missing.");
    }

    res.json({ message: "Logout successful" });
  } catch (e) {
    console.log(e);
    return next(e);
  }
};

const Me = async (req, res, next) => {
  const { user_id } = req.payload;

  try {
    const user = await User.findById(user_id).select("-password -__v");

    res.json(user);
  } catch (e) {
    next(e);
  }
};

const GetAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, "-password -__v");
    res.json(users);
  } catch (e) {
    next(e);
  }
};

const deleteUser = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(Boom.notFound("User not found"));
    }

    const mailOptions = {
      from: "tienda <tienda@gmail.com>",
      to: user.email,
      subject: "Usuario Eliminado",
      text: "Se ha eliminado su usuario.",
    };

    const result = await transport.sendMail(mailOptions);
    console.log(
      `Correo electrónico enviado a ${user.email}: ${result.response}`
    );

    const resultDelete = await User.deleteOne({ _id: userId });
    if (resultDelete.deletedCount === 1) {
      res.json({ message: "User deleted successfully" });
    } else {
      next(Boom.notFound("User not found"));
    }
  } catch (e) {
    next(e);
  }
};

const changeUserRole = async (req, res, next) => {
  const userId = req.params.userId;
  const newRole = req.body.role;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(Boom.notFound("User not found"));
    }

    user.role = newRole;
    await user.save();

    res.json({ message: "User role updated successfully" });
  } catch (e) {
    next(e);
  }
};

const deleteInactiveUsers = async () => {
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

  try {
    const deletedUsers = await User.find({
      lastActivityDate: { $lt: fortyEightHoursAgo },
    });

    const result = await User.deleteMany({
      lastActivityDate: { $lt: fortyEightHoursAgo },
    });

    console.log(`Deleted ${result.deletedCount} inactive users.`);

    for (const user of deletedUsers) {
      const mailOptions = {
        from: "test@gmail.com",
        to: user.email,
        subject: "Notificación de eliminación de cuenta",
        text: "Tu cuenta ha sido eliminada debido a la inactividad en nuestro sistema.",
      };

      try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(
          `Correo electrónico enviado a ${user.email}: ${info.response}`
        );
      } catch (error) {
        console.error(
          `Error al enviar correo electrónico a ${user.email}: ${error}`
        );
      }
    }
  } catch (e) {
    console.error("Error deleting inactive users:", e);
  }
};

export default {
  Register,
  Login,
  RefreshToken,
  Logout,
  Me,
  GetAllUsers,
  deleteInactiveUsers,
  deleteUser,
  changeUserRole,
};
