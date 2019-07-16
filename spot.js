var fs = require("fs");
var moment = require("moment");

fs.readFile("users/test.log", "utf8", function(err, data) {
  if (err) {
    console.log(err);
    return;
  }
  var obj = JSON.parse(data.split("\n")[1]).tracks;
  var array = obj.items;
  for (var i = 0; i < array.length; i++) {
    var artist = array[i].artists[0].name;
    var song = array[i].name;
    var duration = moment(array[i].duration_ms).format("mm:ss");
    var previewURL = array[i].preview_url;
    var album = array[i].album.name;
    console.log("=============result " + i + ":==============\n");
    console.log("==\tSong: " + song);
    console.log("==\tDuration: " + duration);
    console.log("==\tBand/Artist: " + artist);
    console.log("==\tAlbum: " + album);
    console.log("==\tPreview Url: " + previewURL);
    console.log("========================================\n");
  }
});

var omdb = {
  Title: "Guardians",
  Year: "2017",
  Rated: "Not Rated",
  Released: "23 Feb 2017",
  Runtime: "89 min",
  Genre: "Action, Sci-Fi",
  Director: "Sarik Andreasyan",
  Writer: "Andrey Gavrilov (screenplay), Sarik Andreasyan (story), Gevond Andreasyan (story)",
  Actors: "Anton Pampushnyy, Sanjar Madi, Sebastien Sisak, Alina Lanina",
  Plot:
    'During the Cold War, an organization called "Patriot" created a super-hero squad,which includes members of multiple Soviet republics. For years, the heroes had to hide their identities, but in hard times they must show themselves again.',
  Language: "Russian",
  Country: "Russia",
  Awards: "1 nomination.",
  Poster: "https://m.media-amazon.com/images/M/MV5BYzgxY2NkZGYtOGI4NC00MTc4LTlkY2QtNmRjOTU1NDI0NGQ1XkEyXkFqcGdeQXVyNTc4MjczMTM@._V1_SX300.jpg",
  Ratings: [{ Source: "Internet Movie Database", Value: "4.0/10" }],
  Metascore: "N/A",
  imdbRating: "4.0",
  imdbVotes: "9,899",
  imdbID: "tt4600952",
  Type: "movie",
  DVD: "N/A",
  BoxOffice: "N/A",
  Production: "N/A",
  Website: "N/A",
  Response: "True"
};
