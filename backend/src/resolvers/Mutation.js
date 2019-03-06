const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Mutations = {
  async createItem(parent, args, ctx, info) {
    //TODO: check if logged in
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args,
        },
      },
      info,
    )
    return item
  },
  updateItem(parent, args, ctx, info) {
    const updates = { ...args }
    delete updates.id
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: { id: args.id },
      },
      info,
    )
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id }
    //find item
    const item = await ctx.db.query.item({ where }, `{id title}`)
    //check if user has permission
    //TODO
    //delete item
    return ctx.db.mutation.deleteItem({ where }, info)
  },
  async signup(parent, args, ctx, info) {
    //make incomming email lowercase
    args.email = args.email.toLowerCase()
    //hash the password
    const password = await bcrypt.hash(args.password, 10)
    // create user in db
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permission: { set: ['USER'] },
        },
      },
      info,
    )
    // create JWT for user
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // set JWT as cookie on response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie age
    })
    // return the user to browser
    return user
  },
}

module.exports = Mutations
