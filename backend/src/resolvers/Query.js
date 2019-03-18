const { forwardTo } = require('prisma-binding')
const { hasPermission } = require('../utils')
const Query = {
  items: forwardTo('db'),
  item: forwardTo('db'),
  itemsConnection: forwardTo('db'),
  me(parent, args, ctx, info) {
    //check if there is current user ID
    if (!ctx.request.userId) {
      return null
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId },
      },
      info,
    )
  },
  async users(parent, args, ctx, info) {
    //1. check if user is logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!')
    }
    //2. check if the user has permission to query all users
    hasPermission(ctx.request.user, ['ADMIN', 'PERMISSIONUPDATE'])
    //3. query all users
    return ctx.db.query.users({}, info)
  },
  async order(parent, args, ctx, info) {
    // 1. make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be signed in to see this order!')
    }
    // 2. query the current order
    const order = await ctx.db.query.order(
      {
        where: { id: args.id },
      },
      info,
    )
    // 3. check if they have permissions to see this order
    const ownsOrder = order.user.id === ctx.request.userId
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes('ADMIN')
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error('You cannot see this order!')
    }
    // 4. return the order
    return order
  },
}

module.exports = Query
