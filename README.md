Tomb
====

Simple, secure encryption and decryption with a sharded master key.

Installation
------------

```
$ npm install --save tomb
```

Usage
-----

### Generate a master key

```
var Tomb = require('tomb'),
    tomb = new Tomb();

var shards = tomb.generateKey;

// shards is an array of 5 master key shards, 3 of which are needed
// to use the tomb
// Store these shards away from the data and away from each other
console.log(shards);
// [
//  '801c2cf88c071961587f2535aa0bc74352669de05d4ba3796441fe3e9a492c001a329',
//  '802b5987c3ee214d9e3aff9791ac9e7d93d15c48ad144dd8ae65108790553ab17abbb',
//  '803761363ccec7ce0b3fae7917350edd5e57f3b9ff03e9df4bde263cbd26cd64ad357',
//  '804c89a2fd966dffdd505222176cb5f23c000eec33808966ed169d06eac76062901ef',
//  '8050b11302b68b7c485503cc91f52552f186a11d61972d6108adabbdc7b497b747903'
// ]
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
console.log(encryptedSecret); // 202b65485c2c42ba090467a04d5104f883addcfb5e4a88485b09566e0181d680
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
