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
    let {getValue, setValue, children, initialValue, clearValue, root = this} = config;
    let childrenMap = new Map();
    let isSelfInputPending = false;

    this.name = name;
    this.getValue = Mvc.ignore(getValue);
    this.actions = actions;
    this.isDirty = false;
    this.isTouched = false;
    this.isInputPending = false;
    this.isSubmitted = false;
    this.hasErrors = false;
    this.errors = null;
    this.root = root;
    this.parent = parent;
    this.initialValue = initialValue;
    this.onFormChange = onFormChange;

    Mvc.observe(actions);

    if (!this.getValue !== !setValue) {
      throw new Error('getValue and setValue must be either both provided or both absent.');
    }

    if (this.getValue) {
      if (config.hasOwnProperty('initialValue')) {
        throw new Error('Cannot provide an initial value if getValue was provided.');
      }

      this.initialValue = this.getValue();
    } else {
      // input.value must not be created if a getValue is passed
      this.value = this.initialValue;

      this.getValue = Mvc.ignore(() => this.value);
      // if getValue is absent then setValue is absent
      setValue = val => this.value = val;
    }

    this.children = children = children && children.map(child =>
      new Input(Object.assign({}, child, {root: this.root, parent: this})));

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

    this.get = Mvc.ignore(name => childrenMap.get(name));

    this.add = (childConfig) => {
      this.addChild(new Input(childConfig));
    };

    this.addChild = (childInput) => {
      if (childInput.parent) {
        throw new Error('The child input already has a parent.');
      }

      childInput.parent = this;
      childInput.setRoot(this.root);

      if (!children) {
        this.children = children = [];
      }

      children.push(childInput);

      if (childInput.name !== undefined && childInput.name !== null) {
        if (childrenMap.has(childInput.name)) {
          throw new Error(`Duplicate child name: ${childInput.name}`);
        }

        childrenMap.set(childInput.name, childInput);
      }

      Mvc.addObservedChild(this, childInput);

      this.markAsInputPending();
      this.root.markAsDirty();
      this.root.validate({event: 'add', target: this});
    };

    this.setRoot = (root_) => {
      this.root = root_;

      if (children) {
        children.forEach(child => child.setRoot(this.root));
      }
    };

    this.remove = () => {
      if (!this.parent) {
        throw new Error('The input doesn\'t have a parent.');
      }

      this.parent.removeChild(this);
    };

    this.removeChild = (child) => {
      const childIndex = children.indexOf(child);

      if (childIndex === -1) {
        throw new Error('Input doesn\'t have the child.');
      }

      children.splice(childIndex, 1);

      if (child.name !== undefined && child.name !== null) {
        childrenMap.delete(child.name);
      }

      Mvc.removeObservedChild(this, child);

      child.parent = null;

      child.setRoot(child);
      this.markAsInputPending();
      this.root.markAsDirty();
      this.root.validate({event: 'remove', target: this});
    };

    const markAsTouched = () => {
      let input = this;

      do {
        input.isTouched = true;
        input = input.parent;
      } while (input);
    };

    const callOnFormChange = () => {
      let input = this;

      do {
        if (typeof input.onFormChange === 'function') {
          input.onFormChange({target: this, input});
        }

        input = input.parent;
      } while (input);
    };

    this.markAsInputPending = () => {
      this.isInputPending = isSelfInputPending
        || (!!children && children.some(child => child.isInputPending));

      if (this.parent) {
        this.parent.markAsInputPending();
      }
    };

    this.onChange = val => {
      isSelfInputPending = false;

      setValue.call(this, val);
      this.markAsInputPending();
      this.root.markAsDirty();
      markAsTouched();
      this.root.validate({event: 'change', target: this});
      callOnFormChange();
    };

    this.markAsDirty = () => {
      let hasDirtyChildren = false;

      if (children) {
        children.forEach(child => {
          child.markAsDirty();

          if (child.isDirty) {
            hasDirtyChildren = true;
          }
        });
      }

      this.isDirty = hasDirtyChildren || this.getValue() !== this.initialValue;
    };

    this.onBlur = () => {
      markAsTouched();
      this.root.validate({event: 'blur', target: this});
    };

    this.onStartPending = () => {
      let input = this;

      isSelfInputPending = true;

      do {
        input.isInputPending = true;
        input = input.parent;
      } while (input);
    };

    this.validate = ({event, target = this} = {}) => {
      const errors = [];

      this.errors = null;
      this.hasErrors = false;

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

        return awaitFor(validate && awaitFor(validate.call(this, {input: this, event, target}),
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
              this.errors = errors;
              this.hasErrors = true;
            } else {
              this.errors = null;
              this.hasErrors = false;
            }
          });
      });
    };

    Reflect.defineProperty(this, 'isPendingBlocked', {
      get: () => (!preventPendingBlocking && this.isPending)
        || (!preventInputPendingBlocking && this.isInputPending)
    });

    Reflect.defineProperty(this, 'isBlocked', {
      get: () => this.hasErrors || this.isPendingBlocked
    });

    this.submit = (...args) => {
      if (this.isBlocked) {
        return;
      }

      this.isSubmitted = true;

      this.validate({event: 'submit', target: this});

      // after validation must recheck if is blocked
      if (this.actions && this.actions.submit && !this.isBlocked) {
        this.actions.submit.apply(this, args);
      }
    };

    const resetInternal = () => {
      setValue.call(this, this.initialValue);

      this.isSubmitted = false;
      this.isTouched = false;
    };

    this.reset = ({target = this} = {}) => {
      if (target === this && this.isPendingBlocked) {
        return;
      }

      if (children) {
        children.forEach(child => child.reset({target}));
      }

      resetInternal();

      if (target === this) {
        this.root.markAsDirty();
        this.root.validate({event: 'reset', target: this});

        // after validation must recheck if is blocked
        if (this.actions && this.actions.reset && !this.isPendingBlocked) {
          this.actions.reset.call(this);
        }
      }
    };

    this.clear = ({target = this} = {}) => {
      if (target === this && this.isPendingBlocked) {
        return;
      }

      if (children) {
        children.forEach(child => child.clear({target}));
      }

      if (config.hasOwnProperty('clearValue')) {
        this.initialValue = clearValue;
      } else if (this.initialValue) {
        this.initialValue = null;
      }

      resetInternal();

      if (target === this) {
        this.root.markAsDirty();
        this.root.validate({event: 'clear', target: this});

        // after validation must recheck if is blocked
        if (this.actions && this.actions.clear && !this.isPendingBlocked) {
          this.actions.clear.call(this);
        }
      }
    };

    this.getResult = Mvc.ignore(() => {
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

      return this.getValue();
    });

    if (init) {
      init.call(this, {input: this});
    }

    return this;
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
