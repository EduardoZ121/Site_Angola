import mongoose from 'mongoose'

export function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      ok: false,
      error: 'Base de dados não ligada. Configure MONGODB_URI no .env',
    })
  }
  next()
}
