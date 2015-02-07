var jdp = Npm.require("jsondiffpatch");
var R   = Npm.require("ramda");

methods = {

    insert: function (instance, delta, message) {
        // Type-checking arguments
        utils.ensure(
            R.is(Object, delta),
            "First parameter `delta` must be an object"
        );
        utils.ensure(
            R.is(String, message),
            "Second parameter `message` must be a string"
        );
        // Construct the post latest objects
        var postLatest = jdp.patch({}, delta);
        // Run allow rules
        var allowed = instance._runAllowRules(
            "insert",
            this.userId,
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
            this.userId,
            null,
            R.clone(postLatest)
        );
        utils.ensure(
            R.eq(false, denied),
            "Some deny rule(s) returned true, aborting"
        );
        // Perform the insert
        return instance.insert(this.userId, delta, message);
    },

    commit: function (instance, documentId, delta, message) {
        // Type-checking arguments
        utils.ensure(
            R.is(String, documentId),
            "First parameter `documentId` must be a string"
        );
        utils.ensure(
            R.is(Object, delta),
            "Second parameter `delta` must be an object"
        );
        utils.ensure(
            R.is(String, message),
            "Third parameter `message` must be a string"
        );
        // Construct the pre and post latest objects
        var doc = instance._collection.findOne({_id: documentId});
        var preLatest = R.clone(doc.latest);
        var postLatest = jdp.patch(R.clone(preLatest), delta);
        // Run allow rules
        var allowed = instance._runAllowRules(
            "commit",
            this.userId,
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
            this.userId,
            R.clone(preLatest),
            R.clone(postLatest)
        );
        utils.ensure(
            R.eq(false, denied),
            "Some deny rule(s) returned true, aborting"
        );
        // Perform the commit
        return instance.commit(this.userId, documentId, delta, message);
    }

};
