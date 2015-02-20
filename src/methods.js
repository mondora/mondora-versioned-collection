var R   = Npm.require("ramda");

methods = {

    insert: function (instance, postLatest, message) {
        // Type-checking arguments
        utils.ensure(
            R.is(Object, postLatest),
            "First parameter `postLatest` must be an object"
        );
        utils.ensure(
            R.is(String, message),
            "Second parameter `message` must be a string"
        );
        // Get the userId: we don't user `this.userId` because when cascading
        // method calls on the server it gets lost, while `Meteor.userId()`
        // doesn't
        var userId = Meteor.userId();
        // Run allow rules
        var allowed = instance._runAllowRules(
            "insert",
            userId,
            null,
            R.clone(postLatest)
        );
        utils.ensure(
            R.eq(true, allowed),
            "No allow rule returned true, aborting"
        );
        // Run deny rules
        var denied = instance._runDenyRules(
            "insert",
            userId,
            null,
            R.clone(postLatest)
        );
        utils.ensure(
            R.eq(false, denied),
            "Some deny rule(s) returned true, aborting"
        );
        // Perform the insert
        return instance.insert(userId, postLatest, message);
    },

    commit: function (instance, documentId, postLatest, message) {
        // Type-checking arguments
        utils.ensure(
            R.is(String, documentId),
            "First parameter `documentId` must be a string"
        );
        utils.ensure(
            R.is(Object, postLatest),
            "Second parameter `postLatest` must be an object"
        );
        utils.ensure(
            R.is(String, message),
            "Third parameter `message` must be a string"
        );
        // Get the userId: we don't user `this.userId` because when cascading
        // method calls on the server it gets lost, while `Meteor.userId()`
        // doesn't
        var userId = Meteor.userId();
        // Construct the pre and post latest objects
        var doc = instance._collection.findOne({_id: documentId});
        var preLatest = R.clone(doc.latest);
        // Run allow rules
        var allowed = instance._runAllowRules(
            "commit",
            userId,
            R.clone(preLatest),
            R.clone(postLatest)
        );
        utils.ensure(
            R.eq(true, allowed),
            "No allow rule returned true, aborting"
        );
        // Run deny rules
        var denied = instance._runDenyRules(
            "commit",
            userId,
            R.clone(preLatest),
            R.clone(postLatest)
        );
        utils.ensure(
            R.eq(false, denied),
            "Some deny rule(s) returned true, aborting"
        );
        // Perform the commit
        return instance.commit(userId, documentId, postLatest, message);
    }

};
