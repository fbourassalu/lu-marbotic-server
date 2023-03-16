import { WebSocket, WebSocketServer } from "ws";

// Device types
const LU_DEVICE_TYPE = "lu";
const MARBOTIC_DEVICE_TYPE = "marbotic";

// Message types
const GAME_READY_MESSAGE_TYPE = "GAME_READY";
const GAME_STARTED_MESSAGE_TYPE = "GAME_STARTED";
const GAME_ENDED_MESSAGE_TYPE = "GAME_ENDED";
const ANSWER_SUBMITTED_MESSAGE_TYPE = "ANSWER_SUBMITTED";
const WINNER_ANSWER_MESSAGE_TYPE = "WINNER_ANSWER";
const NEXT_QUESTION_MESSAGE_TYPE = "NEXT_QUESTION";
const ANSWER_RESULT_MESSAGE_TYPE = "ANSWER_RESULT";
const CONNECTION_SUCCESSFUL = "CONNECTION_SUCCESSFUL";

// Game states
const GAME_STATE_PENDING = "pending";
const GAME_STATE_STARTED = "started";

// Statuses
let gameState = GAME_STATE_PENDING;
let gameAnswers = []; // List of letters
let answersRemaining = [];
let currentAnswerIndex = -1;
let playerScores = {};
let ready = false;

const wss = new WebSocketServer({ port: 2222 });

wss.on("connection", (client, request) => {
  client.deviceType = request.headers.devicetype;
  client.deviceId = request.headers.deviceid;

  console.info(`connected ${client.deviceType}`);
  if (request.headers.teamname) {
    client.teamName = request.headers.teamname;
  }
  // Identify device type
  client.send(
    JSON.stringify({
      Type: CONNECTION_SUCCESSFUL,
      Message: `Connected to lu-marbotic server ${client.deviceType}`,
    })
  );

  console.info(wss.clients.size + " connections", "ready", ready);
  if (wss.clients.size > 2 && !ready) {
    console.log("here");
    const clientsArray = wss.clients;
    let players = [...clientsArray].filter(
      (x) => x.deviceType === MARBOTIC_DEVICE_TYPE
    );

    sendMessage(
      wss,
      GAME_READY_MESSAGE_TYPE,
      {
        Players: [
          {
            playerId: players[0].deviceId,
            teamName: players[0].teamName,
            points: players[0].points ?? 0,
          },
          {
            playerId: players[1].deviceId,
            teamName: players[1].teamName,
            points: players[1].points ?? 0,
          },
        ],
      },
      LU_DEVICE_TYPE
    );
    //ready = true;
  }

  client.on("message", (data) => {
    let message;

    try {
      message = JSON.parse(data);
      console.log("RECIEVED", message);
    } catch (e) {
      sendError(client, "Wrong format");
      return;
    }

    if (message.Type === "ping") {
      client.send(JSON.stringify({ data: "pong" }));
    }

    if (client.deviceType === LU_DEVICE_TYPE) {
      LuMessageHandler.handle(wss, client, message);
    } else if (client.deviceType === MARBOTIC_DEVICE_TYPE) {
      MarboticMessageHandler.handle(wss, client, message);
    }
  });
});

const LuMessageHandler = {
  handle(server, client, message) {
    if (message.Type === GAME_STARTED_MESSAGE_TYPE) {
      // if (gameState === GAME_STATE_PENDING) {
      gameState = GAME_STATE_STARTED;
      InitialiseAnswers(message.letters);

      // Send
      sendMessage(
        server,
        GAME_STARTED_MESSAGE_TYPE,
        {
          letters: gameAnswers,
        },
        MARBOTIC_DEVICE_TYPE
      );
      // } else {
      //   sendError(client, "Game already started");
      // }
    } else if (message.Type === GAME_ENDED_MESSAGE_TYPE) {
      ResetState();
    }
  },
};

const MarboticMessageHandler = {
  handle(server, client, message) {
    if (message.Type === ANSWER_SUBMITTED_MESSAGE_TYPE) {
      // if (gameState === GAME_STATE_STARTED) {
      if (!playerScores.hasOwnProperty(client.deviceId)) {
        playerScores[client.deviceId] = 0;
      }

      // Is it the right anwswer?
      let answer = answersRemaining[0];
      console.info("message.answer", message.answer, answer);

      const isAccepted = message.answer === answer;
      if (isAccepted) {
        answersRemaining.shift();
        currentAnswerIndex++;

        // Increase score for player
        playerScores[client.deviceId]++;
        const clientsArray = wss.clients;
        let players = [...clientsArray].filter(
          (x) => x.deviceType === MARBOTIC_DEVICE_TYPE
        );
        let winningTeam = players.filter((x) => x.deviceId === client.deviceId);
        sendMessage(
          server,
          WINNER_ANSWER_MESSAGE_TYPE,
          {
            Player: {
              playerId: client.deviceId,
              teamName: winningTeam[0].teamName,
              points: playerScores[client.deviceId],
            },
          },
          LU_DEVICE_TYPE
        );

        sendMessage(
          server,
          NEXT_QUESTION_MESSAGE_TYPE,
          {
            index: currentAnswerIndex,
          },
          MARBOTIC_DEVICE_TYPE
        );

        // Is the game ended?
        if (answersRemaining.length === 0) {
          sendMessage(server, GAME_ENDED_MESSAGE_TYPE, {
            scores: playerScores,
          });
        }
      }

      sendMessage(
        server,
        ANSWER_RESULT_MESSAGE_TYPE,
        {
          isAccepted: isAccepted,
          score: playerScores[client.deviceId],
        },
        null,
        client.deviceId
      );
      // } else {
      //   sendError(client, "Game not running");
      // }
    }
  },
};

const sendMessage = (server, type, message, deviceType, deviceId) => {
  console.log("SENT", { type, message, deviceType, deviceId });
  server.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      (!deviceType || client.deviceType === deviceType) &&
      (!deviceId || client.deviceId === deviceId)
    ) {
      client.send(
        JSON.stringify({
          Type: type,
          ...message,
        })
      );
    }
  });
};

const sendError = (ws, message) => {
  const messageObject = {
    Type: "error",
    ...message,
  };

  ws.send(JSON.stringify(messageObject));
};

function InitialiseAnswers(answers) {
  gameAnswers = answers;
  answersRemaining = answers;
  currentAnswerIndex = 0;
  playerScores = {};
}

function ResetState() {
  gameAnswers = [];
  answersRemaining = [];
  currentAnswerIndex = -1;
  playerScores = {};
}
