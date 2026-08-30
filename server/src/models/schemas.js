import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

const DocumentSchema = new Schema({
  title: { type: String, required: true, default: 'Untitled document' },
  content: { type: Schema.Types.Mixed, required: true }, // Tiptap JSON
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const ShareSchema = new Schema({
  document: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  permission: { type: String, enum: ['viewer', 'editor'], required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
ShareSchema.index({ document: 1, user: 1 }, { unique: true });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
export const ShareModel = mongoose.models.Share || mongoose.model('Share', ShareSchema);
