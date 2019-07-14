//confirm that the file loads
console.log("loading keys...");

exports.spotify = {
  id: process.env.SPOTIFY_KEY,
  secret: process.env.SPOTIFY_SECRET
};

exports.omdb = {
  id: process.env.OMDB_KEY
};

exports.bands = {
  id: process.env.BANDSINTOWN_KEY
};

console.log("...complete");
