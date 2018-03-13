var express = require('express');
var app = express();
var { exec } = require('child_process');
var fs = require('fs');
var util = require('util');
var { execPromise } = util.promisify(exec);

//\\//\\//\\ GLOBAL VARIABLES

//Whether to save an archive of the new version.
var saveArchive = false;
//Change this to fit your project.
var buildPrefix = "seng3031";
//We save the build descriptors in this file and read from it every time we start.
var builds = JSON.parse(fs.readFileSync("builds.json", "utf8"));
//Milliseconds to wait between each repository poll.
var refreshDelay = 15000;
//The current dir is saved.
const dir = process.cwd();

app.use(express.static('builds'));


//\\//\\//\\ GLOBAL FUNCTIONS

/**
 Creates a build descriptor (containing the prefix and the date of creation) for a build.

 @param {date} a Date object with the current time
 @returns {buildDescriptor} The build descriptor object.
 */
function makeBuildDescriptor(date){
    return {name: buildPrefix + "_" + date.toISOString()};
}

/**
 Creates a TAR archive from the given build descriptor.

 @returns {buildDescriptor} The build descriptor object.
 */
async function makeArchive(buildDescriptor){
    var archive = buildDescriptor.name + ".tar.gz";
    console.log("Creating tar: " + archive + "...");
    exec("tar -czvf ./builds/" + archive + " ./repo", (err, stdout, stderr) => {
        // For debugging...
        console.log("\\//\\//\\// STDOUT: ");
        console.log(stdout);
        if (err) {
            // node couldn't execute the command
            console.log("Tarring failed!");
            console.error(err);
            return;
        }
        builds.push(buildDescriptor);
        //Save it.
        fs.writeFile("./builds.json", JSON.stringify(builds), function(err) {
            if(err) {
                console.log("builds.json write failed!");
                return;
            }
            console.log("The file was saved!");
            return;
        });
    });

}

//\\//\\//\\ ROUTES

// Get the home page.
app.get('/', function (req, res) {
    var html = "";
    html += "<h1>Treasure</h1><h2>Artifacts</h2>";
    html += "<ul>";
    for(var i in builds){
        html += '<li><a href="' + builds[i].name + ".tar.gz" + '">' + builds[i].name + ".tar.gz"  + '</li>';
    }
    html += "</ul>";
    res.send(html);
});

setInterval(function(){
    console.log("Checking for updates...");
    process.chdir(dir + "/repo");
    //Check if git repo has updated.
    exec('git pull', (err, stdout, stderr) => {
        console.log("\\//\\//\\// STDOUT: ");
        console.log(stdout);
        if (err) {
            // node couldn't execute the command
            console.log("Error when pulling!");
            console.log(err);
            return;
        }

        // Repo has changed
        if(( stdout.indexOf("Already up to date.") == -1 )
           && ( stdout.indexOf("Already up-to-date.") == -1)) {
            console.log("Changes detected...");
            var buildDescriptor = makeBuildDescriptor(new Date());
            //Run the build script for the repo.
            //process.chdir("repo");
            exec("./build.sh", async function(buildErr, buildStdout, buildStderr){
                console.log("\\//\\//\\// STDOUT: ");
                console.log(stdout);
                process.chdir(dir);
                if(buildErr){
                    console.error("Build script failed.");
                    console.error("//\\//\\//\\ STDERR:");
                    console.error(buildStderr);
                    return;
                }
                //Create the tarball.
                if(saveArchive){
                    await makeArchive();
                }
            });
        }
        else {
            process.chdir(dir);
            console.log("No updates...");
        }
    });
}, refreshDelay);

app.listen(3000, () => console.log('//\\//\\ TREASURE IS AVAILABLE ON PORT 3000 //\\//\\'));
