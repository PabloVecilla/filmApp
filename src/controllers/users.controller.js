const { User } = require("../models");

const USER_LIST_ATTRIBUTES = ["id", "name", "email", "role"];
const USER_DETAIL_ATTRIBUTES = ["name", "email", "role"];

const parseUserId = (value) => {
  const rawId = String(value);

  if (!/^[1-9]\d*$/.test(rawId)) {
    return null;
  }

  const userId = Number(rawId);
  return Number.isSafeInteger(userId) ? userId : null;
};

const sendInternalError = (res, error) => {
  console.error("User API error:", error.message);
  return res.status(500).json({ message: "Internal server error" });
};

// Get all users (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: USER_LIST_ATTRIBUTES }); // findAll users at DB 
    return res.status(200).json(users);
  } catch (error) {
    return sendInternalError(res, error);
  }
};

// Get user by id
const getUser = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // req.params.id --> id at URL ej: /api/user/1
    const user = await User.findByPk(userId, { attributes: USER_DETAIL_ATTRIBUTES }); // Busca por Primary Key, equivale a SELECT * FROM users WHERE id = 1
    if (!user)
      return res.status(404).json({ message: "User not found" }); // if findByPk returns null, respond with 404
    return res.status(200).json(user);
  } catch (error) {
    return sendInternalError(res, error);
  }
};

// Edit user
const updateUser = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // User lookup before editting
    const user = await User.findByPk(userId, { attributes: USER_LIST_ATTRIBUTES }); // Busca el usuario por id --> only secure fields
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const role = String(req.body.role ?? user.role);

    if (role !== "admin" && role !== "user")  return res.status(400).json({ message: "Invalid user role" });

    await user.update({ role });
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res
      .status(200)
      .json({ user: safeUser, message: `User ${user.name} role edited.` });
  } catch (error) {
    return sendInternalError(res, error);
  }
};

// Delete user (Admin)
const deleteUser = async (req, res) => {
  try {
    const userId = parseUserId(req.params.id);

    if (!userId)  return res.status(400).json({ message: "Invalid user id" });

    // User lookup before deleition
    const user = await User.findByPk(userId, { attributes: USER_LIST_ATTRIBUTES }); // Busca el usuario por id
    if (!user)
      return res.status(404).json({ message: "User not found" });

    await user.destroy(); // DELETE FROM users WHERE id ( SQL )
    return res.status(200).json({
      message: `User ${user.name} eliminated`,
      user,
    });
  } catch (error) {
    return sendInternalError(res, error);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
};
