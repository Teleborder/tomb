var JSEncrypt = require('jsencrypt'),
    debug = require('debug')('tomb');

module.exports = Server;

function Server(host, port) {
  this.host = host;
  this.port = port;
}

Server.prototype.getKey = function (masterKey, callback) {
  var self = this;

  request(this.host + ':' + this.port + '/key', function (err, response, body) {
    if(err) {
      debug("Error encountered when retrieving key", err);
      return callback();
    }
    if(response.statusCode !== 200 && response.statusCode !== 304) {
      debug("Unknown status code when retrieving key " + response.statusCode);
      return callback();
    }

    self.key = body;

    callback(null, self.key);
  });
};

Server.prototype.encrypt = function (secret) {
  var encryptor = new JSEncrypt();

  encryptor.setPublicKey(this.key);

  return encryptor.encrypt(secret);
};

Server.prototype.decrypt = function (encSecret, callback) {
  request.post({
    url: this.host + ':' + this.port + '/decrypt',
    body: encSecret
  }, function (err, response, body) {
    if(err) {
      debug("Error encountered when decrypting", err);
      return callback();
    }
    if(response.statusCode !== 200) {
      debug("Unknown status code when decrypting " + response.statusCode);
      return callback();
    }

    return callback(null, body);
  });
};
