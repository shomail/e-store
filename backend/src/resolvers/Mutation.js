const Mutations = {
    createUser(parent, args, ctx, info) {
        global.users = global.users || []
        //create user
        const newUser = { name: args.name, email: args.email }
        global.users.push(newUser)
        return newUser;
    } 
};

module.exports = Mutations;
