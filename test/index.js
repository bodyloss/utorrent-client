var expect = require('expect.js'),
    Client = require('../lib/utorrent-client'),
    config = require('./config.js');

function checkdone(err, data) {
    if (err) {
        throw err;
    } else {
        expect(data).to.be.ok();
    }
}

describe('utorrent client', function() {
    var client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        pass: config.pass
    });

    describe('token', function() {
        it('should get updated', function(done) {
            client.refreshToken(function(err, data) {
                expect(client.token).to.be.ok();
                done();
            });
        });
    });

    describe('addurl', function() {
        it('should add the torrent', function(done) {
            client.addurl(config.torrenturl, function(err, data) {
                client.list(function(err, data) {
                    expect(data.torrents.length).to.be.greaterThan(0);
                    done();
                });
            });
        });
    });

    describe('settings', function() {
        it('should be fetched', function(done) {
            client.getsettings(function(err, data) {
                expect(err).to.not.be.ok();
                expect(data).to.be.ok();
                expect(data.settings.length).to.be.greaterThan(0);
                done();
            });
        });
    });

    describe('torrent', function() {
        var hash;

        before(function(done) {
            client.list(function(err, data) {
                hash = data.torrents[0].hash;
                done();
            });
        });

        it('should be stopped', function(done) {
            client.stop(hash, checkdone);
            done();
        });

        it('should be started', function(done) {
            client.start(hash, checkdone);
            done();
        });

        it('should be paused', function(done) {
            client.pause(hash, checkdone);
            done();
        });

        it('should be unpaused', function(done) {
            client.unpause(hash, checkdone);
            done();
        });

        it('should be force started', function(done) {
            client.forcestart(hash, checkdone);
            done();
        });

        it('should be rechecked', function(done) {
            client.recheck(hash, checkdone);
            done();
        });

        it('should get the properties', function(done) {
            client.getprops(hash, function(err, data) {
                expect(data).to.be.ok();
                expect(data.props).to.be.ok();
                expect(data.props[0].hash).to.be.ok();
                done();
            });
        });

        describe('files', function() {
            var files;

            before(function(done) {
                client.fileslist(hash, function(err, data) {
                    files = data;
                    done();
                });
            });

            it('there should be files', function() {
                
            });

        });

    });
});
