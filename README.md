# liri-node-app

## Introduction

_LIRI_ is a language interpreting and recognition tool for users who want to search for songs, bands, artists, or movies.

Powered by the Bands-In-Town, Spotify and OMDB APIs, _LIRI_ will take in a user's search parameters and return relevant data from one or more API's.

## Process

### Using LIRI

_LIRI_ usage requires keys (and secrets) for each of the following APIs:

- [Node-Spotify-API](https://www.npmjs.com/package/node-spotify-api)
- [OMDB API](http://www.omdbapi.com)
- [Bands In Town API](http://www.artists.bandsintown.com/bandsintown-api)

These keys are stored in a .env file which is not distributed with _LIRI_. For setup, see the [setup_instructions](setup_instructions.ms) file

### User Information

_LIRI_ will prompt a user for their name after the welcome greeting. It is recommended that users choose a memorable and basic name, as this name becomes a filepath to their search history. For this reason, **user names are case sensitive** and should not include any of the following characters:

`! @ # $ % ^ & * ? / | \ ' " ; : , < > ~`

### Error Handling

The current version of _LIRI_ will not run if it is not able to log errors to `.lib/bin/err.log`, a degree of awareness in the coding model that I like to call being _insecure_. If you are getting errors, make sure you have read/write access to the LIRI root directory and any subdirectories. _LIRI_ will exit with a numeric status code equivalent to `err.errno` if the process.exit function is called from within
a file-system process.

All other errors encountered in the application are recorded in a session block in the `err.log` file. The session block is generated when _LIRI_ boots up. _LIRI_ will only exit on fatal errors that prevent error logging, user interaction, or data collection. In the current version, _LIRI_ is capable of storing search results in the `_user_.log` file. If the file is corrupted or otherwise inaccessible, _LIRI_ will still continue to function and print search results to the console.
