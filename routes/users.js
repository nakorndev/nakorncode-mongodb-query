const { ObjectID } = require('mongodb')
const mongoClient = require('../database/mongo-client')

const users = mongoClient.db('my-first-project').collection('users')

const router = require('express-async-router').AsyncRouter()

router.get('/', async (req, res) => {
  const page = Number(req.query.page) || 1
  const perPage = Number(req.query.per_page) || 30
  const offset = (page - 1) * perPage
  const cond = {}
  if (req.query.terminated == 'yes') {
    // $ne = not equal
    cond.terminationDate = { $ne: null } 
  }
  if (req.query.terminated == 'no') {
    cond.terminationDate = null
  }
  if (req.query.age_lt) {
    // $lt = less than <
    // $lte = less than or equal <=
    cond.age = { $lte: Number(req.query.age_lt) }
  }
  if (req.query.age_gt) {
    // $gt = greater than >
    // $gte = greater than or equal >=
    const qy = { $gte: Number(req.query.age_gt) }
    if (typeof cond.age == 'object') {
      Object.assign(cond.age, qy)
    } else {
      cond.age = qy
    }
  }
  if (req.query.age) {
    cond.age = Number(req.query.age)
  }
  if (req.query.skills?.length) {
    const value = Array.isArray(req.query.skills)
      ? req.query.skills
      : [ req.query.skills ]
    cond.skills = { $all: value }
  }
  const cursor = await users
    .find(cond)
    .skip(offset)
    .limit(perPage)
  const list = await cursor.toArray()
  if (!Array.isArray(req.query.skills)) {
    req.query.skills = []
  }
  return res.render('users-index.pug', {
    users: list,
    query: req.query,
    skills: Array.isArray(req.query.skills)
      ? req.query.skills
      : [ req.query.skills ]
  })
})

router.get('/:id', async (req, res) => {
  const id = req.params.id
  const user = await users.findOne({ _id: new ObjectID(id) })
  if (!user) {
    res.status(404)
    return res.send({ message: 'user not found' })
  }
  return res.render('users-show.pug', { user })
})

router.get('/:id/edit', async (req, res) => {
  const id = req.params.id
  const user = await users.findOne({ _id: new ObjectID(id) })
  if (!user) {
    res.status(404)
    return res.send({ message: 'user not found' })
  }
  return res.render('users-edit.pug', { user })
})

module.exports = router
