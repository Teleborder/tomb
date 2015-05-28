var secrets = require('secrets.js'),
    crypto = require('crypto'),
    async = require('async');

module.exports = Tomb;

function Tomb(servers) {
  this.algorithm ='AES-256-CBC';
  this.keyBits = 256;
  this.ivBits = 128;
  this.secretShares = 10;
  this.secretThreshold = 5;

  this.servers = servers;

  if(this.servers.length < this.secretShares) {
    throw new Error("Can't initialize Tomb with only " + this.servers.length + " servers. " + this.secretShares + " are required.");
  }
}

Tomb.prototype.encrypt = function (secret, callback) {
  var res;

  try {
    res = this._encrypt(secret);
  } catch(e) {
    process.nextTick(function () {
      callback(e);
    });
    return;
  }

  process.nextTick(function () {
    callback(null, res.secret, res.shares);
  });
};

Tomb.prototype._encrypt = function (secret) {
  var key = this.randomKey(),
      shares = secrets.share(key, this.secretShares, this.secretThreshold),
      iv = this.randomIv(),
      cipher = crypto.createCipheriv(this.algorithm, new Buffer(key, 'hex'), iv),
      encSecret,
      sharePairs;

  cipher.update(secret, 'utf8');

  encSecret = iv.toString('hex') + cipher.final('hex');
  sharePairs = this.encryptShares(shares);

  return {
    secret: encSecret,
    shares: sharePairs
  };
};

Tomb.prototype.decrypt = function (encSecret, sharePairs, callback) {
  var iv = new Buffer(encSecret.slice(0, this.ivLength()), 'hex'),
      self = this;

  encSecret = new Buffer(encSecret.slice(this.ivLength()), 'hex');

  this.decryptShares(sharePairs, function (err, shares) {
    if(err) return callback(err);

    var secret;

    try {
      secret = self._decrypt(encSecret, iv, shares);
    } catch(e) {
      return callback(e);
    }

    callback(null, secret);
  });
};

Tomb.prototype._decrypt = function (encSecret, iv, shares) {
    var key,
        secret,
        decipher;

    if(shares.length < this.secretThreshold) {
      throw new Error("Only " + shares.length + " shares were decrypted, out of a required " + self.secretThreshold);
    }

    // using more than the required number of shares takes more computation time
    key = secrets.combine(shares.slice(0, this.secretThreshold));

    decipher = crypto.createDecipheriv(this.algorithm, new Buffer(key, 'hex'), iv);

    decipher.update(encSecret);

    return decipher.final('utf8');
};

Tomb.prototype.encryptShares = function (shares) {
  if(shares.length > this.servers.length) {
    throw new Error("Can't encrypt " + shares.length + " shares with only " + this.servers.length + " servers");
  }

  var servers = this.servers.slice(),
      sharePairs = [];

  shares.forEach(function (share) {
    var randomServerIndex = Math.floor(Math.random() * servers.length),
        randomServer = servers.splice(randomServerIndex, 1)[0];

    sharePairs.push({
      key: randomServer.key,
      share: randomServer.encrypt(share)
    });
  });

  return sharePairs;
};

Tomb.prototype.decryptShares = function (sharePairs, callback) {
  var self = this;

  sharePairs.forEach(function (sharePair) {
    sharePair.server = self.findServer(sharePair.key);
  });

  sharePairs = sharePairs.filter(function (sharePair) {
    return sharePair.server;
  });

  if(sharePairs.length < this.secretThreshold) {
    return callback(new Error("Only " + sharePairs.length + " servers were found for this key, out of the required " + this.secretThreshold));
  }

  async.map(sharePairs, function (sharePair, next) {
    sharePair.server.decrypt(sharePair.share, next);
  }, callback);
};

Tomb.prototype.findServer = function (key) {
  for(var i=0; i<this.servers.length; i++) {
    if(key === this.servers[i].key) {
      return this.servers[i];
    }
  }

  return false;
};

Tomb.prototype.randomKey = function () {
  return secrets.random(this.keyBits);
};

Tomb.prototype.keyLength = function () {
  // hex encoding
  return (this.keyBits / 8) * 2;
};

Tomb.prototype.randomIv = function () {
  return crypto.randomBytes(this.ivBits / 8);
};

Tomb.prototype.ivLength = function () {
  // hex encoding
  return (this.ivBits / 8) * 2;
};
