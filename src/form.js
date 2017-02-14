(() => {
  'use strict';

  // a form controller is a tree of inputs. the form itself is actually a top level input.
  // the isDirty prop means that the input was changed.
  // the isTouched prop means that the input was interacted with (like being changed on focused).
  // the entire form is validated when a value changes and on init, on blur and on submit.
  // init can be used to set non-model state on the input.
  // in case setValue is not provided, on change the value is set on the input

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let Mvc;
  let asyncUtils;

  if (isModule) {
    Mvc = require('crizmas-mvc');
    asyncUtils = require('crizmas-async-utils');
  } else {
    ({Mvc, asyncUtils} = window.crizmas);
  }

  const {awaitFor, awaitAll} = asyncUtils;

  const Input = Mvc.controller(function (config = {}) {
    const {name, validate, init, actions, parent, onFormChange,
      preventInputPendingBlocking, preventPendingBlocking} = config;
    let {getValue, setValue, children, initialValue, clearValue, root} = config;
    let childrenMap = new Map();
    let isSelfInputPending = false;

    const input = {
      name,
      getValue: Mvc.ignore(getValue),
      actions,
      isDirty: false,
      isTouched: false,
      isInputPending: false,
      isSubmitted: false,
      hasErrors: false,
      errors: null,
      parent,
      initialValue,
      onFormChange
    };

    input.root = root || input;

    Mvc.observe(actions);

    if (!input.getValue !== !setValue) {
      throw new Error('getValue and setValue must be either both provided or both absent.');
    }

    if (input.getValue) {
      if (config.hasOwnProperty('initialValue')) {
        throw new Error('Cannot provide an initial value if getValue was provided.');
      }

      input.initialValue = input.getValue();
    } else {
      // input.value must not be created if a getValue is passed
      input.value = input.initialValue;

      input.getValue = Mvc.ignore(() => input.value);
      // if getValue is absent then setValue is absent
      setValue = val => input.value = val;
    }

    input.children = children = children && children.map(child =>
      new Input(Object.assign({}, child, {root: input.root, parent: input})));

    if (children) {
      children.forEach(child => {
        if (child.name !== undefined && child.name !== null) {
          if (childrenMap.has(child.name)) {
            throw new Error(`Duplicate child name: ${child.name}`);
          }

          childrenMap.set(child.name, child);
        }
      });
    }

    input.get = Mvc.ignore(name => childrenMap.get(name));

    input.add = (childConfig) => {
      input.addChild(new Input(childConfig));
    };

    input.addChild = (childInput) => {
      if (childInput.parent) {
        throw new Error('The child input already has a parent.');
      }

      childInput.parent = input;
      childInput.setRoot(input.root);

      if (!children) {
        input.children = children = [];
      }

      children.push(childInput);

      if (childInput.name !== undefined && childInput.name !== null) {
        if (childrenMap.has(childInput.name)) {
          throw new Error(`Duplicate child name: ${childInput.name}`);
        }

        childrenMap.set(childInput.name, childInput);
      }

      Mvc.addObservedChild(input, childInput);

      input.markAsInputPending();
      input.root.markAsDirty();
      input.root.validate({event: 'add', target: input});
    };

    input.setRoot = (root) => {
      input.root = root;

      if (children) {
        children.forEach(child => child.setRoot(root));
      }
    };

    input.remove = () => {
      if (!input.parent) {
        throw new Error('The input doesn\'t have a parent.');
      }

      input.parent.removeChild(input);
    };

    input.removeChild = (child) => {
      const childIndex = children.indexOf(child);

      if (childIndex === -1) {
        throw new Error('Input doesn\'t have the child.');
      }

      children.splice(childIndex, 1);

      if (child.name !== undefined && child.name !== null) {
        childrenMap.delete(child.name);
      }

      Mvc.removeObservedChild(input, child);

      child.parent = null;

      child.setRoot(child);
      input.markAsInputPending();
      input.root.markAsDirty();
      input.root.validate({event: 'remove', target: input});
    };

    const markAsTouched = () => {
      let touchedInput = input;

      do {
        touchedInput.isTouched = true;
        touchedInput = touchedInput.parent;
      } while (touchedInput);
    };

    const callOnFormChange = () => {
      let changedInput = input;

      do {
        if (typeof changedInput.onFormChange === 'function') {
          changedInput.onFormChange({target: input, input: changedInput});
        }

        changedInput = changedInput.parent;
      } while (changedInput);
    };

    input.markAsInputPending = () => {
      input.isInputPending = isSelfInputPending
        || (!!children && children.some(child => child.isInputPending));

      if (input.parent) {
        input.parent.markAsInputPending();
      }
    };

    input.onChange = val => {
      isSelfInputPending = false;

      setValue.call(input, val);
      input.markAsInputPending();
      input.root.markAsDirty();
      markAsTouched();
      input.root.validate({event: 'change', target: input});
      callOnFormChange();
    };

    input.markAsDirty = () => {
      let hasDirtyChildren = false;

      if (children) {
        children.forEach(child => {
          child.markAsDirty();

          if (child.isDirty) {
            hasDirtyChildren = true;
          }
        });
      }

      input.isDirty = hasDirtyChildren || input.getValue() !== input.initialValue;
    };

    input.onBlur = () => {
      markAsTouched();
      input.root.validate({event: 'blur', target: input});
    };

    input.onStartPending = () => {
      let pendingInput = input;

      isSelfInputPending = true;

      do {
        pendingInput.isInputPending = true;
        pendingInput = pendingInput.parent;
      } while (pendingInput);
    };

    input.validate = ({event, target = input} = {}) => {
      const errors = [];

      input.errors = null;
      input.hasErrors = false;

      // no child should reject as, below, the validate on the current item
      // is caught and the error is set to the generic error
      return awaitAll(children && children.map(child => child.validate({event, target})), () => {
        if (children) {
          children.forEach(child => {
            if (child.hasErrors) {
              errors.push(...child.errors);
            }
          });
        }

        return awaitFor(validate && awaitFor(validate.call(input, {input, event, target}),
          (error) => {
            if (error) {
              if (Array.isArray(error)) {
                errors.push(...error);
              } else {
                errors.push(error);
              }
            }
          }, (error) => {
            errors.push(typeof Form.asyncValidationError === 'function'
              ? Form.asyncValidationError(error)
              : Form.asyncValidationError);
          }), () => {
            if (errors.length) {
              input.errors = errors;
              input.hasErrors = true;
            } else {
              input.errors = null;
              input.hasErrors = false;
            }
          });
      });
    };

    Reflect.defineProperty(input, 'isPendingBlocked', {
      get: () => (!preventPendingBlocking && input.isPending)
        || (!preventInputPendingBlocking && input.isInputPending)
    });

    Reflect.defineProperty(input, 'isBlocked', {
      get: () => input.hasErrors || input.isPendingBlocked
    });

    input.submit = (...args) => {
      if (input.isBlocked) {
        return;
      }

      input.isSubmitted = true;

      input.validate({event: 'submit', target: input});

      // after validation must recheck if is blocked
      if (input.actions && input.actions.submit && !input.isBlocked) {
        input.actions.submit.apply(input, args);
      }
    };

    const resetInternal = () => {
      setValue.call(input, input.initialValue);

      input.isSubmitted = false;
      input.isTouched = false;
    };

    input.reset = ({target = input} = {}) => {
      if (target === input && input.isPendingBlocked) {
        return;
      }

      if (children) {
        children.forEach(child => child.reset({target}));
      }

      resetInternal();

      if (target === input) {
        input.root.markAsDirty();
        input.root.validate({event: 'reset', target: input});

        // after validation must recheck if is blocked
        if (input.actions && input.actions.reset && !input.isPendingBlocked) {
          input.actions.reset.call(input);
        }
      }
    };

    input.clear = ({target = input} = {}) => {
      if (target === input && input.isPendingBlocked) {
        return;
      }

      if (children) {
        children.forEach(child => child.clear({target}));
      }

      if (config.hasOwnProperty('clearValue')) {
        input.initialValue = clearValue;
      } else if (input.initialValue) {
        input.initialValue = null;
      }

      resetInternal();

      if (target === input) {
        input.root.markAsDirty();
        input.root.validate({event: 'clear', target: input});

        // after validation must recheck if is blocked
        if (input.actions && input.actions.clear && !input.isPendingBlocked) {
          input.actions.clear.call(input);
        }
      }
    };

    input.getResult = Mvc.ignore(() => {
      if (children) {
        if (!childrenMap.size || childrenMap.size !== children.length) {
          return children.map(child => child.getResult());
        }

        const result = {};

        children.forEach(child => {
          result[child.name] = child.getResult();
        });

        return result;
      }

      return input.getValue();
    });

    if (init) {
      init.call(input, {input});
    }

    return input;
  });

  const Form = Mvc.controller(function (config) {
    const root = new Input(config);

    root.validate({event: 'init', target: root});

    return root;
  });

  Form.asyncValidationError = 'Validation failed';
  Form.Input = Input;

  const moduleExports = Form;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas.Form = moduleExports;
  }
})();
