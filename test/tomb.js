var assert = require('assert'),
    Tomb = require('../');

describe("Tomb", function () {
  it("generates a sharded master key", function () {
    var tomb = new Tomb(),
        shards = tomb.generateKey();

    assert.equal(shards.length, 5);
    assert.ok(shards[0].length);
  });

  it("unseals when provided with a quorum of key shards", function () {
    var tomb = new Tomb(),
        shards = tomb.generateKey();

    tomb.unseal(shards.slice(0, 3));

    assert.ok(tomb.encryptionKey);
  });

  it("throws when trying to unseal with less than the quorum", function () {
    var tomb = new Tomb(),
        shards = tomb.generateKey();

    assert.throws(function () {
      tomb.unseal(shards.slice(0, 2));
    });
  });

  it("throws when unsealing with incorrect keys", function () {
    var tomb = new Tomb();

    assert.throws(function () {
      tomb.unseal(["a", "b", "c"]);
    });
  });

  it("encrypts strings", function () {
    var tomb = new Tomb(),
        shards = tomb.generateKey(),
        encrypted;

    tomb.unseal(shards);

    encrypted = tomb.encrypt("hello world");

    assert.ok(encrypted);
    assert.notEqual(encrypted, "hello world");
  });

  it("throws when trying to encrypt without a key", function () {
    var tomb = new Tomb();

    assert.throws(function () {
      tomb.encrypt("hello world");
    });
  });

  it("decrypts strings", function () {
    var tomb = new Tomb(),
        shards = tomb.generateKey(),
        encrypted,
        decrypted;

    tomb.unseal(shards);

    encrypted = tomb.encrypt("hello world");
    decrypted = tomb.decrypt(encrypted);

    assert.equal(decrypted, "hello world");
  });

  it("throws when trying to decrypt without a key", function () {
    var tomb = new Tomb();

    assert.throws(function () {
      tomb.decrypt("hello world");
    });
  });
});
