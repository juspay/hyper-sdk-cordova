const fs = require('fs');

const _ = require('lodash');
const xml2js = require('xml2js');
const path = require('path')

//This will help in getting the cordova application structure.
const utilities = {
    getAndroidResPath: function(context) {

        var platforms = context.opts.cordova.platforms;
        //check for the platform is android or not
        if (platforms.indexOf("android") === -1) {
            return null;
        }

        var androidPath = context.opts.projectRoot + '/platforms/android/app/src/main';

        if (!fs.existsSync(androidPath)) {
            androidPath = context.opts.projectRoot + '/platforms/android';

            // This will detect what application structure we are getting.
            if (!fs.existsSync(androidPath)) {
                console.log("Unable to detect type of cordova-android application structure");
                throw new Error("Unable to detect type of cordova-android application structure");
            } else {
                console.log("Detected pre cordova-android 7 application structure");
            }
        } else {
            console.log("Detected cordova-android 7 application structure");
        }

        return androidPath;
    },

    getAndroidManifestPath: function(context) {
        return this.getAndroidResPath(context);
    },

    // This will help in getting the androidPath
    getAndroidSourcePath: function(context) {
        var platforms = context.opts.cordova.platforms;

         //check for the platform is android or not
        if (platforms.indexOf("android") === -1) {
            return null;
        }

        var androidPath = context.opts.projectRoot + '/platforms/android/app/src/main/java';

        if (!fs.existsSync(androidPath)) {
            androidPath = context.opts.projectRoot + '/platforms/android/src';

            if (!fs.existsSync(androidPath)) {
                console.log("Unable to detect type of cordova-android application structure");
                throw new Error("Unable to detect type of cordova-android application structure");
            } else {
                console.log("Detected pre cordova-android 7 application structure");
            }
        } else {
            console.log("Detected cordova-android 7 application structure");
        }

        return androidPath;
    }
};


// context will help to get the path of files
module.exports = (context) => {

    // Storing the path of build.gradle & repositories.gradle where changes need to be pushed!!
    let gradlePath = context.opts.projectRoot + '/platforms/android/build.gradle';
    let repositoryGradlePath = context.opts.projectRoot + '/platforms/android/repositories.gradle';

    // Read the data and dataRepository and convert into string
    var data = fs.readFileSync(gradlePath).toString();
    var dataRepository = fs.readFileSync(repositoryGradlePath).toString();

    // At the specified path whenever you find the gradle or maven replace it.
    let gradle = `classpath "in.juspay:hypersdk-asset-plugin:1.0.4" `;
    let maven = `maven { url "https://maven.juspay.in/jp-build-packages/hypersdk-asset-download/releases/" } `;
    data = data.replace("dependencies {", "dependencies { \n\t" + gradle);
    dataRepository = dataRepository.replace("}", maven + "\n}");

   // Write on the gradlePath and replaces it with gradle
    fs.writeFile(gradlePath, data, function(err) {
        if (err) return console.error(err);
    });

    // Write on the repositoryGradlePath and replaces it with maven
    fs.writeFile(repositoryGradlePath, dataRepository, function(err) {
        if (err) return console.error(err);
    });

     // This block will help us to get MainActivity's Path
    let androidManifestPath = utilities.getAndroidManifestPath(context);

    if (androidManifestPath != null) {
        const parseString = xml2js.parseString;
        const manifestPath = androidManifestPath + '/AndroidManifest.xml';
        const androidManifest = fs.readFileSync(manifestPath).toString();

        if (androidManifest) {
            parseString(androidManifest, (err, manifest) => {

                if (err) {
                    return console.error(err);
                }

                // Add the path to the activityPath.
                const packageName = manifest['manifest']['$']['package'];


                // Add the Complete path to the MainActivity
                const newActivityPath = utilities.getAndroidSourcePath(context) + "/" + packageName.replaceAll("\\.", "/") + '/MainActivity.java';


                // will replace FragmentActivity with our HyperActivity.
                let newSuperClass = fs.readFileSync(newActivityPath).toString();
                const addedActivity = `in.juspay.hypersdk.HyperActivity`
                newSuperClass = newSuperClass.replace("extends FragmentActivity", "extends " + addedActivity);


                // This will add 'in.juspay.hypersdk.HyperActivity' into our MainActivity
                // so that HyperActivity.java could be accessed directly.
                fs.writeFile(newActivityPath, newSuperClass, function(err) {
                    if (err) return console.error(err);
                });

            })

        }

    }
}