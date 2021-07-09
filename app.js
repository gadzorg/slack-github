/* required dependencies */
var request = require("request");
var express = require("express");
var bodyParser = require("body-parser");

/* app instance */
var app = express();

/* app configurations */
// parse application/json
app.use(bodyParser.json());

/* redirects to GitHub Repo of the module */
app.get("/", function (_req, res) {
  res.redirect("https://github.com/gadzorg/slack-github");
});

/* config variables */
var channel = process.env.CHANNEL;
var username = process.env.USERNAME;
var url = process.env.URL;

/* returns genarated message to send using request payload by GitHub */
var generateMessage = function (req) {
  var result = "";

  var data = req.body;

  for (var i = 0; i < data.commits.length; i++) {
    var { commit } = data.commits[i];
    var repo = data.repository;

    result +=
      "<@" +
      commit.author.name +
      ">" +
      " <" +
      commit.url +
      "|committed> in <" +
      repo.url +
      "|" +
      repo.name +
      "> : " +
      commit.message;
    result += "\n";
  }

  return result;
};

/*
triggers on a POST request by GitHub webhook
and send message to slack-channel, according to commit detail
*/
app.post("/", function (req, res) {
  /* works only, if url config var is there */
  if (url) {
    console.log("Responding to event '%s'", req.headers["x-github-event"]);
    if (req.headers["x-github-event"] === "ping") {
      return res.json({ value: "pong" });
    }

    if (req.headers["x-github-event"] !== "push") {
      return res.sendStatus(204);
    }

    var options = {};
    options.url = url;
    options.method = "POST";

    /* use default channel and username if they are not present in config */
    options.body = {};
    if (channel) {
      options.body["channel"] = "#" + channel;
    }
    if (username) {
      options.body["username"] = "" + username;
    }
    console.log("Would be sending message '%s'", generateMessage(req));
    options.body["text"] = generateMessage(req);

    options.json = true;

    request(options, function (_err, response, _body) {
      var statusCode = response.statusCode;
      res.sendStatus(statusCode);
    });
  }
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("express server listening on " + port);
});
