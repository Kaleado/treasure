var express = require('express');
var app = express();
var { exec } = require('child_process');
var fs = require('fs');
var util = require('util');

//\\//\\//\\ GLOBAL VARIABLES

//Change this to fit your project.
var buildPrefix = "seng3031";
//We save the build descriptors in this file and read from it every time we start.
var builds = JSON.parse(fs.readFileSync("builds.js", "utf8"));
//Milliseconds to wait between each repository poll.
var refreshDelay = 3000;

app.use(express.static('builds'));


//\\//\\//\\ GLOBAL FUNCTIONS

/**
   Returns an archive name corresponding to the build descriptor provided.

   @param {buildDescriptor} The build descriptor to return an archive name for.
   @returns {string} The archive name corresponding to the build descriptor - NOT the full path.
 */
function extractTarNameFromDescriptor(buildObject){
    var now = new Date();
    return util.format("%s_%d-%d-%d@%d-%d-%d.tar.gz",
                       buildObject.prefix,
                       buildObject.year,
                       buildObject.month,
                       buildObject.day,
                       buildObject.hours,
                       buildObject.minutes,
                       buildObject.seconds);
}

/**
   Creates a build descriptor (containing the prefix and the date of creation) for a build.
   
   @param {string} prefix The build prefix - should be something related to the project.
   @param {integer} year The year to tag the archive with.
   @param {integer} month The month to tag the archive with.
   @param {integer} day The day to tag the archive with.
   @param {integer} hours The hours to tag the archive with.
   @param {integer} minutes The minutes to tag the archive with.
   @param {integer} seconds The seconds to tag the archive with.
   @returns {buildDescriptor} The build descriptor object.
 */
function makeBuildDescriptor(prefix, year, month, day, hours, minutes, seconds){
    return {
        prefix: prefix,
        year: year,
        month: month,
        day: day,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

//\\//\\//\\ ROUTES

// Get the home page.
app.get('/', function (req, res) {
    var html = "";
    html += "<h1>Treasure</h1><h2>Artifacts</h2>";
    html += "<ul>";
    for(var i in builds){
        html += '<li><a href="' + extractTarNameFromDescriptor(builds[i]) + '">' + extractTarNameFromDescriptor(builds[i]) + '</li>';
    }
    html += "</ul>";
    res.send(html);
});

setInterval(() => {
    console.log("Checking for updates...");
    
    //Check if git repo has updated.
    exec('git -C ./repo pull', (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            console.log("Error when pulling!");
            return;
        }
        
        if(stdout.indexOf("Already up to date.") == -1){
            console.log("Changes detected - tarring it all up...");
            //Changes detected - put the pulled code in a ZIP.
            var now = new Date();
            var buildDescriptor = makeBuildDescriptor(
                buildPrefix,
                now.getYear() + 1900,
                now.getMonth(),
                now.getDay(),
                now.getHours(),
                now.getMinutes(),
                now.getSeconds());
            var archive = extractTarNameFromDescriptor(buildDescriptor);
            console.log("Creating tar: " + archive + "...");
            exec("tar -czvf ./builds/" + archive + " ./repo", (err, stdout, stderr) => {
                console.log(stdout);
                if (err) {
                    // node couldn't execute the command
                    console.log("Tarring failed!");
                    console.error(err);
                    return;
                }
                builds.push(buildDescriptor);
                //Save it.
                fs.writeFile("./builds.js", JSON.stringify(builds), function(err) {
                    if(err) {
                        console.log("builds.js write failed!");
                        return;
                    }
                    
                    console.log("The file was saved!");
                    return;
                });
                
            });
        }
        else {
            console.log("No updates.");
        }
    });   
}, refreshDelay);

app.listen(3000, () => console.log('//\\//\\ TREASURE IS AVAILABLE ON PORT 3000 //\\//\\'));
