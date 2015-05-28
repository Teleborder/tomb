var secrets = require('secrets.js'),
    crypto = require('crypto');

module.exports = Tomb;

function Tomb(options, shares) {
  options = options || {};

  this.encryptionKey = null;
  this.algorithm = options.algorithm || 'AES-256-CBC';
  this.keyBits = options.keyBits || 256;
  this.ivBits = options.ivBits || 128;
  this.shares = options.shares || 5;
  this.threshold = options.threshold || 3;

  if(shares) this.unseal(shares);
}

Tomb.prototype.generateKey = function () {
  var encryptionKey = secrets.random(this.keyBits);

  return secrets.share(encryptionKey, this.shares, this.threshold);
};

Tomb.prototype.unseal = function (shares) {
  if(shares.length < this.threshold) {
    throw new Error(this.threshold + " shares are required to unseal. Only " + shares.length + " were provided.");
  }

  this.encryptionKey = secrets.combine(shares);

  return this;
};

Tomb.prototype.seal = function () {
  this.encryptionKey = null;

  return this;
};

Tomb.prototype.encrypt = function (secret) {
  if(!this.encryptionKey) throw new Error("Tomb does not have an encryption key");

  var iv = this.randomIv(),
      cipher = crypto.createCipheriv(this.algorithm, new Buffer(this.encryptionKey, 'hex'), iv);

  return [iv.toString('hex'), cipher.update(secret, 'utf8', 'hex'), cipher.final('hex')].join('');
};

Tomb.prototype.decrypt = function (encSecret) {
  if(!this.encryptionKey) throw new Error("Tomb does not have an encryption key");

  var iv = encSecret.slice(0, this.ivLength()),
      decipher = crypto.createDecipheriv(this.algorithm, new Buffer(this.encryptionKey, 'hex'), iv);

  encSecret = encSecret.slice(this.ivLength());

  return [decipher.update(encSecret, 'hex', 'utf8'), decipher.final('utf8')].join('');
};

Tomb.prototype.randomIv = function () {
  return crypto.randomBytes(this.ivBits / 8);
};

Tomb.prototype.ivLength = function () {
  // hex encoding
  return (this.ivBits / 8) * 2;
};
