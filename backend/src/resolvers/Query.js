const Query = {
    users(parent, args, ctx, info) {
        global.users = global.users || []
        return global.users
    }
};

module.exports = Query;
