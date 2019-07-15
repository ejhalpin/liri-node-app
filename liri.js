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

const welcomePrompt = {
  type: "input",
  message:
    "\t\t===== Welcome to Liri! =====\n\n" +
    "I'm a language interpretation and recognition interface\n\n" +
    "To get started, how shall I refer to you (what's your call-sign, trucker)?\n\n",
  name: "login",
  validate: function(login) {
    var reservedChars = "~`!@#$%^&*()+={[}]|'\"\\:;<>,.?/";
    for (var i = 0; i < login.length; i++) {
      if (reservedChars.includes(login[i])) return "Your name should not include any of these characters: " + reservedChars;
    }
    return true;
  }
};

const searchPrompt = {
  type: "input",
  message:
    "what would you like to do? You can type: \n" +
    "concert-this <artist/band name>\n" +
    "spotify-this-song <song name>\n" +
    "movie-this <movie title>\n" +
    "do-what-it-says\n" +
    "-----------------------------------------\n" +
    "you can perfom these admin tasks as well\n" +
    "status\n" +
    "quit\n\n",
  name: "search",
  validate: function(search) {
    //validation on the search string
    //don't accept an empty string
    if (search.length === 0) return "You've got to give me something to work with.\n";
    if (search === "quit" || search === "status" || search === "history") return true;
    if (!search.includes("-")) return "Your search command must be in the format <option>-this.\n";
    else return true;
  }
};

const savePrompt = {
  type: "confirm",
  message: "would you like me to save your searh results?\n",
  name: "confirm"
};

function getErrorLog() {
  return new Promise(resolve => {
    fs.open(errlog, "r+", function(err, fd) {
      if (err) {
        logErrorToConsole(err);

        fs.appendFile(errlog, "**********\terror log created at " + moment().toString() + "\t**********\n", function(err) {
          if (err) {
            logErrorToConsole(err);
            process.exit(37);
          }
          resolve(true);
        });
      }
      if (fd) {
        fs.appendFile(errlog, "**********\tnew session started at " + moment().toString() + "\t**********\n", function(err) {
          if (err) {
            logErrorToConsole(err);
            process.exit(37);
          }
          resolve(true);
        });
      }
    });
  });
}

function search(source, query) {
  return new Promise(resolve => {
    switch (source) {
      case "concert":
        var splitters = [" ", "/", "?", "*", '"'];
        var joiners = ["%20", "%252F", "%253F", "%252A", "%27C"];
        for (var i = 0; i < splitters.length; i++) {
          var queryString = query.split(splitters[i]).join(joiners[i]);
        }
        axios
          .get("https://rest.bandsintown.com/artists/" + queryString + "/events?app_id=" + keys.bands)
          .then(function(response) {
            var result = [{ source, query, nres: response.data.length }];
            //parse the results
            for (var i = 0; i < response.data.length; i++) {
              var object = {
                date: moment(response.data[i].datetime).format("MM/DD/YYYY"),
                venueName: response.data[i].venue.name,
                location: response.data[i].venue.city + ", " + response.data[i].venue.region + ", " + response.data[i].venue.country
              };
              result.push(object);
            }
            //print the result to the console
            if (result.length === 1) {
              //no results to display
              console.log("==\tYour search for " + query + " did not yeild any results.\n\n");
              resolve(result);
              return;
            }
            console.log("===== I found the following event(s) featuring " + query + " =====\n");
            for (var j = 1; j < result.length; j++) {
              console.log("==\n\t" + j + ":");
              console.log("==\tVenue Name: " + result[j].venueName);
              console.log("==\tLocation: " + result[j].location);
              console.log("==\tEvent Date: " + result[j].date);
            }
            console.log("=================================================\n\n");
            resolve(result);
            return;
          })
          .catch(function(err) {
            logErrorToFile(err);
            resolve(undefined);
          });
        break;
      case "spotify":
        spotify.search({ type: "track", query: query }, function(err, data) {
          if (err) {
            logErrorToFile(err);
            resolve(undefined);
          }
          resolve(data);
        });
        break;
      case "movie":
        query = query.split(" ").join("+");
        axios
          .get("http://www.omdbapi.com/?t=" + query + "&y=" + year + "&plot=short&apikey=" + keys.omdb)
          .then(function(response) {
            resolve(response);
          })
          .catch(function(err) {
            logErrorToFile(err);
            resolve(undefined);
          });
        break;
      case "quit":
        console.log("\n\n========== Goodbye. ==========");
        process.exit(0);
        break;

      default:
        resolve(null);
    }
  });
}

function welcome() {
  //show the welcome dialogue
  return new Promise(resolve =>
    inquirer
      .prompt(welcomePrompt)
      .then(function(response) {
        fs.open("users/" + response.login + ".log", "r+", function(err, fd) {
          //an error will be thrown if the file is not found
          if (err) {
            //handle the file not found exception
            if (err.errno === -4058) {
              //create the file using append
              fs.appendFile(
                "users/" + response.login + ".log",
                response.login + " joined the liri community at " + moment().format("MM/DD/YYYY") + "\n",
                function(err) {
                  if (err) {
                    logErrorToFile(err);
                    logErrorToConsole(err);
                    process.exit(42);
                  } else {
                    console.log("==\tNice to meet you, " + response.login + "!\n\n");
                    resolve(response.login);
                  }
                }
              );
            }
            //Other errors (read/write permissions, etc.) will force LIRI to quit.
            else {
              logErrorToFile(err);
              logErrorToConsole(err);
              process.exit(42);
            }
          } else {
            console.log("==\tGood to see you again, " + response.login + "!\n\n");
            resolve(response.login);
          }
        });
      })
      .catch(function(err) {
        logErrorToFile(err);
        logErrorToConsole(err);
        process.exit(66);
      })
  );
}

