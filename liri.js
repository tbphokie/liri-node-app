//Required packages here
var fs = require("fs");
var keys = require("./keys.js");
var Twitter = require('twitter');
var Spotify = require('node-spotify-api');
var request = require('request');
//var readline = require('readline');

//Global variables here for command line input
var lCmd = process.argv[2];
var inputs = " ";

//in case some input comes in without quotes
for(i=3; i< process.argv.length; i++){

    inputs += process.argv[i];
    inputs += " ";
}
inputs = inputs.trim();


//Detect which command is input by user
function start(){
    switch(lCmd){
        case 'my-tweets':
            Tweets();
            break;
        case 'spotify-this-song':
            SpotifyCall(inputs);
            break;
        case 'movie-this':
            Movie(inputs);
            break;
        case 'do-what-it-says':
            Do();
            break;
        default:
            console.log("my-tweets, spotify-this-song, movie-this and do-what-it-says are the only commands accepted.  Check your input.");
            break;
        
    }
}

function Tweets(){
    var outputText = "";
    var client = new Twitter({
        consumer_key: keys.twitterKeys['consumer_key'],
        consumer_secret: keys.twitterKeys['consumer_secret'],
        access_token_key: keys.twitterKeys['access_token_key'],
        access_token_secret: keys.twitterKeys['access_token_secret']
    });

    var params = {screen_name: 'terribfly'};
    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error && response.statusCode === 200) {
            var cnt = 0;
            //Number of tweets being returned is defaulted to 20, but just in case it's not
            if(tweets.length > 20)
                cnt = 20;
            else
                cnt = tweets.length;
            outputText = "--------------------------------------\n";
            outputText += "Tweets: \n";
            for(var i=0; i< cnt; i++){
               
                outputText += "\tDate Created: " + tweets[i].created_at + "\t" + tweets[i].text+ "\n";
            }
        }
        else{
            outputText += "\tCannot access timeline at this time.\n";
        }
        console.log(outputText);
        fs.appendFile('log.txt', outputText, function (err) {
            if (err){
            throw err; 
        } 
 
        });
    });
}

function SpotifyCall(text){
    var artists = "";
    var outputText;
    var searchText;
    var spotify = new Spotify({
        id: '8991056be7c940daa71f15df8b838fce',
        secret: '03e392ec95b2410182f6329d4e305998'
    });
 
    //Check if user didn't enter a song, if so set it to The Sign; also remove quotes and extra spaces
    if(text == "")
        text = "The Sign";

    //Trying to figure out how to get it to return ace of base The Sign instead of harry styles' Sign of the Times 
    //text = text.replace(/"/g, '');
    //text = text.replace(/'/g, '');
    text = text.trim();
    searchText = text;
    if(text.indexOf(" ") > -1){ //make sure the search param is in quotes if there is a space
        if((text[0] === '"' || text[0] === '\'') && (text[text.length-1] === '"' || text[text.length-1] === '\'')) {   //no need to add
            searchText = `track:${text}`; 
        } else {
            searchText = `track:'${text}'`;        
        }
    }

//    console.log("Spotify Input: " + searchText);
    searchText = encodeURI(searchText);
//    console.log("Spotify Input: " + searchText);


    outputText = "--------------------------------------\n";
    outputText += `Music Search for ${text}\n`;
    spotify.search({ type: 'track', query: searchText }, function(err, data) {
        if (err) {
            return console.log('\tError occurred: ' + err);
        }

        if(data.tracks.total != 0){

            for(var i=0; i< data.tracks.items.length; i++){
                outputText += "\t--------------------------------------\n";
                for(var j=0;j<data.tracks.items[i].artists.length; j++){
                    artists += data.tracks.items[i].artists[0].name;
                    artists += " ";
                }
                outputText += "\tArtist(s): " + artists + "\n";
                outputText += "\tName: " + data.tracks.items[i].name + "\n";
                outputText += "\tPreview link: " + data.tracks.items[i].preview_url + "\n";
                outputText += "\tAlbum: " + data.tracks.items[i].album.name + "\n";


                artists = "";
            }

        } else {
            outputText += "\tNo results found.";
        }
        console.log(outputText);
        fs.appendFile('log.txt', outputText, function (err) {
            if (err){
                throw err; 
            }
        });
    });
}

function Movie(text){
    var outputText = "";
    //Check if user didn't enter a movie, if so set it to Mr. Nobody; also remove quotes and extra spaces
   if(text.trim() == ""){
        text = "Mr. Nobody";
    }
    text = text.trim();

    //console.log("Movie Input: " + text);
    // Then run a request to the OMDB API with the movie specified
    var queryUrl = "http://www.omdbapi.com/?t=" + encodeURI(text) + "&type=movie&plot=short&apikey=40e9cece";

    // actual URL
    //console.log("Url: " + queryUrl);

    // Then create a request to the queryUrl
    request(queryUrl, function(error, response, body) {
        // If the request is successful
        // ...
        if (!error && response.statusCode === 200) {
            var body = JSON.parse(body);
            //console.log(body.Response);
            if(body.Response === "True"){   //check if movie found
                // Then log the movie data
                // ...	
                var imdbRating = "";
                var tomatoRating = "";

                outputText = "--------------------------------\n";
                outputText += `Movie Search for ${text}\n`;
                outputText += `\tTitle: ${body.Title}` + "\n";
                outputText += `\tYear: ${body.Year}` + "\n";
                body.Ratings.forEach(function(item) {
                    if(item.Source === "Internet Movie Database"){
                        imdbRating = item.Value;
                    }
                    else if(item.Source === "Rotten Tomatoes"){
                        tomatoRating = item.Value;
                    }
                }); 
                outputText += `\tIMDB Rating: ${imdbRating}` + "\n";
                outputText += `\tRotten Tomatoes Rating: ${tomatoRating}` + "\n";
                outputText += `\tCountry of Production: ${body.Country}` + "\n";
                outputText += `\tLanguage: ${body.Language}` + "\n";
                outputText += `\tPlot: ${body.Plot}` + "\n";
                outputText += `\tActors: ${body.Actors}` + "\n";

            } else {
                outputText += "\tMovie: " + text + " not found.\n";
            }
        } else {
            outputText += "\tEncountered error " + error + " while searching for " + text + "\n";
        }
        console.log(outputText);
        fs.appendFile('log.txt', outputText, function (err) {
            if (err){
                throw err; 
            }
        });
    });

}

// Called to execute one line at a time from random.txt
function startByLine(line){
    inputs = "";
    var text = line.split(",");
    lCmd = text[0];


    for(var j=1; j<text.length;j++){
        inputs += text[j];
        inputs += " ";
    }
    start();
}

function Do(){
/*    var rd = readline.createInterface({
            input: fs.createReadStream("random.txt"),
            output: process.stdout,
            console:false
    });
*/
    fs.readFile("random.txt", "utf8", function(error, data) {
        // If the code experiences any errors it will log the error to the console.
        if (error) {
            return console.log("Error: " + error);
        } else {
            var lines = [];
            data.toString().split(/\r?\n/).forEach(function(line){
                if(line.length > 0)
                    lines.push(line);
            });

            cnt = 0;
            for(var i=0;i<lines.length; i++){
                line = lines[i];
                //Pause between each run to give previous run time to finish
                setTimeout(startByLine, i*2000, line);
            }
        }
    });
}

start();