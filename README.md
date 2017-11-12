# redux-storage-adapter

Module that provides an interface for managing an accessing
[Web Storages](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) or
[AsyncStorage](https://facebook.github.io/react-native/docs/asyncstorage.html) via
[Redux](https://redux.js.org/).

## Web usage example

```js
import {
  createStorageAdapter,
  createActionCreators
} from "redux-storage-adapter";

const storageAdapter = createStorageAdapter(window.localStorage);

const rootReducer = combineReducers({
  storage: storageAdapter.reducer
});

const store = createStore(
  rootReducer,
  applyMiddleware(storageAdapter.middleware)
);

store.subscribe(() => {
  const { storage } = store.getState();
  console.log(storage);
});

const { prepare, setItem } = createActionCreators();

store.dispatch(prepare()).then(() => dispatch(setItem("key", "value")));
```

## React native usage example

```js
import {
  createStorageAdapter,
  createActionCreators
} from "redux-storage-adapter";

import { AsyncStorage } from "react-native";

const storageAdapter = createStorageAdapter(AsyncStorage);

const rootReducer = combineReducers({
  storage: storageAdapter.reducer
});

const store = createStore(
  rootReducer,
  applyMiddleware(storageAdapter.middleware)
);

store.subscribe(() => {
  const { storage } = store.getState();
  console.log(storage);
});

const { prepare, setItem } = createActionCreators();

store.dispatch(prepare()).then(() => dispatch(setItem("key", "value")));
```

## Example for namespacing

```js
import {
  createStorageAdapter,
  createActionCreators
} from "redux-storage-adapter";

const localStorageAdapter = createStorageAdapter(window.localStorage, {
  namespace: "localStorage"
});

const sessionStorageAdapter = createStorageAdapter(window.sessionStorage, {
  namespace: "sessionStorage"
});

const rootReducer = combineReducers({
  localStorage: localStorageAdapter.reducer,
  sessionStorage: sessionStorageAdapter.reducer
});

const store = createStore(
  rootReducer,
  applyMiddleware(
    localStorageAdapter.middleware,
    sessionStorageAdapter.middleware
  )
);

const localStorageActions = createActionCreators({
  namespace: "localStorage"
});

store
  .dispatch(localStorageActions.prepare())
  .then(() => dispatch(localStorageActions.setItem("localKey", "value")));

const sessionStorageActions = createActionCreators({
  namespace: "sessionStorage"
});

store
  .dispatch(sessionStorageActions.prepare())
  .then(() => dispatch(sessionStorageActions.setItem("sessionKey", "value")));
```

## API

### createStorageAdapter(storage, options)

TODO

Arguments:
  * storage (Web Storage / AsyncStorage instance)
  * options (optional object)
    * namespace (optional string)

### createActionCreators(options)

TODO

Arguments:
  * options (optional object)
    * namespace (optional string)

Return value:
  * actions (object)
    * prepare(): creates namespaced [STORAGE_PREPARE](#storage_prepare) action object
    * setItem(key, value): creates namespaced [STORAGE_SET_ITEM](#storage_set_item) action object
    * removeItem(key): creates namespaced [STORAGE_REMOVE_ITEM](#storage_remove_item) action object
    * clear(): creates namespaced [STORAGE_CLEAR](#storage_clear) action object

## Actions

The following actions may be used in a scoped format (e.g. localStorage/STORAGE_SET_ITEM).

### STORAGE_PREPARE

Loads the initial values from the storage to the reducer.
This action must be dispatched before any other storage event in the same namespace.
Dispatching this action more than once has no effect, but returns the same promise.
It can be used for avoid race conditions on initialization,
as well as to make sure the initial data is present in the reducer before accessing it.

Returns a promise that resolves on successful operation.

### STORAGE_SET_ITEM

Sets the specified item in the storage.

The following payload properties are required:
  * key (string): key of the item to be set
  * value (string): new value of the item

Returns a promise that resolves on successful operation.

### STORAGE_REMOVE_ITEM

Removes the specified item from the storage.

The following payload properties are required:
  * key (string): key of the item to be removed

Returns a promise that resolves on successful operation.

### STORAGE_CLEAR

Removes every item from the storage.

Returns a promise that resolves on successful operation.

## License

MIT License

Copyright (c) 2017 László Kardinál

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

