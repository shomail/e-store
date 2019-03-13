const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomBytes } = require('crypto')
const { promisify } = require('util')
const { transport, makeEmail } = require('../mail')
const { hasPermission } = require('../utils')

const Mutations = {
  async createItem(parent, args, ctx, info) {
    //TODO: check if logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!')
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // Creating relationship between item and user in prisma
          user: {
            connect: {
              id: ctx.request.userId,
            },
          },
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
    const item = await ctx.db.query.item({ where }, `{id title user { id }}`)
    //check if user has permission
    const ownsItem = item.user.id === ctx.request.userId
    const hasPermission = ctx.request.user.permissions.some(permission => ['ADMIN', 'ITEMDELETE'].includes(permission))
    if (!ownsItem && !hasPermission) {
      throw new Error('You do not have permission to delete this item!')
    }
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
    //3. email reset token
    const mailResponse = await transport.sendMail({
      from: 'e-store@mail.com',
      to: user.email,
      subject: 'Password reset token from e-Store',
      html: makeEmail(
        `Your password reset token is here! \n\n <a href="${
          process.env.FRONTEND_URL
        }/reset?resetToken=${resetToken}">Click Here to Reset</a>`,
      ),
    })
    //4. retrun message
    return { message: 'Thanks' }
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
  async updatePermissions(parent, args, ctx, info) {
    // 1. check if logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!')
    }
    // 2. query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      info,
    )
    // 3. check if they have permission
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE'])
    // 4. update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions,
          },
        },
        where: {
          id: args.userId,
        },
      },
      info,
    )
  },
  async addToCart(parent, args, ctx, info) {
    // 1. user is signed in
    const { userId } = ctx.request
    if (!userId) {
      throw new Error('You must be signed in!')
    }
    // 2. query the users current cart
    const [existingCartItem] = ctx.db.query.cartItems({
      user: { id: userId },
      item: { id: args.id },
    })
    // 3. check if that item is already in cart and increment by 1 if it is
    if (existingCartItem) {
      console.log('item already in cart')
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 },
      })
    }
    // 4. if it is not, create a fresh cart item
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId },
        },
        item: {
          connect: { id: args.id },
        },
      },
    })
  },
}

module.exports = Mutations
