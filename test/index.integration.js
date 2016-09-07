var MeddelareCounters = require("../lib"),
    meddelareCountersOptions = {
        memoryCache: {
            // Very short timeouts to finish the test faster.
            goodResultTimeout: 100,
            badResultTimeout:  100,
            timeoutResultTimeout: 100,
        },
    },
    meddelareCounters = new MeddelareCounters(meddelareCountersOptions);

// Use your own website here, or a specific page url.
var url = "https://meddelare.com/",
    networks = [
        "facebook",
        "twitter",
        "googleplus",
    ];

meddelareCounters.retrieveCounts(url, networks)
    .then(function(results) {
        console.log("Success!", results);
    })
    .catch(function(err) {
        console.error("Fail!", err);
    });
