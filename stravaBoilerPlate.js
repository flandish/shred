//Frank Conway
//www.frankconway.uk
//Use this if you want to.

/*Essentially all I am doing is making a motor
  run at a different rate depending on the project. */

//Name dependencies
var express = require('express')//Node webframework for routing etc
var app = express()
var async = require("async")//For executing functions in a specific order
var fs = require('fs') //file save

//Declare variables
var runCount, runDist; //Variables for Strava data
var savedRunCount, savedRunDist; //Variables for previous run
var saved; //for reading saved runs JSON file
var runDistDiff; //Variable for finding the difference between saved and current. This is the most important number.
var bigger = false; //Bool for checking against saved and current

var athleteID = ; //Strava athlete ID
var apiKey = ; //Strava API Key
var accessToken = ; //Particle Photon Access Token
var eventName = ; //Name of the event Partice Photon with subscribe to.


app.get('/',function(req,res,next){ //Express JS routing to index

  //Runs each function in a series (one after the other,
  //waiting for the previous one to finish) and uses
  //the results from each as parameters

  async.waterfall([
    getStravaData,
    readRuns,
    saveRuns,
    postToPhoton,
], function (err, result) {
    if (err) {
      console.error(err);
      return;
    }
    console.log(result);
  });

});


//------------------------------------------------
//Pulls data from Strava account using superAgent
//------------------------------------------------
function getStravaData(callback){
  request.get("https://www.strava.com/api/v3/athletes/"+athleteID+"/stats") //GET reqeust to athlete stats
  .set('Authorization', 'Bearer '+apiKey) //Adss API key to request
  .set('Content-Type', 'application/json') //Just being clear
  .end(function(err, response){ //Finishes request and deals with returned content
    if (err){ //If error, do someting instead of nothing
      callback(err, null);
      console.log('Something went wrong with getStravaData function')
      return;
    }
      //parses data from the Strava JSON/HTTP response
      runCount = response.body.all_run_totals.count //drilling down into data
      runDist = response.body.all_run_totals.distance

      callback(null, runCount, runDist) //Define what data follows through to next async event/funtion
  });
}

//------------------------------------------------
//Reads and parses the savedRuns JSON file
//------------------------------------------------
function readRuns(runCount, runDist, callback){ //Carry through runCount and runDist from superagent HTTP request
  fs.readFile('savedRuns.json', 'utf8', function (err, data) { //uses 'file save' to read savedRuns then refers to it as 'data'
    if (err){ //if there is an error, do something instead of nothing
      callback(err, null);
      console.log('Something went wrong with readRuns function')
      return;
    }
    saved = JSON.parse(data); //make saved the parsed JSON data
    console.log("SavedRuns: "+saved.runs); //Display 'runs' in the JSON file. Kind of like drilling down again.
    console.log("SavedDistance: "+saved.distance); //Same with distance

    savedRunCount = saved.runs; //Makes savedRunCount the parsed data from the JSON file.
    savedRunDist = saved.distance; //Same idea here.

    //If the newly checked Strava data (runCount) is greater than the previously saved data (savedRunCount)
    //change 'bigger' bool to true, if not keep it the same (false).
    if(runCount > savedRunCount){
      bigger = true;
      console.log("Bigger is "+bigger) //will display 'bigger is true'
    } else {
      bigger = false;
      console.log("Bigger is "+bigger) //will display 'bigger is false'
    }

    callback(null, bigger, runCount, runDist, savedRunDist); //Follow on through to the next function. Dropped runCount and added the 'saved' values
}

//------------------------------------------------
//Creates a JSON file with Strava data
//------------------------------------------------
function saveRuns(bigger, runCount, runDist, savedRunDist, callback){
  if (bigger == true){ //if 'bigger' was true in the last function do this, if not don't do much.
    //creates JSON file with new Strava data.
    fs.writeFile('savedRuns.json', '{"runs":'+'"'+runCount+'"'+","+'"distance":'+'"'+runDist+'"'+'}', function (err) {
      if (err){ //if error do something instead of getting an annoying error. Handled well, I think.
        callback(err, null);
        console.log('Something went wrong with saveRuns function')
        return;
      }
      console.log('savedRuns JSON file updated');
      callback(null, bigger, runDist, savedRunDist)
    })
  }else {
    callback(null, bigger, runDist, savedRunDist)
}

//------------------------------------------------
/* POSTs/'publishes' an event to Particle Photon via particleAPI
if numberOfRuns has increased (bigger bool). */
//------------------------------------------------
function postToPhoton(bigger, runDist, savedRunDist, callback){
  if (bigger == true){ //Post to Particle Photon if 'bigger' is true.
    runDistDiff = runDist - savedRunDist; //Finds the difference between the new distance and the old one. This is the most important number.
    console.log("Distance Difference: "+runDistDiff+" metres") //Puts 'runDistDiff' into the wild.
    request.post("https://api.particle.io/v1/devices/events")
    .send('name='+eventName) //The name of your event that your Photon will subscribe to.
    .send('private=true') //No peepers
    .send('data='+runDistDiff) //Send the runDistDiff to the Particle Photon.
    .send('access_token='+accessToken) //The access token will aim it at your Particle Photon.
    .end(function(err,res){
      if(err){
        console.log('error on postToPhoton function')
        return;
      }
      console.log('New Run Found. Run distance difference posted to Photon.')
  })
  } else {
      console.log('No new runs found.')
  }
}


app.listen(3000, function(){}) //Opens express on localhost:3000
