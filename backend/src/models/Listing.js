import mongoose from 'mongoose'

const listingSchema = new mongoose.Schema(
  {
    legacyId: { type: String, index: true },
    category: String,
    operation: String,
    propertyType: String,
    title: { type: String, required: true },
    price: Number,
    province: String,
    municipality: String,
    neighborhood: String,
    bedrooms: Number,
    bathrooms: Number,
    area: Number,
    ownerName: String,
    ownerType: String,
    phone: String,
    ownerEmail: { type: String, index: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    verifiedProfile: Boolean,
    verifiedPhone: Boolean,
    verifiedDocument: Boolean,
    trustSeal: String,
    status: { type: String, default: 'Pendente', index: true },
    featured: { type: Boolean, default: false },
    featuredUntil: Date,
    featuredPlanId: String,
    description: String,
    photos: [String],
    amenities: [String],
    rules: [String],
    documentation: [String],
    views: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    reference: String,
    slug: String,
    lat: Number,
    lng: Number,
    fuel: String,
    gearbox: String,
    condition: String,
    year: Number,
    mileage: Number,
    rejectionReason: String,
    submittedByAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

listingSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret.legacyId || String(ret._id)
    delete ret.__v
    return ret
  },
})

export const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema)
