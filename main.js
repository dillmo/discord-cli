#!/usr/bin/env node

// TODO: Error handling

const Discord = require("discord.js");
const Readline = require("readline");

var channelName = "common-room";

var client = new Discord.Client();

const rl = Readline.createInterface({
  input:  process.stdin,
  output: process.stdout
});

// Lists last 50 messages in the current channel
function listMessages() {
  client.getChannelLogs(client.channels.get("name", channelName), (err, msgs) => {
    if (msgs) {
      msgs.reverse().forEach((msg) => {
        console.log("[" + msg.author.name + "] " + msg.content);
      });
      rl.setPrompt("["+ client.user.name + "] ");
      rl.prompt();
    } else {
      setTimeout(listMessages, 10);
    }
  });
}

// Like listsMessages, but clears the screen first
function updateMessages() {
  console.log("\033[2J");
  listMessages();
}

// Like updateMessages, but doesn't fire for other channels and displays a
// prompt
function updateMessagesPrompt(msg) {
  if (msg.channel.name == channelName) {
    updateMessages();
    rl.prompt(true);
  }
}

// Gather user credentials, then login
rl.question("Email: ", (email) => {
  rl.question("Password: ", (password) => {
    login(email, password);
  });
});

// Log into the server and list all messages
function login(email, password) {
  client.login(email, password, () => {
    listMessages();
  });
}

// This callback is fired whenever the user hits Enter
// Sends the message the user typed to the server
rl.on("line", (msg) => {
  if (msg[0] == "/") {
    switch (msg) {
      case "/list-users":
        var users = client.users.getAll("status", "online");
        while (users.get("status", "online")) {
          var user = users.get("status", "online");
          console.log(user.name);
          users.remove(user);
        }
        break;
      case String(msg.match(/^\/set-channel.*/)):
        channelName = msg.replace(/.*\s(.*)$/, "$1");
        updateMessages();
        break;
      case "/exit":
        rl.close();
        client.logout();
        return;
      default:
        console.log("Command not found");
    }
  } else {
    client.sendMessage(client.channels.get("name", channelName), msg);
  }
  rl.prompt();
});

// These callbacks fire whenever messages change
// updateMessagesPrompt avoids updating for different channels to prevent unnecessary redraws
client.on("message", (msg) => {
  if (msg.author.name != client.user.name) {
    updateMessagesPrompt(msg);
  }
});

client.on("messageDeleted", (msg) => {
  updateMessagesPrompt(msg);
});

client.on("messageUpdated", (msg) => {
  updateMessagesPrompt(msg);
});
