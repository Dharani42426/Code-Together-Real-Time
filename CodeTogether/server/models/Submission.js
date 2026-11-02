const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Runtime Error',
        'Compilation Error',
        'Time Limit Exceeded',
        'Memory Limit Exceeded',
        'Pending',
      ],
      default: 'Pending',
    },
    runtime: {
      type: String,
      default: '0 ms',
    },
    memory: {
      type: String,
      default: '0 MB',
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    output: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
