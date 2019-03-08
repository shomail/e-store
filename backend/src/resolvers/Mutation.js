const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { promisify } = require('util')

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
          permissions: { set: ['USER'] },
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
  async signin(parent, { email, password }, ctx, info) {
    // 1- check if ther is a user with email
    const user = await ctx.db.query.user({ where: { email } })
    if (!user) {
      throw new Error(`No user found for email: ${email}`)
    }
    // 2- check if password is correct
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      throw new Error('Invalid Password!')
    }
    // 3- generate the JWT
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET)
    // 4- set the cookie with token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie age
    })
    // 5- retrun the user
    return user
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token')
    return { message: 'signed out successfully' }
  },
  async requestReset(parent, args, ctx, info) {
    //1. check if real user
    const user = await ctx.db.query.user({ where: { email: args.email } })
    if (!user) {
      throw new Error(`No user found for email: ${args.email}`)
    }
    //2. set a reset token and expiry
    const randomBytesPromise = promisify(randomBytes)
    const resetToken = (await randomBytesPromise(20)).toString('hex')
    const resetTokenExpiry = Date.now() + 3600000 // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    })
    console.log(res)
    return { message: 'Thanks' }
    //3. email reset token
  },
  async resetPassword(parent, { password, confirmPassword, resetToken }, ctx, info) {
    // 1. check if passwords match
    if (password !== confirmPassword) {
      throw new Error("Passwords don't match")
    }
    // 2. check if valid request token
    // 3. check if its expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    })
    if (!user) {
      throw new Error('This token is either invalid or expired')
    }
    // 4. hash new password
    const hasedPassword = await bcrypt.hash(password, 10)
    // 5. save new password and remove reset token
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password: hasedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })
    // 6. generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET)
    // 7. set JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    })
    // 8. return new user
    return updatedUser
  },
}

module.exports = Mutations
