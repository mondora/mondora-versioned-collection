// It's possible to specify a schema for the `latest` property. The schema is
// tested using `Match.test`.
var BookSchema = new SimpleSchema({
    isbn: {
        type: String,
        optional: true
    },
    title: {
        type: String
    },
    author: {
        type: String
    }
});

// If not specified, the schema defaults to Match.Any
var Books = new VersionedCollection("books", BookSchema);

// As with normal collections, it's possible to attach allow and deny rules
Books.allow({
    insert: function (userId, postLatest, message) {
        return !!userId;
    },
    commit: function (userId, preLatest, postLatest, message) {
        return !!userId;
    }
});
Books.deny({
    insert: function (userId, postLatest, message) {
        // We want commits to be descriptive! ;-)
        return message.length < 5;
    },
    commit: function (userId, preLatest, postLatest, message) {
        // We want commits to be descriptive! ;-)
        return message.length < 5;
    }
});

// Just a stub
var getInfoFromIsbn = function (isbn) {
    return {
        isbn: "978-0618640157",
        title: "The Lord of the Rings",
        author: "J.R.R. Tolkien"
    };
};

// Before and after hooks are also available (for now, only for the insert and
// commit methods)
Books.before({
    insert: function (userId, postLatest, message) {
        if (postLatest.isbn) {
            this.replacePostLatest(
                getInfoFromIsbn(postLatest.isbn)
            );
        }
    }
});

// A versioned collection also has `find` and `findOne` methods, which are just
// proxy to the mongo collection's methods
Meteor.publish("books", function () {
    return Books.find();
});
