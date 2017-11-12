module.exports = ({ window } = {}) => (storage, { namespace = null } = {}) => {
  let preparingPromise = null;

  const middleware = store => next => action => {
    switch (action.type) {
      case `${namespace ? namespace + "/" : ""}STORAGE_PREPARE`: {
        if (preparingPromise) {
          return preparingPromise;
        }

        if (window && window.addEventListener) {
          window.addEventListener("storage", e => {
            if (e.storageArea === storage) {
              if (e.newValue === null) {
                store.dispatch({
                  type: `${namespace
                    ? namespace + "/"
                    : ""}STORAGE_REMOVE_ITEM`,
                  key: e.key,
                  fromEvent: true
                });
              } else {
                store.dispatch({
                  type: `${namespace ? namespace + "/" : ""}STORAGE_SET_ITEM`,
                  key: e.key,
                  value: e.newValue,
                  fromEvent: true
                });
              }
            }
          });
        }

        const nextWithInitialEntries = entries => {
          const initialValues = entries.reduce(
            (obj, entry) => ({ ...obj, [entry[0]]: entry[1] }),
            {}
          );

          return next({
            ...action,
            initialValues
          });
        };

        if ("getAllKeys" in storage && "multiget" in storage) {
          preparingPromise = storage
            .getAllKeys()
            .then(keys => storage.multiget(keys))
            .then(nextWithInitialEntries);

          return preparingPromise;
        } else if ("length" in storage && "key" in storage) {
          preparingPromise = Promise.resolve(
            new Array(storage.length).fill(null).map((_, index) => {
              const key = storage.key(index);
              return [key, storage.getItem(key)];
            })
          ).then(nextWithInitialEntries);

          return preparingPromise;
        }

        return Promise.reject(new Error("Unknown storage format"));
      }

      case `${namespace ? namespace + "/" : ""}STORAGE_SET_ITEM`:
        return action.fromEvent
          ? next(action)
          : Promise.resolve(
              storage.setItem(action.key, action.value)
            ).then(() => next(action));

      case `${namespace ? namespace + "/" : ""}STORAGE_REMOVE_ITEM`:
        return action.fromEvent
          ? next(action)
          : Promise.resolve(storage.removeItem(action.key)).then(() =>
              next(action)
            );

      case `${namespace ? namespace + "/" : ""}STORAGE_CLEAR`:
        return Promise.resolve(storage.clear()).then(() => next(action));
    }

    return next(action);
  };

  const reducer = (state = null, action) => {
    switch (action.type) {
      case `${namespace ? namespace + "/" : ""}STORAGE_PREPARE`:
        return action.initialValues;

      case `${namespace ? namespace + "/" : ""}STORAGE_SET_ITEM`:
        return { ...state, [action.key]: action.value };

      case `${namespace ? namespace + "/" : ""}STORAGE_REMOVE_ITEM`:
        return Object.keys(state)
          .filter(key => key !== action.key)
          .reduce((newState, key) => ({ ...newState, [key]: state[key] }), {});

      case `${namespace ? namespace + "/" : ""}STORAGE_CLEAR`:
        return {};
    }

    return state;
  };

  return {
    middleware,
    reducer
  };
};
