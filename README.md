# [Meddelare](https://meddelare.com/) Social Buttons Share Count Fetcher [meddelare-node-counters](https://github.com/meddelare/meddelare-node-counters)


Install **custom social share counters** on your website with your **own hosted solution**, which only makes **a single API request** and loads **minimal or zero assets** to display the counters.

[![A screenshot of the button example](https://cloud.githubusercontent.com/assets/1398544/8511166/5c92d0b2-230b-11e5-895a-d3b67da749b5.png)](https://meddelare.com/)

Check out [meddelare.com](https://meddelare.com/) and view examples on [meddelare.com/meddelare-examples](https://meddelare.com/meddelare-examples).



---



## Share count fetcher

Node.js promise-based, asynchronous, parallel, per-URL social network share count fetcher -- the base of Meddelare.

- If you want a ready-made standalone Meddelare server, check out [meddelare-node-server](https://github.com/meddelare/meddelare-node-server).
- If you want to use Meddelare in an existing Express server, check out [meddelare-node-express](https://github.com/meddelare/meddelare-node-express).



## Features

- **Retrieval is asynchronous** and uses [bluebird](https://github.com/petkaantonov/bluebird) promises.
- **Calls social networks in parallel** from the server, making it (approximately) as fast to get the count from one as several at once.
- **Can be used for both server-side and client-side** logic, for example calculating daily statistics or backing a sharing widget.
- **Super-fast in-memory cache** keeps the most recent results per network and url.



## Getting started

**Install package in your project folder**

```bash
npm install --save meddelare-counters
```

**Fetch counts from social networks**

```javascript
var MeddelareCounters = require("meddelare-counters"),
    meddelareCounters = new MeddelareCounters();

// Use your own website here, or a specific page url.
var url = "https://meddelare.com",
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
```


**Url**  
Use the `url` parameter to specify the address which you want to retrieve the number of shares for, for example `https://meddelare.com` or a more specific url poiting to a specific page.


**Networks**  
Currently Twitter, Facebook and Google Plus are supported.

Use the `networks` parameter to specify which ones you want to use, as an array of strings, for example `["facebook", "twitter", "googleplus"]` or `["facebook"]`.

**Returns**  

The function returns a Promise. It resolves using `.then(function(result){ ... })` for most cases, only rejecting using `.catch(function(err){ ... })` when something exceptional happens -- but please expect and implement both.

If a request to a social network failed, a count of `-1` is returned for that network.

```json
{
  "facebook": 5281,
  "googleplus": 42,
  "twitter": 8719
}
```



## Configuration

Configure the middleware instance at creation time, for example `new MeddelareCounters({ unknownCount: 0 })`.

These are the default values.

```javascript
{
    // A reference to an object that implements `log`, `info`, `warn`, `error`.
    logger: console,

    // Cache results in memory -- but keep good and bad (error thrown) results for different periods of time.
    // (In milliseconds.)
    memoryCache: {
        goodResultTimeout: 4 * 60 * 1000,
        badResultTimeout: 1 * 60 * 1000,
        timeoutResultTimeout: 10 * 1000,
    },

    // Return this value if none was found or an error was thrown.
    unknownCount: -1,
}
```



## Thanks

Many thanks goes out to [Taskforce](https://taskforce.is/) for their [social-buttons-server](https://github.com/tfrce/social-buttons-server) (released into the [Public Domain](https://github.com/tfrce/social-buttons-server/tree/faf1a41e5d2d44b7e6de460b9369f11437095af1)) -- especially the creator [@thomasdavis](https://github.com/thomasdavis) and contributor [@beaugunderson](https://github.com/beaugunderson). This software, [meddelare-node-counters](https://github.com/meddelare/meddelare-node-counters), is based on their work.



---

Copyright (c) 2015 Team Meddelare <https://meddelare.com/> All rights reserved.

When using [meddelare-node-counters](https://github.com/meddelare/meddelare-node-counters), comply to the [MIT license](https://opensource.org/licenses/MIT).
