describe("createStorageAdapter()", () => {
  describe("returns a middleware that", () => {
    describe("on action with unknown type", () => {
      it("returns next(action)", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const { middleware } = createStorageAdapter({}, { namespace: "donut" });

        const dispatch = sinon.spy();
        const next = sinon.spy(({ returnValue }) => returnValue);

        const withNext = middleware({ dispatch })(next);

        expect(next.callCount).to.equal(0);

        const testAction = { type: "PIZZA_SET_ITEM", returnValue: "pineapple" };
        expect(withNext(testAction)).to.equal("pineapple");
        expect(next.callCount).to.equal(1);
        expect(next.args[0][0]).to.equal(testAction);
      });
    });

    describe("on action with STORAGE_PREPARE type", () => {
      it("subscribes to storage events", () => {
        sinon.spy(window, "addEventListener");
        const createStorageAdapter = require("./createStorageAdapter.js")({
          window
        });
        const { middleware } = createStorageAdapter({}, { namespace: "donut" });

        expect(window.addEventListener.calledOnce).to.be.false;

        middleware({ dispatch: () => null })(() => null)({
          type: "donut/STORAGE_PREPARE"
        });

        expect(window.addEventListener.calledOnce).to.be.true;
        expect(window.addEventListener.args[0][0]).to.equal("storage");
        expect(typeof window.addEventListener.args[0][1]).to.equal("function");

        window.addEventListener.restore();
      });

      it("calls next with the action extended with initalValues when the store is AsyncStorage", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          getAllKeys: () => Promise.resolve(["cinnamon", "sugar", "chocolate"]),
          multiget: keys => Promise.resolve(keys.map(key => [key, key]))
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const next = sinon.spy(() => Promise.resolve());

        return middleware({ dispatch: () => null })(next)({
          type: "donut/STORAGE_PREPARE"
        }).then(() => {
          expect(next.callCount).to.equal(1);
          expect(next.args[0][0]).to.deep.equal({
            type: "donut/STORAGE_PREPARE",
            initialValues: {
              cinnamon: "cinnamon",
              sugar: "sugar",
              chocolate: "chocolate"
            }
          });
        });
      });

      it("calls next with the action extended with initalValues when the store is Storage", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          length: 3,
          key: index => ["cinnamon", "sugar", "chocolate"][index],
          getItem: key => key
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const next = sinon.spy(() => Promise.resolve());

        return middleware({ dispatch: () => null })(next)({
          type: "donut/STORAGE_PREPARE"
        }).then(() => {
          expect(next.callCount).to.equal(1);
          expect(next.args[0][0]).to.deep.equal({
            type: "donut/STORAGE_PREPARE",
            initialValues: {
              cinnamon: "cinnamon",
              sugar: "sugar",
              chocolate: "chocolate"
            }
          });
        });
      });

      it("rejects on unknown storage format", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {};

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const next = sinon.spy(() => Promise.resolve());

        return middleware({ dispatch: () => null })(next)({
          type: "donut/STORAGE_PREPARE"
        })
          .then(() => {
            throw "resolved";
          })
          .catch(error => {
            if (error === "resolved") {
              throw new Error("The returned promise resolved");
            }

            expect(error)
              .to.be.an.instanceOf(Error)
              .with.property("message", "Unknown storage format");

            expect(next.callCount).to.equal(0);
          });
      });

      it("doesn't call next if the action was already dispatched", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          getAllKeys: () => Promise.resolve(["cinnamon", "sugar", "chocolate"]),
          multiget: keys => Promise.resolve(keys.map(key => [key, key]))
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const next = sinon.spy(() => Promise.resolve());

        const withNext = middleware({ dispatch: () => null })(next);

        return withNext({
          type: "donut/STORAGE_PREPARE"
        })
          .then(() => {
            expect(next.callCount).to.equal(1);

            return withNext({ type: "donut/STORAGE_PREPARE" });
          })
          .then(() => {
            expect(next.callCount).to.equal(1);
          });
      });

      it("returns the same promise for the following dispatches", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          getAllKeys: () => Promise.resolve(["cinnamon", "sugar", "chocolate"]),
          multiget: keys => Promise.resolve(keys.map(key => [key, key]))
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const next = sinon.spy(() => Promise.resolve());

        const withNext = middleware({ dispatch: () => null })(next);

        const returnedPromise = withNext({
          type: "donut/STORAGE_PREPARE"
        });

        expect(withNext({ type: "donut/STORAGE_PREPARE" })).to.equal(
          returnedPromise
        );

        return returnedPromise.then(() => {
          expect(withNext({ type: "donut/STORAGE_PREPARE" })).to.equal(
            returnedPromise
          );
        });
      });
    });

    describe("on action with STORAGE_SET_ITEM type", () => {
      it("sets item in the storage", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          setItem: sinon.spy(() => Promise.resolve())
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const dispatch = sinon.spy();
        const next = sinon.spy();

        const withNext = middleware({ dispatch })(next);

        expect(next.callCount).to.equal(0);

        const testAction = {
          type: "donut/STORAGE_SET_ITEM",
          key: "lemon",
          value: "orange"
        };

        return withNext(testAction).then(value => {
          expect(next.callCount).to.equal(1);
          expect(next.args[0][0]).to.equal(testAction);
          expect(storage.setItem.calledOnce).to.be.true;
          expect(storage.setItem.args[0]).to.deep.equal(["lemon", "orange"]);
        });
      });

      it("doesn't set item if fromEvent is true", done => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          setItem: sinon.spy(() => Promise.resolve())
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const testAction = {
          type: "donut/STORAGE_SET_ITEM",
          key: "lemon",
          value: "orange",
          fromEvent: true
        };

        const dispatch = sinon.spy();

        const next = action => {
          try {
            expect(storage.setItem.callCount).to.equal(0);
            expect(action).to.equal(testAction);
            done();
          } catch (err) {
            done(err);
          }
        };

        const withNext = middleware({ dispatch })(next);

        withNext(testAction);
      });
    });

    describe("on action with STORAGE_REMOVE_ITEM type", () => {
      it("removes item from the storage", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          removeItem: sinon.spy(() => Promise.resolve())
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const dispatch = sinon.spy();
        const next = sinon.spy();

        const withNext = middleware({ dispatch })(next);

        expect(next.callCount).to.equal(0);

        const testAction = {
          type: "donut/STORAGE_REMOVE_ITEM",
          key: "lemon"
        };

        return withNext(testAction).then(value => {
          expect(next.callCount).to.equal(1);
          expect(next.args[0][0]).to.equal(testAction);
          expect(storage.removeItem.calledOnce).to.be.true;
          expect(storage.removeItem.args[0]).to.deep.equal(["lemon"]);
        });
      });

      it("doesn't remove item if fromEvent is true", done => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          removeItem: sinon.spy(() => Promise.resolve())
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const testAction = {
          type: "donut/STORAGE_REMOVE_ITEM",
          key: "lemon",
          fromEvent: true
        };

        const dispatch = sinon.spy();

        const next = action => {
          try {
            expect(storage.removeItem.callCount).to.equal(0);
            expect(action).to.equal(testAction);
            done();
          } catch (err) {
            done(err);
          }
        };

        const withNext = middleware({ dispatch })(next);

        withNext(testAction);
      });
    });

    describe("on action with STORAGE_CLEAR type", () => {
      it("clears the storage ", () => {
        const createStorageAdapter = require("./createStorageAdapter.js")();

        const storage = {
          clear: sinon.spy(() => Promise.resolve())
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "donut"
        });

        const dispatch = sinon.spy();
        const next = sinon.spy();

        const withNext = middleware({ dispatch })(next);

        expect(next.callCount).to.equal(0);

        const testAction = {
          type: "donut/STORAGE_CLEAR"
        };

        return withNext(testAction).then(value => {
          expect(next.callCount).to.equal(1);
          expect(next.args[0][0]).to.equal(testAction);
          expect(storage.clear.calledOnce).to.be.true;
        });
      });
    });

    describe("on storage events", () => {
      it("dispatches STORAGE_REMOVE_ITEM on removal with fromEvent=true", () => {
        sinon.spy(window, "addEventListener");
        const createStorageAdapter = require("./createStorageAdapter.js")({
          window
        });

        const storage = {
          getAllKeys: () => Promise.resolve([]),
          multiget: () => Promise.resolve([])
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "cake"
        });

        const dispatch = sinon.spy();

        return middleware({ dispatch })(() => null)({
          type: "cake/STORAGE_PREPARE"
        })
          .then(() => {
            expect(window.addEventListener.calledOnce).to.be.true;

            window.addEventListener.args[0][1]({
              key: "chocolate",
              oldValue: "yum",
              newValue: null,
              storageArea: storage
            });

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.deep.equal({
              type: `cake/STORAGE_REMOVE_ITEM`,
              key: "chocolate",
              fromEvent: true
            });
          })
          .then(() => window.addEventListener.restore())
          .catch(error => {
            window.addEventListener.restore();
            throw error;
          });
      });

      it("dispatches STORAGE_SET_ITEM on update with fromEvent=true", () => {
        sinon.spy(window, "addEventListener");
        const createStorageAdapter = require("./createStorageAdapter.js")({
          window
        });

        const storage = {
          getAllKeys: () => Promise.resolve([]),
          multiget: () => Promise.resolve([])
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "cake"
        });

        const dispatch = sinon.spy();

        return middleware({ dispatch })(() => null)({
          type: "cake/STORAGE_PREPARE"
        })
          .then(() => {
            expect(window.addEventListener.calledOnce).to.be.true;

            window.addEventListener.args[0][1]({
              key: "chocolate",
              oldValue: "yum",
              newValue: "yum yum",
              storageArea: storage
            });

            expect(dispatch.calledOnce).to.be.true;
            expect(dispatch.args[0][0]).to.deep.equal({
              type: `cake/STORAGE_SET_ITEM`,
              key: "chocolate",
              value: "yum yum",
              fromEvent: true
            });
          })
          .then(() => window.addEventListener.restore())
          .catch(error => {
            window.addEventListener.restore();
            throw error;
          });
      });

      it("ignores storage events of other stores", () => {
        sinon.spy(window, "addEventListener");
        const createStorageAdapter = require("./createStorageAdapter.js")({
          window
        });

        const storage = {
          getAllKeys: () => Promise.resolve([]),
          multiget: () => Promise.resolve([])
        };

        const { middleware } = createStorageAdapter(storage, {
          namespace: "cake"
        });

        const dispatch = sinon.spy();

        return middleware({ dispatch })(() => null)({
          type: "cake/STORAGE_PREPARE"
        })
          .then(() => {
            expect(window.addEventListener.calledOnce).to.be.true;

            window.addEventListener.args[0][1]({
              key: "chocolate",
              oldValue: "yum",
              newValue: "yum yum",
              storageArea: {}
            });

            expect(dispatch.calledOnce).to.be.false;
          })
          .then(() => window.addEventListener.restore())
          .catch(error => {
            window.addEventListener.restore();
            throw error;
          });
      });
    });
  });

  describe("returns a reducer that", () => {
    const createStorageAdapter = require("./createStorageAdapter.js")();
    const { reducer } = createStorageAdapter(null, { namespace: "pudding" });

    it("returns null as initial state", () => {
      expect(reducer(undefined, {})).to.be.null;
    });

    it("returns the initialValues property of the STORAGE_PREPARE action", () => {
      const initialValues = {
        chocolate: "cinnamon",
        strawberry: "apricot",
        vanilla: "blueberry"
      };

      expect(
        reducer(null, { type: "pudding/STORAGE_PREPARE", initialValues })
      ).to.deep.equal(initialValues);
    });

    it("returns the state with the new property on STORAGE_SET_ITEM", () => {
      const state = {
        chocolate: "cinnamon",
        strawberry: "apricot",
        vanilla: "blueberry"
      };

      expect(
        reducer(state, {
          type: "pudding/STORAGE_SET_ITEM",
          key: "banana",
          value: "caramel"
        })
      ).to.deep.equal({
        chocolate: "cinnamon",
        strawberry: "apricot",
        vanilla: "blueberry",
        banana: "caramel"
      });
    });

    it("returns the state without the property of the key of STORAGE_REMOVE_ITEM action", () => {
      const state = {
        chocolate: "cinnamon",
        strawberry: "apricot",
        vanilla: "blueberry"
      };

      expect(
        reducer(state, {
          type: "pudding/STORAGE_REMOVE_ITEM",
          key: "strawberry"
        })
      ).to.deep.equal({
        chocolate: "cinnamon",
        vanilla: "blueberry"
      });
    });

    it("returns {} on STORAGE_CLEAR action", () => {
      const state = {
        chocolate: "cinnamon",
        strawberry: "apricot",
        vanilla: "blueberry"
      };

      expect(
        reducer(state, {
          type: "pudding/STORAGE_CLEAR"
        })
      ).to.deep.equal({});
    });
  });
});
