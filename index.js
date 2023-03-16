import { WebSocketServer } from "ws";

// Device types
const LU_SOURCE_TYPE = "lu";
const MARBOTIC_SOURCE_TYPE = "marbotic";

// Message types
const GAME_READY_MESSAGE_TYPE = "GAME_READY";
const GAME_STARTED_MESSAGE_TYPE = "GAME_STARTED";
const GAME_ENDED_MESSAGE_TYPE = "GAME_ENDED";
const ANWSER_SUBMITTED_MESSAGE_TYPE = "ANWSER_SUBMITTED";
const WINNER_ANSWER_MESSAGE_TYPE = "WINNER_ANSWER";
const ANSWER_RESULT_MESSAGE_TYPE = "ANSWER_RESULT";

// Game states
const GAME_STATE_PENDING = "pending";
const GAME_STATE_READY = "ready";
const GAME_STATE_STARTED = "started";

// Statuses
let gameState = GAME_STATE_PENDING;
let gameAnswers = [];

let luDeviceIds = null;
let marboticDeviceIds = [];

const wss = new WebSocketServer({ port: 2222 });

wss.on("connection", (ws, request) => {
  console.info(request.body);
  ws.send("Hey, welcome to the Server. Enjoy");

  ws.on("message", (data) => {
    let message;

    try {
      message = JSON.parse(data);
    } catch (e) {
      sendError(ws, "Wrong format");
      return;
    }

    if (message.type === LU_SOURCE_TYPE) {
      LuMessageHandler.handle(message);
    } else if (message.type === MARBOTIC_SOURCE_TYPE) {
      MarboticMessageHandler.handle(message);
    }
  });
});

const LuMessageHandler = {
  handle(message) {
    if (message.type === START_GAME_MESSAGE_TYPE) {
      if (gameState === GAME_STATE_PENDING) {
        gameState = GAME_STATE_STARTED;
      } else {
        // ERROR, game already started
      }
    } else if (message.type === END_GAME_MESSAGE_TYPE) {
      if (gameState === GAME_STATE_STARTED) {
        gameState = GAME_STATE_PENDING;
      } else {
        // ERROR, game already started
      }
    }
  },
};

const MarboticMessageHandler = {
  handle(message) {
    if (message.type === RECIEVE_ANSWER_MESSAGE_TYPE) {
      if (gameState === GAME_STATE_STARTED) {
        // Dispatch winner to Lu
        // wss.clients.forEach((client) => {
        //   if (client !== ws && client.readyState === WebSocket.OPEN) {
        //     client.send(data);
        //   }
        // });
      } else {
        // ERROR, game not running
      }
    }
  },
};

const sendError = (ws, message) => {
  const messageObject = {
    type: "ERROR",
    payload: message,
  };

  ws.send(JSON.stringify(messageObject));
};
