const tsPreset = require('ts-jest/jest-preset')
const puppeteerPreset = require('jest-puppeteer/jest-preset')
const { mergeRight } = require('ramda')

module.exports = {
  ...mergeRight(tsPreset, puppeteerPreset),
};
