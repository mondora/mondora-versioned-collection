Meteor.subscribe("books");
Books = new Mongo.Collection("books");

BookSchema = new SimpleSchema({
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

var getBookFromForm = function (target) {
    var form = $(target);
    return {
        isbn: form.find("input[name=isbn]")[0].value,
        title: form.find("input[name=title]")[0].value,
        author: form.find("input[name=author]")[0].value
    };
};

var resetBookForm = function (target) {
    var form = $(target);
    form.find("input[name=isbn]")[0].value = "";
    form.find("input[name=title]")[0].value = "";
    form.find("input[name=author]")[0].value = "";
};

Template.insertBook.events({
    submit: function (e) {
        e.preventDefault();
        var book = getBookFromForm(e.target);
        Meteor.call("VersionedCollection:books:insert", book, "Initial commit");
        resetBookForm(e.target);
    }
});

Template.booksList.helpers({
    books: function () {
        return Books.find();
    }
});

Template.bookDetail.helpers({
    toJson: function () {
        return JSON.stringify(this, null, 2);
    },
    id: function () {
        return this._id;
    }
});

Template.bookDetail.events({
    submit: function (e) {
        e.preventDefault();
        var book = getBookFromForm(e.target);
        Meteor.call("VersionedCollection:books:commit", this.id, book, "Another commit");
    }
});
