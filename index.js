var Tomb = require('./lib/tomb');

exports.Tomb = Tomb;
exports.Server = Server;

exports.buildTomb = function (hostname, callback) {
  dns.resolveSrv('_tomb._tcp.' + hostname, function (err, srvs) {
    if(err) return callback(err);

    var servers = srvs.map(function (srv) {
      return new Server(srv.name, srv.port);
    });

    async.each(servers, function (server, next) {
      server.getKey(next);
    }, function () {
      var tomb;

      servers = servers.filter(function (server) {
        return !!server.key;
      });

      try {
        tomb = new Tomb(servers);
      } catch(e) {
        return callback(e);
      }

      callback(null, tomb);
    });
  });
};
