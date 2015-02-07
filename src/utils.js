utils = {
    ensure: function (condition, reason) {
        if (!condition) {
            throw new Meteor.Error(
                "incorrect-request",
                reason
            );
        }
    }
};
