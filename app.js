const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const jwtMilddleware = require("./middleware/socket-auth-middleware");

const port = process.env.PORT || 4001;
const index = require("./routes/index");

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(index);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

io.use(jwtMilddleware);

let interval;

io.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });

  socket.on("enter", ({ itemId }) => {
    console.log(itemId);
    socket.emit("nice", { name: "Italian shoe", ammount: 10 });
  });

  socket.on("leave", () => {
    console.log("Baba is discouraged");
  });
});

const getApiAndEmit = (socket) => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

server.listen(port, () => console.log(`Listening on port ${port}`));
