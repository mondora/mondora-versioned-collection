var jdp = Npm.require("jsondiffpatch");
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

        // Run allow rules
        var allowResults = rulesEngine.runRules(
            instance,
            "allow",
            "insert",
            this.userId,
            null,
            R.clone(postLatest),
            message
        );
        // Ensure at least one of the allow calls returned true
        utils.ensure(
            R.any(R.identity, allowResults),
            "No allow rule returned true, aborting"
        );

        // Run deny rules
        var denyResults = rulesEngine.runRules(
            instance,
            "deny",
            "insert",
            this.userId,
            null,
            R.clone(postLatest),
            message
        );
        // Ensure none of the deny calls returned true
        utils.ensure(
            !R.any(R.identity, denyResults),
            "Some deny rule(s) returned true, aborting"
        );

        // Perform the insert
        return instance.insert(this.userId, postLatest, message);

    },

    commit: function (instance, documentId, postLatest, message) {

        // Type-checking arguments
        utils.ensure(
            R.is(String, documentId),
            "First parameter `documentId` must be a string"
        );
        utils.ensure(
            R.is(Object, postLatest),
            "Second parameter `delta` must be an object"
        );
        utils.ensure(
            R.is(String, message),
            "Third parameter `message` must be a string"
        );

        // Get the doc (needed for the preLatest object) and ensure it exists
        var doc = instance._collection.findOne({_id: documentId});
        utils.ensure(
            doc,
            "Document not found"
        );

        // Run allow rules
        var allowResults = rulesEngine.runRules(
            instance,
            "allow",
            "commit",
            this.userId,
            R.clone(doc.latest),
            R.clone(postLatest),
            message
        );
        // Ensure at least one of the allow calls returned true
        utils.ensure(
            R.any(R.identity, allowResults),
            "No allow rule returned true, aborting"
        );

        // Run deny rules
        var denyResults = rulesEngine.runRules(
            instance,
            "deny",
            "commit",
            this.userId,
            R.clone(doc.latest),
            R.clone(postLatest),
            message
        );
        // Ensure none of the deny calls returned true
        utils.ensure(
            !R.any(R.identity, denyResults),
            "Some deny rule(s) returned true, aborting"
        );

        // Perform the commit
        return instance.commit(this.userId, documentId, postLatest, message);

    }

};
