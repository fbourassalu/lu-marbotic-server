import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3232 });

wss.on("connection", (ws) => {
  ws.send("Welcome to the chat, enjoy :)");

  ws.on("message", (data) => {
    let message;

    console.log(">>>>>>", data);

    try {
      message = JSON.parse(data);
      å;
    } catch (e) {
      sendError(ws, "Wrong format");

      return;
    }

    if (message.type === "NEW_MESSAGE") {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  });
});

const sendError = (ws, message) => {
  console.log(ws, message);

  const messageObject = {
    type: "ERROR",
    payload: message,
  };

  ws.send(JSON.stringify(messageObject));
};
