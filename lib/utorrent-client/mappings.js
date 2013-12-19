

// Set of mappings that take the data returned by the call they represent and map it to an
// object with names so its easier to use
var mappings = module.exports = {

    // See http://forum.utorrent.com/viewtopic.php?id=55526 for a list of the different settings and what they mean
    'getsettings': function(data) {
        var settings = [];
        
        if (data.settings && data.settings.length > 0) {
            for (var i = 0; i < data.settings.length; i++) {
                settings.push({
                    name: data.settings[i][0],
                    value: data.settings[i][2]
                });
            }
        }

        return settings;
    },
  
    'list': function(data) {
        var torrents = [];

        if (data.torrents && data.torrents.length > 0) {
            for (var i = 0; i < data.torrents.length; i++) {
                var t = data.torrents[i];

                var status;
                switch (t[1]) {
                    case 1: status = 'Started'; break;
                    case 2: status = 'Checking'; break;
                    case 4: status = 'Start after check'; break;
                    case 8: status = 'Checked'; break;
                    case 16: status = 'Error'; break;
                    case 32: status = 'Pause'; break;
                    case 64: status = 'Queued'; break;
                    case 128: status = 'Loaded'; break;
                    default: status = 'Unknown status'; break;
                }


                torrents.push({
                    'hash': t[0],
                    'status code': t[1],
                    'status': status,
                    'name': t[2],
                    'size': t[3],
                    'percent progress': t[4],
                    'downloaded': t[5],
                    'uploaded': t[6],
                    'ratio': t[7],
                    'upload speed': t[8],
                    'download speed': t[9],
                    'eta': t[10],
                    'label': t[11],
                    'peers connected': t[12],
                    'peers in swarm': t[13],
                    'seeds connected': t[14],
                    'seeds in swarm': t[15],
                    'availability': t[16],
                    'torrent queue order': t[17],
                    'remaining': t[18]
                });
            }
        }

        data.torrents = torrents;

        return data;
    },

    // parses the cached version of torrents
    'cached-list': function(data) {
        var torrents = [];

        if (data.torrents && data.torrents.length > 0) {
            // I know its copied from above, but really cba to extract it to a method!
            for (var i = 0; i < data.torrentp.length; i++) {
                var t = data.torrentp[i];

                var status;
                switch (t[1]) {
                    case 1: status = 'Started'; break;
                    case 2: status = 'Checking'; break;
                    case 4: status = 'Start after check'; break;
                    case 8: status = 'Checked'; break;
                    case 16: status = 'Error'; break;
                    case 32: status = 'Pause'; break;
                    case 64: status = 'Queued'; break;
                    case 128: status = 'Loaded'; break;
                    default: status = 'Unknown status'; break;
                }


                torrents.push({
                    'hash': t[0],
                    'status code': t[1],
                    'status': status,
                    'name': t[2],
                    'size': t[3],
                    'percent progress': t[4],
                    'downloaded': t[5],
                    'uploaded': t[6],
                    'ratio': t[7],
                    'upload speed': t[8],
                    'download speed': t[9],
                    'eta': t[10],
                    'label': t[11],
                    'peers connected': t[12],
                    'peers in swarm': t[13],
                    'seeds connected': t[14],
                    'seeds in swarm': t[15],
                    'availability': t[16],
                    'torrent queue order': t[17],
                    'remaining': t[18]
                });
            }


        }

        data.torrentp = torrents;
        return data;
    },

    'getfiles': function(data) {
        var files = [];

        if (data.files && data.files.length > 0) {
            for (var i = 0; i < data.files.length; i++) {
                var f = data.files[i];
                
                var priority;
                switch (f[3]) {
                    case 0: priority: 'Don\'t Download'; break;
                    case 1: priority: 'Low Priority'; break;
                    case 2: priority: 'Normal Priority'; break;
                    case 3: priority: 'High Priority'; break;
                    default: priority: 'Unknown Priority'; break;
                }

                files.push({
                    'filename': f[0],
                    'filesize': f[1],
                    'downloaded': f[2],
                    'priority': priority,
                    'priority code': f[3]
                });
            }
        }

        data.files = files;
        return data;
    },
};
