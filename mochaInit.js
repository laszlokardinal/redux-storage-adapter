require("babel-register")({
  presets: [ "es2015", "stage-0" ],
});

const { JSDOM } = require("jsdom");
const { document } = new JSDOM(
  "<!doctype html><html><body></body></html>"
).window;
const window = document.defaultView;

const { expect } = require("chai");

const sinon = require("sinon");

Object.assign(global, {
  window,
  expect,
  sinon
});