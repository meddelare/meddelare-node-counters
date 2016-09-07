"use strict";

var Promise = require("bluebird"),
    request = require("request"),

    // The memory-cache is per-process and returns pointers, not copies.
    // Using process-scoped keys with a MeddelareCounters "namespace", so multiple MeddelareCounters instances share cache.
    // Using cache.clear() will clear all caches, even in other parts of the application. Be careful!
    // TODO: don't let the cache stop shutting down the node application (all cache timeouts seem to be respected).
    cache = require("memory-cache"),

    extend = require("extend"),

    // TODO: use a package/library instead?
    copyDeep = function() {
        var args = Array.prototype.slice.call(arguments, 0);

        return extend.apply(null, [true, {}].concat(args));
    },

    // TODO: use a package/library instead?
    sortObjectByKeys = function(unsorted) {
        var sorted = {},
            keys = Object.keys(unsorted);

        keys.sort();

        keys.forEach(function(key) {
            sorted[key] = unsorted[key];
        });

        return sorted;
    };



function MeddelareCounters(options) {
    options = options || {};
    this._options = copyDeep(MeddelareCounters._defaultOptions, options);

    // Set logger separately instead of relying on the deep copy.
    this._options.logger = this._options.logger || options.logger || console;

    // Perhaps it's futile to try and clean up before/exit, but one can try.
    process
        .once("beforeExit", function() {
            cache.clear();
        })
        .once("exit", function() {
            cache.clear();
        });

    return this;
}

MeddelareCounters.prototype._networkCallbacks = {
    twitter: function(url, callback) {
        // Twitter no longer supports simple lookups.
        // https://github.com/meddelare/meddelare-node-counters/issues/5
        // Instead of even trying it, just return the "fail" value as a "successful".
        callback(null, this._options.unknownCount);
    },

    facebook: function(url, callback) {
        var apiUrl = "https://graph.facebook.com/" + encodeURIComponent(url);

        request.get({
            url: apiUrl,
            json: true
        }, function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (!body || !body.share || typeof body.share.comment_count !== "number" || typeof body.share.share_count !== "number") {
                return callback(new Error("No well-formed body in response."));
            }

            // The "total count" will be the "comment count" plus the "share count."
            var count = body.share.comment_count + body.share.share_count;

            callback(null, count);
        });
    },

    googleplus: function(url, callback) {
        // This is a hacky method found on the internet because google doesn"t have
        // an API for google plus counts
        var apiUrl = "https://plusone.google.com/_/+1/fastbutton?url=" + encodeURIComponent(url);

        request.get(apiUrl, function(err, res, body) {
            if (err) {
                return callback(err);
            }

            if (!body) {
                return callback(new Error("No body in response."));
            }

            var result = /,ld:\[[^,]*,\[\d+,(\d+),/.exec(body),
                count;

            if (!result) {
                return callback(new Error("No well-formed body in response."));
            }

            count = parseInt(result[1], 10);

            if (isNaN(count)) {
                return callback(new Error("No well-formed body in response."));
            }

            callback(null, count);
        });
    }
};

MeddelareCounters.prototype.isValidNetwork = function(network) {
    return Object.prototype.hasOwnProperty.call(this._networkCallbacks, network);
};

MeddelareCounters.prototype.getInvalidNetworks = function(networks) {
    return networks.filter(function(network) {
        return !this.isValidNetwork(network);
    }, this);
};

MeddelareCounters.prototype.retrieveUncachedCount = function(url, network) {
    if (!this.isValidNetwork(network)) {
        throw new Error("Unknown network: " + network);
    }

    var self = this;

    return Promise.promisify(
            self._networkCallbacks[network], {
                context: self,
            }
        )(url)
        .catch(function(err) {
            self._options.logger.error("Could not fetch count", network, url, err);

            throw err;
        });
};

MeddelareCounters.prototype.getCachedOrRetrieveCount = function(url, network) {
    var self = this,
        cacheKey = MeddelareCounters._createCacheKey(url, network);

    return Promise.resolve(cache.get(cacheKey))
        .then(function(cachedResult) {
            if (typeof cachedResult !== "undefined" && cachedResult !== null) {
                self._options.logger.log(cacheKey, "from cache", cachedResult);

                return cachedResult;
            }

            // If the lookup yielded no result, kick off a request and put it in the cache for now.
            // This way the .resolve(cache) call above makes sure multiple requests count requests
            // for the same network/url cannot be sent at the same time.
            var retrieveCountPromise = self.retrieveUncachedCount(url, network)
                .tap(function(uncachedResult) {
                    self._options.logger.log(cacheKey, "fetched good result", uncachedResult);

                    cache.put(cacheKey, uncachedResult, self._options.memoryCache.goodResultTimeout);
                })
                .catch(function(err) {
                    self._options.logger.error(cacheKey, "fetched bad result", err);

                    cache.put(cacheKey, self._options.unknownCount, self._options.memoryCache.badResultTimeout);

                    return self._options.unknownCount;
                });

            // Setting a cache timeout just in case, even though it can lead to parallel requests.
            cache.put(cacheKey, retrieveCountPromise, self._options.memoryCache.timeoutResultTimeout);

            return retrieveCountPromise;
        });
};

MeddelareCounters.prototype.retrieveCounts = function(url, networks) {
    // Create an object of callbacks for each of the requested networks It is
    // then passed to the Promise library to executed in parallel All results will
    // be returned as a single object by the promise.
    var networksToRequest = {};

    networks.forEach(function(network) {
        networksToRequest[network] = this.getCachedOrRetrieveCount(url, network);
    }, this);

    return Promise.props(networksToRequest)
        .then(sortObjectByKeys);
};



MeddelareCounters._createCacheKey = function(url, network) {
    return "MeddelareCounters " + network + " '" + url + "'";
};



MeddelareCounters._defaultOptions = {
    // Cache results in memory -- but keep good and bad (error thrown) results for different periods of time.
    // (In milliseconds.)
    memoryCache: {
        goodResultTimeout: 4 * 60 * 1000,
        badResultTimeout: 1 * 60 * 1000,
        timeoutResultTimeout: 10 * 1000,
    },

    // Return this value if none was found or an error was thrown.
    unknownCount: -1,
};

module.exports = MeddelareCounters;
