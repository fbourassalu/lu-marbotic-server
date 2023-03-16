import { WebSocketServer } from "ws";

// Device types
const LU_SOURCE_TYPE = "lu";
const MARBOTIC_SOURCE_TYPE = "marbotic";

// Message types
const SET_SOURCE_TYPE_MESSAGE_TYPE = "set_source";
const START_GAME_MESSAGE_TYPE = "start_game";
const END_GAME_MESSAGE_TYPE = "end_game";

// Game states
const GAME_STATE_PENDING = "pending";
const GAME_STATE_STARTED = "started";

// Statuses
let gameId = null;
let gameState = GAME_STATE_PENDING;
let gameAnswers = [];

let luDeviceIds = [];
let marboticDeviceIds = [];

const wss = new WebSocketServer({ port: 2222 });

wss.on("connection", (ws) => {
  ws.send("Hey, welcome to the Server. Enjoy");

  ws.on("message", (data) => {
    let message;

    try {
      message = JSON.parse(data);
    } catch (e) {
      sendError(ws, "Wrong format");
      return;
    }
  });
});

const LuChannelHandler = () => {
  function Handle(message) {
    if (message.type === START_GAME_MESSAGE_TYPE) {
      if (gameState === GAME_STATE_PENDING) {
        gameState = GAME_STATE_STARTED;
        gameId = message.data.gameId;
      } else {
        // ERROR, game already started
      }
    } else if (message.type === END_GAME_MESSAGE_TYPE) {
      if (gameState === GAME_STATE_STARTED) {
        gameState = GAME_STATE_PENDING;
        gameId = null;

        // Decide winner

        // Dispatch winner to Lu
        // wss.clients.forEach((client) => {
        //   if (client !== ws && client.readyState === WebSocket.OPEN) {
        //     client.send(data);
        //   }
        // });
      } else {
        // ERROR, game already started
      }
    }
  }
};

const MarboticChannelHandler = () => {
  function Handle(message) {}
};

const sendError = (ws, message) => {
  const messageObject = {
    type: "ERROR",
    payload: message,
  };

  ws.send(JSON.stringify(messageObject));
};
