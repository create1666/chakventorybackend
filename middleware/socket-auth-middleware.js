const jwtMiddleware = (socket, next) => {
  const { token } = socket.handshake.query;
  console.log(token, "token");
  next();
  // verify token
};

module.exports = jwtMiddleware;
