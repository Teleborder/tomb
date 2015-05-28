Tomb
====

Simple, secure encryption and decryption with a sharded master key.

Usage
-----

### Generate a master key

```
var Tomb = require('tomb'),
    tomb = new Tomb();

// shards is an array of 5 master key shards, 3 of which are needed
// to use the tomb
// Store these shards away from the data and away from each other
var shards = tomb.generateKey;
```

### Unseal the tomb

```
// ideally these shards are stored separately
tomb.unseal([process.env.SHARD1, process.env.SHARD2, process.env.SHARD3]);
```

### Encrypt data

```
var secret = "hello world";

// unsealing is required prior to encrypting

encryptedSecret = tomb.encrypt(secret);
console.log(encryptedSecret); // asodfjsdfij
```

### Decrypt data

```
secret = tomb.decrypt(encryptedSecret);
console.log(secret); // hello world
```

Security
--------

Tomb uses the Node.js `randomBytes` function to generate a random Initialization Vector for
every secret, which is part of the returned secret value.

By default, it uses the `AES-256-CBC` algorithm with 128 bits for the IV.

To shard the master key, Tomb uses the [secrets.js](https://github.com/amper5and/secrets.js) library, an implementation
of [Shamir's Secret Sharing](http://en.wikipedia.org/wiki/Shamir%27s_Secret_Sharing).
