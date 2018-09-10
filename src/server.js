const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const Sequelize = require('sequelize')
const epilogue = require('epilogue')
const OktaJwtVerifier = require('@okta/jwt-verifier')

const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: '0oag6ydh4xB1yt0af0h7',
  issuer: 'https://dev-203427.oktapreview.com/oauth2/default'
})

let app = express()
app.use(cors())
app.use(bodyParser.json())

app.use((req, res, next) => {
  if (!req.headers.authorization) {
    return next(new Error('Authorization header is required'))
  }
  let parts = req.headers.authorization.trim().split(' ')
  let accessToken = parts.pop()
  oktaJwtVerifier.verifyAccessToken(accessToken)
    .then(jwt => {
      req.user = {
        uid: jwt.claims.uid,
        email: jwt.claims.sub
      }
      next()
    })
    .catch((reason) => {
      console.log(reason)
    })
})

let database = new Sequelize({
  dialect: 'sqlite',
  storage: './text.sqlite'
})

let Post = database.define('posts', {
  title: Sequelize.STRING,
  body: Sequelize.TEXT
})

epilogue.initialize({
  app: app,
  sequelize: database
})

let userResource = epilogue.resource({
  model: Post,
  endpoints: ['/posts', '/posts/:id']
})

database
  .sync({ fource: true })
  .then(() => {
    app.listen(8081, () => {
      console.log(`listening to port localhost:8081`)
    })
  })
