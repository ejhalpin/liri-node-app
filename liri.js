//Read and set the environment variables to mask the API keys
require("dotenv").config();
//pull in the keys from keys.js
const keys = require("./keys.js");
//pull in our package dependencies
const fs = require("fs");
const inquirer = require("inquirer");
const axios = require("axios");
const moment = require("moment");
//configure the spotify api
const Spotify = require("node-spotify-api");
const spotify = new Spotify(keys.spotify);
//hold a reference to the err.log file
const errlog = ".lib/bin/err.log";
var responses = []; //a place to hold response data that can be accessed from within async functions
//error handling for errors that cannot be logged to the err.log file
function logErrorToConsole(err) {
  console.log(
    "Liri has an encountered an error. Please see the github issues board or contact Eugene -> ejhalpin3@gmail.com and provide him with the following error details:"
  );
  console.log("========================================");
  console.log(err);
  console.log("========================================");
}
//error handling for all other documentable errors
function logErrorToFile(err) {
  fs.appendFile(errlog, "error encountered at liri.js line 104 ==>" + err + "\n\n", function(err) {
    if (err) {
      logErrorToConsole(err);
      return process.exit(err.errno);
    }
  });
}
//a global variable informing LIRI about the read/write status of a user's profile
var canSave = false;

//validation functions
function validateLoginName(var1, var2) {
  if (var1) {
    console.log(var1);
  }
  if (var2) {
    console.log(var2);
  }
  return true;
}

//From here on in everything is asynchronous so there will be a lot of nested and chained functions
function checkQuit(string) {
  if (string.toLowerCase().trim() === "quit") {
    console.log("\n\n========== Goodbye. ==========");
    process.exit(0);
  }
}
//attempt to open the error log for LIRI.
//If it doesn't exits, create it with a time stamp
//if it does exist, append it with a session time stamp

fs.open(errlog, "r+", function(err, fd) {
  if (err) {
    var now = new Date().getTime();
    fs.appendFile(errlog, "**********\terror log created at " + now.toString() + "\t**********\n", function(err) {
      if (err) {
        logErrorToConsole(err);
        return process.exit(err.errno);
      }
    });
  } else {
    var now = new Date().getTime();
    fs.appendFile(errlog, "**********\tnew session started at " + now.toString() + "\t**********\n", function(err) {
      if (err) {
        logErrorToConsole(err);
        return process.exit(err.errno);
      }
    });
  }
});
//on load, Liri will prompt the user for their name
inquirer
  .prompt([
    {
      type: "input",
      message:
        "\t\t===== Welcome to Liri! =====\n\n" +
        "I'm a language interpretation and recognition interface\n\n" +
        "You can quit at any text input prompt by entering 'quit'\n\n" +
        "To get started, how shall I refer to you (what's your call-sign, trucker)?\n\n",
      name: "login",
      validate: function(login) {
        checkQuit(login);
        var reservedChars = "~`!@#$%^&*()+={[}]|'\"\\:;<>,.?/";
        for (var i = 0; i < login.length; i++) {
          if (reservedChars.includes(login[i])) return "Your name should not include any of these characters: " + reservedChars;
        }
        return true;
      }
    }
  ])
  .then(function(response) {
    responses.push(response);
    //check to see if the user has signed in before
    fs.open("users/" + response.login + ".log", "r+", function(err, fd) {
      if (err) {
        //handle the file not found error
        if (err.errno === -4058) {
          //the file does not exist -> create it
          fs.appendFile(
            "users/" + response.login + ".log",
            response.login + " joined the Liri community at " + new Date().getTime().toString() + "\n",
            function(err) {
              if (err) {
                logErrorToFile(err);
                canSave = false;
              } else {
                canSave = true;
                console.log("Thanks, " + response.login + ". I've set up your profile. Let's get started. You can quit LIRI by typing 'quit' at any prompt.");
                return;
              }
            }
          );
        } else {
          canSave = false;
          logErrorToFile(err);
          return;
        }
      }
      if (fd) {
        canSave = true;
        console.log("Okay, " + response.login + "! I found your search history. Let's get started. You can quit LIRI by typing 'quit' at any prompt.");
      }
    });
    console.log("async check");
  });

//after the user is signed in, prompt for their search
function searchPrompt() {
  inquirer
    .prompt([
      {
        type: "input",
        message:
          "what would you like to do? You can type: \n" +
          "concert-this <artist/band name>\n" +
          "spotify-this-song <song name>\n" +
          "movie-this <movie title>\n" +
          "do-what-it-says for a random search\n" +
          "quit\n\n",
        name: "search",
        validate: function(search) {
          checkQuit(search);
          //any validation on the search string
          if (search.length === 0) return false; //don't accept an empty string
        }
      }
    ])
    .then(function(response) {
      //take in the response, parse it, and perform the search. Return data to the console
      //and print the data to the user's file.
    });
}
//if a profile is made...
/*
 * prompt for a name
 * look for a user file associated with that name - OR - make one in the format ./users/name.log
 * if name.log exists - let the user know that you found their search history and print options for using liri
 */
/*
spotify query format:
search: function({ type: <type>, query: <query>}).then(callback).catch(errFunction);
where type can take values of : artist OR album OR track
query is a space separated string - no pre-formatting is needed
*/

/*
axios calls -- requires pre-formatting

OMDB: 
axios.get("http://www.omdbapi.com/?t=remember+the+titans&y=&plot=short&apikey=<api key>")
.then( Function(response) {...})
.catch(function(err){...})

Bands In Town
-artist info-
axios.get("https://rest.bandsintown.com/artists/<artist>?app_id=<api key>")
.then( Function(response) {...})
.catch(function(err){...})

-artist events-
axios.get("https://rest.bandsintown.com/artists/<artist name>/events?app_id=<api key>&date=<date string>")
.then( Function(response) {...})
.catch(function(err){...})

where <date string> is one of several values:
  - "upcoming" => returns upcoming events
  - "past" => returns only past events
  - "all" => returns both past and upcoming events
  - date range e.g. "2015-05-05,2017-05-05" => returns events within a range

NOTE that typical url character substitutions are required for url search values
_ _ => %20
_/_ => %252F
_?_ => %253F
_*_ => %252A
_"_ => %27C
*/
