if (Meteor.isServer && Meteor.users.find().count() === 0) {
    Accounts.createUser({
        username: "username",
        password: "password"
    });
}

if (Meteor.isClient) {
    Meteor.loginWithPassword("username", "password");
}
