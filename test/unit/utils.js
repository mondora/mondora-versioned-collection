/*
*   utils.ensure
*/

Tinytest.add("utils - ensure - throws if first parameter is falsy", function (test) {
    // TEST
    test.throws(utils.ensure.bind(null, false, "reason"), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "reason"
        );
    });
});
