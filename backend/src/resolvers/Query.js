const Query = {
    users(parent, args, ctx, info) {
        return [{name: 'shomail', email: 'sh@mail.com'}, {name: 'shoby', email:'shoby@mail.com'}]
    }
};

module.exports = Query;
