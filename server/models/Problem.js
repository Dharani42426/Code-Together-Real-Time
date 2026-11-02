const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
});

const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String, default: '' },
});

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    category: {
      type: [String],
      default: [],
    },
    examples: [exampleSchema],
    constraints: {
      type: [String],
      default: [],
    },
    testCases: [testCaseSchema],
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },
    acceptance: {
      type: String,
      default: '0%',
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Text index for search
problemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Problem', problemSchema);
