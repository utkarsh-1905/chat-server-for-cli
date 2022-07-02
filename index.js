const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
app.use(cors());
app.use(morgan("dev"));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

instrument(io, {
  auth: false,
});

const formatMessage = require("./utils/formatMessage");
const {
  addUser,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getRoomAdmin,
  makeAdmin,
  checkAdmins,
} = require("./utils/users");

try {
  io.on("connection", (socket) => {
    //When new user joins
    socket.on("joinRoom", ({ username, room }) => {
      if (!username || !room) {
        console.log("Provide username/room");
        return;
      }
      const user = addUser(socket.id, username, room);
      socket.join(user.room);
      socket.emit("message", formatMessage("Admin", "Welcome to the chat app"));
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage("Admin", `${user.username} has joined the chat`)
        );
    });
    //to receive chat message
    socket.on("chatMessage", (e) => {
      const user = getCurrentUser(socket.id);
      io.to(user.room).emit("message", formatMessage(user.username, e));
    });

    socket.on("command", async (data) => {
      if (data.includes("users")) {
        const user = await getCurrentUser(socket.id);
        socket.emit("roomUsers", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      } else if (data.includes("admin")) {
        const user = await getCurrentUser(socket.id);
        const admin = await getRoomAdmin(user.room);
        socket.emit("roomAdmin", { admin });
      } else if (data.includes("leave")) {
        const user = await getCurrentUser(socket.id);
        socket.leave(user.room);
      }
    });
    //admin activites

    socket.on("admin", async (data) => {
      if (data.cmd.includes("/addAdmin")) {
        const res = makeAdmin(socket.id, data.id);
        if (res) {
          socket.broadcast
            .to(res.room)
            .emit(
              "message",
              formatMessage("Admin", `${res.admin} is now admin`)
            );
        } else {
          socket.emit("message", formatMessage("Admin", "You are not admin"));
        }
      } else if (data.cmd.includes("/removeUser")) {
        const admin = getCurrentUser(socket.id);
        if (admin.admin) {
          const sockets = await io.in(admin.room).fetchSockets();
          for (socket of sockets) {
            if (socket.id === data.id) {
              socket.leave(admin.room);
              socket.emit(
                "userRemoved",
                formatMessage(
                  admin.username,
                  getCurrentUser(socket.id).username
                )
              );
              return;
            }
          }
        } else
          socket.emit("message", formatMessage("Admin", "You are not admin"));
      }
    });

    //When user disconnects
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
      checkAdmins(user.room);
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage("Admin", `${user.username} has left the chat`)
        );
      }
    });
  });
} catch (err) {
  console.log(err);
}
httpServer.listen(3000);
