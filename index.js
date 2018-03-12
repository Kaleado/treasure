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
var refreshDelay = 5000;

console.log(makeBuildDescriptor(new Date()));

app.use(express.static('builds'));


//\\//\\//\\ GLOBAL FUNCTIONS


/**
   Creates a build descriptor (containing the prefix and the date of creation) for a build.
   
   @param {date} a Date object with the current time
   @returns {buildDescriptor} The build descriptor object.
 */
function makeBuildDescriptor(date){
    return buildPrefix + "_" + date.toISOString();
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
            console.log(err);
            return;
        }

        // Repo has changed
        if(( stdout.indexOf("Already up to date.") == -1 ) 
         && ( stdout.indexOf("Already up-to-date.") == -1)) {
            console.log("Changes detected - tarring it all up...");
            //Changes detected - put the pulled code in a ZIP.
            var buildDescriptor = makeBuildDescriptor(new Date());
            var archive = buildDescriptor + ".tar.gz";
            console.log("Creating tar: " + archive + "...");
            exec("tar -czvf ./builds/" + archive + " ./repo", (err, stdout, stderr) => {
                // For debugging...
                //console.log(stdout);
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
        } else {
            console.log("No updates...");
        }
    });   
}, refreshDelay);

app.listen(3000, () => console.log('//\\//\\ TREASURE IS AVAILABLE ON PORT 3000 //\\//\\'));
