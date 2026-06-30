import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true, index: true },
    googleId: { type: String, index: true, sparse: true },
    picture: String,
    emailVerified: Boolean,
    userRole: String,
    accountType: String,
    phone: String,
    buyerOnboardingDone: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isAgent: { type: Boolean, default: false },
    agentApprovedAt: Date,
    subscription: String,
    sessionId: String,
    authProvider: { type: String, default: 'google' },
    favorites: [{ type: String }],
    compare: [{ type: String }],
    history: [{ type: String }],
  },
  { timestamps: true },
)

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = String(ret._id)
    delete ret.__v
    return ret
  },
})

export const User = mongoose.models.User || mongoose.model('User', userSchema)
