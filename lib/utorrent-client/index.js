var util = require('util'),
    http = require('http'),
    path = require('path'),
    querystring = require('querystring'),
    url = require('url'),
    mappings = require('./mappings.js');

var Client = module.exports = function(config) {
    // ensure they created a new Client
    if (!(this instanceof Client)) {
        return new Client(config);
    }

    // Set config values to defaults if none supplied
    this.config = config || {};
    this.config.host = config.host || 'localhost';
    this.config.port = config.port || '8080';
    this.config.user = config.user || 'admin';
    this.config.pass = config.pass || '';

    this.authKey = new Buffer(this.config.user + ':' + this.config.pass).toString('base64');
    this.rootUrl = 'http://' + this.config.host + ':' + this.config.port + '/gui';

    // Authentication token
    this.token = null;
    // Flag signalling if we're currently authentication at the moment
    this.inAuth = false;
    // Flag signalling if we are currently authenticated
    this.authenticated = false;

    // Queue to hold requests while we are authenticating
    this.queue = [];
};

/*
 * Refreshes the token and stores it, calling the callback with null if no error was found, else
 * err object
 */
Client.prototype.refreshToken = function(callback) {
    var self = this;

    this.inAuth = true;

    // Request the token.html page then extract and save the token
    var request = this.createRequest('token.html', {}, function(err, data) {
        if (err) {
            self.inAuth = false;
            self.authenticated = false;
            callback(err);
            return;            
        }

        var reg = /display:none;'>(.*)<\/div>/;
        var matches = data.match(reg);

        if (matches != null && matches.length == 2) {
            self.token = matches[1];
            self.inAuth = false;
            self.authenticated = true;
            callback(null);
        } else {
            callback('Could not get token from utorrent');
        }

    }).execute(true);
};

/*
 * Makes a request to the utorrent engine, repeating on error as applicable
 */
Client.prototype.makeRequest = function(options, callback, isAuthRequest) {
    var self = this;

    if (this.inAuth && !isAuthRequest) {
        this.queue.push([options, callback, isAuthRequest]);
        return;
    }
    
    if (!this.inAuth && !this.authenticated) {
        // Refresh the token and then process the queue in the callback
        this.queue.push([options, callback, isAuthRequest]);
        this.refreshToken(function() {
            self.queue.forEach(function(request) {
                self.makeRequest(request[0], request[1], request[2]);
            });
            self.queue = [];
        });
        return;
    }

    // modify the request options so that it has the current token
    options.path += '&token=' + this.token;

    if (this.cookie && ! options.headers['Cookie']) {
        options.headers['Cookie'] = this.cookie;
    }

    // Make the request to the server
    var httpRequest = http.request(options, function(response) {
        if (response.statusCode == '401') {
            if (isAuthRequest) {
                // error on refreshing the token, call it quits
                callback(new Error('HTTP status code 401 when trying to get token'));
                return;
            }

            // Quite possibly the token is invalid so try and refresh it
            self.refreshToken(function(err) {
                if (err) {
                    callback(err);
                    return;
                }

                // no error to lets redo this request, but modifying the options object so we can ensure we
                // don't get stuck in a continuous loop caused by a bad request                
                if (options.repeat) {
                    callback(new Error('Repeated HTTP error 401 when making request'));
                    return;
                }

                options.repeat = true;
                self.makeRequest(options, callback);
                return;
            });
        }

        if (response.statusCode == '400') {
            callback(new Error('HTTP status code 400 returned, invalid request'));
            return;
        }

        var data = [];

        response.setEncoding('utf8');
        response.on('data', function(part) {
            data.push(part);
        });

        response.on('end', function() {
            // Save cookies if we have some
            if (response.headers['set-cookie']) {
                self.cookie = response.headers['set-cookie'][0].split(';')[0];
            }

            // Join the data up and parse it into a JSON object to return to the callback
            data = data.join('');
            if (isAuthRequest) {
                callback(null, data);
            } else {
                try {
                    callback(null, JSON.parse(data));
                } catch (err) {
                    callback(err);
                }
            }
        });

    });
    
    httpRequest.on('error', callback);
    httpRequest.end(JSON.stringify(options.path), 'utf8');
}

/*
 * Creates a request from the specified action and paramaters
 */
Client.prototype.createRequest = function(method, params, callback) {
    var self = this;

    // We only append on ?action=... if a method name has been passed (as list is ?&list=1)
    if (method != 'token.html' && method != '') {
        method = '?action=' + method + '&' + querystring.stringify(params);
    } else if (method == '' && params) {
        method = '?' + querystring.stringify(params);
    }

    var options = {
        method: 'GET',
        host: this.config.host,
        port: this.config.port,
        path: '/gui/' + method,
        method: 'GET',
        params: params,
        headers: {
            'Time': new Date(),
            'Host': this.config.host + ':' + this.port,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0-9,*/*,q=0.8',
            'Accept-Encoding': 'gzip,deflate,sdch',
            'Accept-Language': 'en-US,en;q=0.8',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Authorization': 'Basic ' + this.authKey
        }
    };

    if (this.cookie) {
        options.headers['Cookie'] = this.cookie;
    }
    
    // Return the options and a callback that handles the result of the request
    return new function() {
        this.options = options;
        this.callback = callback;
        this.execute = function(isAuthRequest) {
            self.makeRequest(options, callback, isAuthRequest);
        };
    };
};

// Add all the methods that take the form ?action=some_action&hash=...
var hashMethods = ['start', 'stop', 'pause', 'forcestart', 'unpause', 'recheck', 'remove', 'removedata', 'getprops'];
hashMethods.forEach(function(method) {
    Client.prototype[method] = function(hash, callback) {
        this.createRequest(method, {hash: hash}, callback).execute();
    }
});

Client.prototype.addurl = function(url, callback) {
    this.createRequest('add-url', {s:url}, callback).execute();
};

Client.prototype.setpriority = function(hash, priority, fileindex, callback) {
    this.createRequest('setprio', {hash: hash, p: priority, f: fileindex}, callback).execute();
};

Client.prototype.getsettings = function(callback) {
    this.createRequest('getsettings', null, function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        // call the original callback, after sticking it through the mapping
        callback(null, mappings['getsettings'](data));
    }).execute();
};

Client.prototype.list = function(callback) {
    var req = this.createRequest("", {list:1}, function(err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, mappings['list'](data));
    });
    req.execute();
};

Client.prototype.cachelist = function(cacheid, callback) {
    this.createRequest("", {list:1, cid:cacheid}, function(err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, mappings['cached-list'](data));
    }).execute();
};

Client.prototype.fileslist = function(hash, callback) {
    this.createRequest('getfiles', {hash: hash}, function(err, data) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, mappings['getfiles'](data));
    }).execute();
};