function getSearchCriteria() {
  return new Promise(resolve =>
    inquirer
      .prompt(searchPrompt)
      .then(function(response) {
        resolve(response.search);
      })
      .catch(function(err) {
        logErrorToFile(err);
        logErrorToConsole(err);
        process.exit(66);
      })
  );
}

function saveToFile(file, array) {
  return new Promise(resolve => {
    fs.appendFile(file, JSON.stringify(array), function(err) {
      if (err) {
        logErrorToFile(err);
        resolve("==\tSorry. I've run into some difficult saving your result: " + err.message);
      }
      resolve("==\tOkay. I've saved your search result to your profile.");
    });
  });
}

function getStatus(user) {
  return new Promise(resolve => {
    fs.readFile("users/" + user + ".log", "utf8", function(err, data) {
      if (err) {
        logErrorToFile(err);
        resolve("Sorry. I've run into some difficulty retreiving your status: " + err.message);
      }
      //get the sign-up date for the user
      var status = data
        .split("\n")
        .shift()
        .split(" ")
        .pop();
      resolve(status);
    });
  });
}

function promptToSave() {
  return new Promise(resolve => {
    inquirer
      .prompt(savePrompt)
      .then(function(response) {
        resolve(response.confirm);
      })
      .catch(function(err) {
        logErrorToFile(err);
        logErrorToConsole(err);
        process.exit(66);
      });
  });
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
//a function that will check to see if keys are valid.
//function returns a promise array in the fomat [message, keys, spotify, omdb, bandsintown]
//the elements after message are boolean values -> true if key exists, false otherwise
function validateKeys() {
  return new Promise(resolve => {
    var array = ["", false, false, false, false];
    if (keys === undefined || keys === null) {
      array[0] = "I can't find my keys. Without my keys, I can't go anywhere.";
      resolve(array);
      return;
    }
    if (keys.spotify) {
      if (keys.spotify.id.length === 0 || keys.spotify.secret === 0 || keys.spotify.id === undefined || keys.spotify.secret === undefined) {
        array[0] = array[0] + "Spotify Key Missing. You won't be able to search for music or artis/band info from Spotify.\n";
      } else {
        array[0] = array[0] + "Spotify Keys found.\n";
        array[2] = true;
      }
    }
    if (keys.omdb) {
      if (keys.omdb.id.length === 0 || keys.omdb.id === undefined) {
        array[0] = array[0] + "OMDb Key Missing. You won't be able to search for movie info from OMDb.\n";
      } else {
        array[0] = array[0] + "OMDb Keys found.\n";
        array[3] = true;
      }
    }
    if (keys.bands) {
      if (keys.bands.id.length === 0 || keys.bands.id === undefined) {
        array[0] = array[0] + "Bands In Town Key Missing. You won't be able to search for band/artist events or info from Bands In Town.\n";
      } else {
        array[0] = array[0] + "Bands In Town Keys found.\n";
        array[4] = true;
      }
    }
    resolve(array);
  });
}

async function liri() {
  console.log("********** LIRI is booting up **********");
  var keyMessageArray = await validateKeys();
  console.log("==\tValidating API Keys...");
  var keyMessages = keyMessageArray[0].split("\n");
  for (var i = 0; i < keyMessages.length; i++) {
    await sleep(250);
    console.log("==\t\t" + keyMessages[i]);
  }
  await sleep(200);
  console.log("==\tBecoming insecure (reviwing error history)");
  await getErrorLog();
  await sleep(150);
  console.log("********** Complete. LIRI is ready to rock! **********\n\n");
  var user = await welcome();
  var searchCount = 0;
  var savedSearches = 0;
  var awake = true;
  while (awake) {
    var searchString = await getSearchCriteria();
    if (searchString === "status") {
      var status = await getStatus(user);
      console.log("===== " + user + " has been working with liri since " + status + " =====");
      console.log("==\tSession Status:");
      console.log("==\tSearches: " + searchCount);
      console.log("==\tSaved Searches: " + savedSearches);
      console.log("=================================================\n\n");
      continue;
    }
    var source = searchString.split("-")[0];
    var query = searchString
      .split(" ")
      .slice(1)
      .join(" ");
    var result = await search(source, query);
    if (result.length === 1) {
      continue;
    }
    var confirm = await promptToSave();
    if (confirm) {
      console.log("==\tHang on a moment.\n");
      var message = await saveToFile("users/" + user + ".log", result);
      console.log(message + "\n\n");
      if (message.includes("Okay")) {
        savedSearches++;
      }
    }
    searchCount++;
  }
}
liri();
//if a profile is made...
/*
 * prompt for a name
 * look for a user file associated with that name - OR - make one in the format ./users/name.log
 * if name.log exists - let the user know that you found their search history and print options for using liri
 */
/*
spotify query format:
spotify.search({ type: <type>, query: <query>}).then(callback).catch(errFunction);
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
