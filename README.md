[![Build Status](https://travis-ci.org/mondora/mondora-versioned-collection.svg?branch=master)](https://travis-ci.org/mondora/mondora-versioned-collection)
#mondora:versioned-collection

###Usage

```js
// We use the jsondiffpatch library to calculate deltas. Here, we include it
// using `meteorhacks:npm`
var jdp = Meteor.npmRequire("jsondiffpatch");

// Each commit must have a `userId` property, hence, we need a user
var user = Meteor.users.findOne();

var Books = new VersionedCollection("books");

var book_v0 = {
    title: "The Lord of the Rings",
    author: "J. R. R. Tolkien"
};

var bookId = Books.insert(user._id, book_v0, "Initial commit");

var book_v1 = {
    title: "The Lord of the Rings",
    author: "J. R. R. Tolkien",
    published: "29 July 1954"
};

Books.commit(user._id, bookId, book_v1, "Added published field");
```

###Notes

Internally, the collection keeps the following data structure for a versioned
document.

NOTE: the structure is not enforced in any way (e.g. the SimpleSchema library)
other than the code convention.

Commit structure:

```js
{
    date: Number,
    userId: String,
    message: String,
    delta: Object
}
```

Document structure:

```js
{
    commits: [commitStructure],
    lastModifiedOn: Number,
    lastModifiedBy: String,
    latest: Object
}
```

###Hooks

Example:

```js

var Books = new VersionedCollection("books");

Books.before({
    insert: function (userId, postLatest) {
        this.abort();
    },
    commit: function (userId, preLatest, postLatest) {
        this.abort();
    }
});

```
