# liri-node-app

## Introduction

_LIRI_ is a language interpreting and recognition tool for users who want to search for songs, bands/artists events, or movies.

Powered by the Bands-In-Town, Spotify and OMDB APIs, _LIRI_ will take in a user's search parameters and return relevant data from one or more API's.

_LIRI_ is a node command line tool built with **dotenv**, **fs**, **axios**, **inquirer**, and **moment** packages that utilizes the Javascript **async/await** functionality to provide a synchronous user esperience. Utilizing async/await ensuers that API data that is retrived is printed to the console before the next inquirer request for data reaches the user. It also provides for simple timeouts that used to prevent cascading data to the console that detracts from the user experience.

## Organization

_LIRI_ is organized into a host of process functions, each of which returns a promise to the _LIRI_ runtime which are then resolved into useable data. The process functions handle inquirer promts (which return a promise that resolves down to user inputs), API get requests through axios or the node spotify wrapper (which return a promise that resolves down to API data), and read/write/append file processes (which return a promise that resolves down to a string or boolean value).

The _LIRI_ runtime is an asynchronous function that handles control flow, parses user inputs, and makes calls to process functions to execute user commands. Through the implementation of async/await, a simple loop is utilized to return the user to the main search and admin options promt. I prefer this technique over recursive calls and chained callback functions because it makes the code more readable and preserves the traditional top-down execution model of synchronous code.

You can see the code as I discuss it in deatil in this [video](./.lib/assets/videos/liri-code.mp4)

## Process

### Using LIRI

_before using *LIRI* you will need to populate a .env file with API keys. Please see the [setup_instructions](./setup_instructions.md) for more information._

A user must provide a user name in response to the welcome prompt. User names are not case sensitive. They also may not contain certain characters. See the section on **User Information** below. Once a user has provided a name, _LIRI_ will prompt the user with a list of possible commands. These commands are divided up into two sections:

- Search Commands
  - `concert this <band/artist>`
  - `spotify-this <song title>`
  - `movie-this <movie title>`
  - `surprise-me`
- Administrative Commands
  - `status`
  - `history`
  - `quit`

Entering any of these commands will cause _LIRI_ to perform the corresponsing action. The Search commands perform get requests to the connected APIs and return parsed data to the console. After returning and displaying the data, the user will be prompted with a confirmation _(y/n)_ dialogue to save their search results. If the user chooses to save the result, the data object is stringified and appended to their user file. Otherwise, the results persist in the console but are lost in memory when _LIRI_ promts the user for their next input. The administrative commands interact with the user file through the _fs_ package and will print data to the console.

### What each command does

`concert this <band/artist>` performs a GET request using _axios_ to the **Bands In Town** API search endpoint. The result will contain upcoming events for the artist/band and the detailed response object will have

- the artist name
- the venue name
- the venue location
- the date of the event, formatted to `MM/DD/YYYY`

`spotify-this-song <song title>` performs a search using the _node-spotify-api_ package, a simple wrapper that facilitates easy-to-format requests to the **Spotify** API search endpoint. The result will contain an array of results, each of which will show

- the song name
- the song duration
- the artist/band
- the album name
- the spotify preview url (if any)

`movie-this <movie title>` performs a search using _axios_ to the **OMDb** API search endpoint. The result will contain a single object that will contain

- the movie title
- the release year
- the country of origin
- the language
- the cast
- the plot (short format)
- \*reviews for the movie

\*the reviews are returned in an array and the array is looped over to display the review source and value. This prevents errors in data parsing because the API result object does not contain consistent review objet keys.

`surprise-me` is a syntax that deviates from the recommended `do-what-it-says` command in the assignment. This command uses the _fs_ package to read and parse data from _random.rnd_. The file contains pre-formatted search commands that are read into an array. A single command is selected at random from the array and passed into the _LIRI_ runtime as though a user had typed the command. Data is returned in the usual manner and the user is prompted to save their result.

`status` uses _fs_ to access the `_user_.log` file, parse the information contained within, and return a JSON object that contains user specific data. This data is then printed to the console. The current version of _LIRI_ only collects information about the `date` that a user first logged in, the number of `searches` that a user has made, and the number of `saves` that the user has performed. This information is then combined with the current session data and displayed to the user.

`history` uses the _fs_ package to access the `_user_.log` file, parse the information within, and return an array of JSON objects containing previous search data. This data is then looped over and printed to the console for the user to view.

`quit` triggers _LIRI_ to update the `_user_.log` file to include current session data. The program then exits using `process.exit(0)`.

## Previews

- A [video](./.lib/assets/videos/liri-files.mp4) where I go over the file system that LIRI lives in and interacts with

- A [video](./.lib/assets/videos/liri-code.mp4) where I talk thorugh the code structure and what each of the functions does. I mention that the discussion is _hight level_ in the video. It is not. It's as nitty as it is gritty.

- A [video](./.lib/assets/videos/liri-node-app.mp4) where I give a live demo of the app in use and show all of the _LIRI_ features and functionality.

### Requirements

_LIRI_ usage requires keys (and secrets) for each of the following APIs:

- [Node-Spotify-API](https://www.npmjs.com/package/node-spotify-api)
- [OMDB API](http://www.omdbapi.com)
- [Bands In Town API](http://www.artists.bandsintown.com/bandsintown-api)

These keys are stored in a .env file which is not distributed with _LIRI_. For setup, see the [setup_instructions](./setup_instructions.md) file

### User Information

_LIRI_ will prompt a user for their name after the welcome greeting. It is recommended that users choose a memorable and basic name, as this name becomes a filepath to their search history. For this reason, **user names are case sensitive** and should not include any of the following characters:

`! @ # $ % ^ & * ? / | \ ' " ; : , < > ~`

### Error Handling

The current version of _LIRI_ will not run if it is not able to log errors to `.lib/bin/err.log`, a degree of awareness in the coding model that I like to call being _insecure_. If you are getting errors printed to the console, make sure you have read/write access to the _LIRI_ root directory and any subdirectories. _LIRI_ will exit with a numeric status code equivalent to `err.errno` if the process.exit function is called from within a file-system process. There are three distinct numeric exit codes that are used for system level exits:

- `0` -> a user quits the program by typing 'quit'
- `37` -> _LIRI_ is unable to read/write to the error log during bootup
- `66` -> _inquirer_ is encountering errors which prevent user data from reaching the _LIRI_ runtime

All other errors encountered in the application are recorded in a session block in the `err.log` file. The session block is generated when _LIRI_ boots up. _LIRI_ will only exit on fatal errors that prevent error logging, user interaction, or data collection. In the current version, _LIRI_ is capable of storing search results in the `_user_.log` file. If the file is corrupted or otherwise inaccessible, _LIRI_ will still continue to function and print search results to the console.
