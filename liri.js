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
  fs.appendFile(errlog, "error encountered ==>" + err + "\n\n", function(err) {
    if (err) {
      logErrorToConsole(err);
      return process.exit(err.errno);
    }
  });
}
//The prompt objects used with inquirer
const welcomePrompt = {
  type: "input",
  message:
    "\t===== Welcome to Liri! =====\n\n" +
    "==\tI'm a language interpretation and recognition interface\n\n" +
    "==\tTo get started, how shall I refer to you (what's your call-sign, trucker)?\n\n",
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
    "\t===== what would you like to do? =====\n" +
    "==\tconcert-this <artist/band name>\n" +
    "==\tspotify-this-song <song name>\n" +
    "==\tmovie-this <movie title>\n" +
    "==\tsurprise-me\n" +
    "-----------------------------------------\n" +
    "==\tyou can perfom these admin tasks as well\n" +
    "==\tstatus\n" +
    "==\thistory\n" +
    "==\tquit\n\n",
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

//loading the error log
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
//update the user statistics in the user/name.log file
function updateUserStats(user, sessionSearch, sessionSave) {
  return new Promise(resolve => {
    fs.readFile("users/" + user + ".log", "utf8", function(err, data) {
      if (err) {
        logErrorToFile(err);
        resolve(false);
        return;
      }
      var fileContents = data.split("\n");
      var obj = JSON.parse(fileContents[0]);
      obj.searches += sessionSearch;
      obj.saves += sessionSave;
      fileContents[0] = JSON.stringify(obj);
      var fileString = "";
      fileContents.forEach(line => {
        if (line.length === 0) {
          return;
        }
        fileString += line + "\n";
      });
      fs.writeFile("users/" + user + ".log", fileString, function(err) {
        if (err) {
          logErrorToFile(err);
          resolve(false);
        }
        resolve(true);
      });
    });
  });
}
//the search routines
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
          .get("https://rest.bandsintown.com/artists/" + queryString + "/events?app_id=" + keys.bands.id)
          .then(function(response) {
            var result = { source, query, nres: response.data.length, results: [] };
            //there is a chance that the bandsintown api will return a new line character!

            //parse the results
            for (var i = 0; i < response.data.length; i++) {
              var object = {
                date: moment(response.data[i].datetime).format("MM/DD/YYYY"),
                venueName: response.data[i].venue.name,
                location: response.data[i].venue.city + ", " + response.data[i].venue.region + ", " + response.data[i].venue.country
              };
              result.results.push(object);
            }
            //print the result to the console
            if (result.results.length === 0) {
              //no results to display
              console.log("==\tYour search for " + query + " did not yeild any results.\n\n");
              resolve(result);
              return;
            }
            console.log("===== I found the following event(s) featuring " + query + " =====\n");
            for (var j = 0; j < result.results.length; j++) {
              console.log("==\n\t" + j + ":");
              console.log("==\tVenue Name: " + result.results[j].venueName);
              console.log("==\tLocation: " + result.results[j].location);
              console.log("==\tEvent Date: " + result.results[j].date);
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
            console.log(err);
            resolve(undefined);
          }
          var result = { source, query, nres: data.tracks.items.length, results: [] };

          for (var i = 0; i < data.tracks.items.length; i++) {
            var artist = data.tracks.items[i].artists[0].name;
            var song = data.tracks.items[i].name;
            var duration = moment(data.tracks.items[i].duration_ms).format("mm:ss");
            var previewURL = data.tracks.items[i].preview_url;
            var album = data.tracks.items[i].album.name;
            console.log("=============result " + i + ":==============\n");
            console.log("==\tSong: " + song);
            console.log("==\tDuration: " + duration);
            console.log("==\tBand/Artist: " + artist);
            console.log("==\tAlbum: " + album);
            console.log("==\tPreview Url: " + previewURL);
            console.log("========================================\n");
            var obj = {
              artist,
              song,
              duration,
              previewURL,
              album
            };
            result.results.push(obj);
          }
          resolve(result);
        });
        break;
      case "movie":
        query = query.split(" ").join("+");
        axios
          .get("http://www.omdbapi.com/?t=" + query + "&apikey=" + keys.omdb.id)
          .then(function(response) {
            result = { source, query, nres: 1, results: [] };
            var title = response.data.Title;
            var year = response.data.Year;
            var Ratings = response.data.Ratings;
            var originCountry = response.data.Country;
            var language = response.data.Language;
            var plot = response.data.Plot;
            var cast = response.data.Actors;
            console.log("========================================\n");
            console.log("==\tTitle: " + title);
            console.log("==\tYear: " + year);
            console.log("==\tCountry: " + originCountry);
            console.log("==\tLanguage: " + language);
            console.log("==\tCast: " + cast);
            console.log("==\tPlot: " + plot);
            for (var i = 0; i < Ratings.length; i++) {
              console.log("==\t" + Ratings[i].Source + ": " + Ratings[i].Value);
            }
            console.log("========================================\n");
            var object = {
              title,
              year,
              originCountry,
              language,
              cast,
              plot,
              Ratings
            };
            result.results.push(object);
            resolve(result);
          })
          .catch(function(err) {
            logErrorToConsole(err);
            logErrorToFile(err);
            resolve(undefined);
          });
        break;

      default:
        console.log("default statement reached in search switch");
        resolve(undefined);
    }
  });
}
//the welcome function, which finds or creates the users/user.log file
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
              var userData = {
                joinDate: moment().format("MM/DD/YYYY"),
                searches: 0,
                saves: 0
              };
              fs.appendFile("users/" + response.login + ".log", JSON.stringify(userData) + "\n", function(err) {
                if (err) {
                  logErrorToFile(err);
                  logErrorToConsole(err);
                  process.exit(42);
                } else {
                  console.log("==\tNice to meet you, " + response.login + "!\n\n");
                  resolve(response.login);
                }
              });
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
//the function to show search prompt and return user input
function getSearchCriteria() {
  return new Promise(resolve =>
    inquirer
      .prompt(searchPrompt)
      .then(function(response) {
        resolve(response.search.trim());
      })
      .catch(function(err) {
        logErrorToFile(err);
        logErrorToConsole(err);
        process.exit(66);
      })
  );
}
//a routine to append an object to a file
function saveToFile(file, object) {
  return new Promise(resolve => {
    fs.appendFile(file, JSON.stringify(object) + "\n", function(err) {
      if (err) {
        logErrorToFile(err);
        resolve("==\tSorry. I've run into some difficult saving your results: " + err.message);
      }
      resolve("==\tOkay. I've saved the results to your profile.");
    });
  });
}
//a routine to read the first line from a user.log file and return the stats therein
function getStatus(user) {
  return new Promise(resolve => {
    fs.readFile("users/" + user + ".log", "utf8", function(err, data) {
      if (err) {
        logErrorToFile(err);
        resolve("Sorry. I've run into some difficulty retreiving your status: " + err.message);
      }
      //get the sign-up date for the user
      var status = data.split("\n").shift();
      resolve(JSON.parse(status));
    });
  });
}
//a routine to promt the user to save search data and return user input
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
//a routine to pause for some number of milliseconds
function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
//a function to read a random entry from the random.rnd file
function getRandom() {
  return new Promise(resolve => {
    fs.readFile(".lib/bin/random.rnd", "utf8", function(err, data) {
      if (err) {
        logErrorToFile(err);
        console.log("==\tI'm having some difficulty surprising you. Check the error log.");
        resolve(undefined);
      }
      var results = data.split("\n");
      results.forEach(result => {
        result = result.trim();
      });

      results.sort(function(a, b) {
        return Math.random() - 0.5;
      });

      resolve(results[0]);
    });
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
//a routine to return the full saved search data stored in the user.log file
function getHistory(user) {
  return new Promise(resolve => {
    var history = [];
    fs.readFile("users/" + user + ".log", "utf8", function(err, data) {
      if (err) {
        logErrorToFile(err);
        resolve(history);
        return;
      }
      var results = data.split("\n");
      for (var i = 1; i < results.length - 1; i++) {
        history.push(JSON.parse(results[i]));
      }
      resolve(history);
    });
  });
}

function testSurprise() {
  return new Promise(resolve => {
    fs.readFile(".lib/bin/random.rnd", "utf8", function(err, data) {
      if (err) {
        resolve([]);
        return;
      }
      var results = data.split("\n");
      resolve(results);
    });
  });
}
//the literal runtime for the LIRI CLI
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
  await sleep(250);
  console.log("********** Complete. LIRI is ready to rock! **********\n\n");
  var user = await welcome();
  var searchCount = 0;
  var savedSearches = 0;
  var awake = true;
  while (awake) {
    var searchString = await getSearchCriteria();
    await sleep(250);
    if (searchString === "quit") {
      var success = await updateUserStats(user, searchCount, savedSearches);
      if (success) {
        console.log("==\tSaving session data...");
        await sleep(300);
        console.log("==\t\t...complete");
      } else {
        console.log("==\tUnable to save session data. Sorry.");
      }
      console.log("\n\n========== Goodbye. ==========");
      process.exit(0);
    }
    if (searchString === "status") {
      var status = await getStatus(user);
      console.log("===== " + user + " has been working with liri since " + status.joinDate + " =====");
      console.log("==\tSession Status:");
      console.log("==\tSearches: " + (status.searches + searchCount));
      console.log("==\tSaved Searches: " + (status.saves + savedSearches));
      console.log("=================================================\n\n");
      await sleep(500);
      continue;
    }
    if (searchString === "history") {
      var history = await getHistory(user);
      if (history.length === 0) {
        console.log("==\tI couldn't find any search history.\n\n");
        await sleep(300);
        continue;
      }
      for (var i = 0; i < history.length; i++) {
        await sleep(300);
        console.log("==\tResult " + i);
        console.log(JSON.stringify(history[i], null, 2));
      }
      console.log("=================================================\n\n");
      continue;
    }
    if (searchString === "surprise-me") {
      searchString = await getRandom();
      searchString.trim();
      await sleep(250);
      if (searchString === undefined || searchString.length === 0) {
        continue;
      }
    }
    var source = searchString.split("-")[0];
    var query = searchString
      .split(" ")
      .slice(1)
      .join(" ")
      .trim();
    var result = await search(source, query);
    if (result === undefined || result === null) {
      console.log("==\tThere was a problen retreiving your results. Check the error log.");
      continue;
    }
    if (result.results.length === 0) {
      continue;
    }
    await sleep(500);
    var confirm = await promptToSave();
    if (confirm) {
      console.log("==\tHang on a moment.\n");
      await sleep(500);
      var message = await saveToFile("users/" + user + ".log", result);
      console.log(message + "\n\n");
      if (message.includes("Okay")) {
        savedSearches++;
      }
    }
    searchCount++;
  }
  await sleep(550);
}
//execute liri
liri();

/*some additional info about the APIs:

spotify query format:
spotify.search({ type: <type>, query: <query>}).then(callback).catch(errFunction);
where type can take values of : artist OR album OR track
query is a space separated string - no pre-formatting is needed
<-------------------------------------------------------------------------------------->
axios calls -- requires pre-formatting

OMDB: 
axios.get("http://www.omdbapi.com/?t=<title>&apikey=<api key>")
.then( Function(response) {...})
.catch(function(err){...})
where title is a '+' seprated string, ex: Batman Begins -> Batman+Begins
<-------------------------------------------------------------------------------------->
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
