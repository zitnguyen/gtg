const User = require("../../../models/User");

const TARGETABLE_ROLES = ["Teacher", "Parent", "Student"];

const findUsersByFilter = (filter) =>
  User.find(filter).select("_id role fullName username");

const findAdmins = (projection = "_id role") =>
  User.find({ role: "Admin" }).select(projection);

const findByRolesOrIds = ({ roles = [], userIds = [] } = {}) => {
  const filter = {};
  if (Array.isArray(roles) && roles.length > 0) {
    filter.role = { $in: roles };
  }
  if (Array.isArray(userIds) && userIds.length > 0) {
    filter._id = { $in: userIds };
  }
  return findUsersByFilter(filter);
};

module.exports = {
  TARGETABLE_ROLES,
  findUsersByFilter,
  findAdmins,
  findByRolesOrIds,
};
