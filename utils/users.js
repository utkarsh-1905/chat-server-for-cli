const users = [];

function addUser(id, username, room) {
  const user = { id, username, room };
  const index = users.findIndex((user) => user.room === room);
  if (index === -1) {
    user.admin = true;
  } else user.admin = false;

  users.push(user);

  return user;
}

function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

function userLeave(id) {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

function getRoomAdmin(room) {
  return users.filter((user) => {
    return user.room === room && user.admin === true;
  });
}

function makeAdmin(admin, id) {
  if (getCurrentUser(admin).admin) {
    const user = getCurrentUser(id);
    user.admin = true;
    return {
      admin: user.username,
      room: user.room,
    };
  } else return false;
}

function checkAdmins(room) {
  const admins = getRoomAdmin(room);
  if (admins.length === 0) {
    const users = getRoomUsers(room);
    if (users.length > 0) {
      users[0].admin = true;
    }
  } else return true;
}

module.exports = {
  addUser,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getRoomAdmin,
  makeAdmin,
  checkAdmins,
};
