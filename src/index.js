module.exports = {
  createActionCreators: require("./actionCreators.js"),
  createStorageAdapter: require("./reduxStorageAdapter.js")({ window })
};
