import mongoose from 'mongoose'

const siteSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'global' },
    useRealDataOnly: { type: Boolean, default: true },
    showDemoListings: { type: Boolean, default: false },
    showTestimonials: { type: Boolean, default: false },
    marketingStats: {
      propertiesPublished: { type: Number, default: null },
      vehicles: { type: Number, default: null },
      users: { type: Number, default: null },
      provinces: { type: Number, default: null },
      agents: { type: Number, default: null },
    },
  },
  { timestamps: true },
)

export const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema)

export async function getSiteSettings() {
  let doc = await SiteSettings.findById('global')
  if (!doc) {
    doc = await SiteSettings.create({ _id: 'global' })
  }
  return doc
}