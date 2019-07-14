# Running the pre-install

_LIRI_ is distributed with a `package.JSON` file which tracks the package dependencis needed for _LIRI_ to run. Before running _LIRI_ for the first time, be sure to run `npm install` from your node CLI.

# Adding Keys to LIRI

Create a file named `.env`, add the following to it, replacing the values with your API keys (no quotes) once you have them:

```js
# Spotify API keys

SPOTIFY_ID=your-Spotify-id
SPOTIFY_SECRET=your-Spotify-secret

# OMDB API keys

OMDB_KEY=your-OMDb-key

# Bands In Town keys

BANDSINTOWN_KEY=your-Bands-In-Town-key

```

# Keeping Your Keys Secret

Make a `.gitignore` file and add your .env file to it, if one does not exist already.
