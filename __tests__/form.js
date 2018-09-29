'use strict';

const Form = require('../src/form');
const validation = require('../src/validation');
const Mvc = require('crizmas-mvc');
const observe = require('crizmas-mvc/src/observe');

const {Input} = Form;

describe('form', () => {
  describe('Input', () => {
    test('the object argument is optional', () => {
      expect.assertions(20);

      const input = new Input();

      expect(input.name).toBe(undefined);
      expect(input.actions).toBe(undefined);
      expect(input.isDirty).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.isInputPending).toBe(false);
      expect(input.isSubmitted).toBe(false);
      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      expect(input.parent).toBe(undefined);
      expect(input.initialValue).toBe(undefined);
      expect(input.root).toBe(input);
      expect(input.value).toBe(undefined);
      expect(input.children).toBe(undefined);
      expect(input.isPendingBlocked).toBe(false);
      expect(typeof input.pending).toBe('object');
      expect(input.isPending).toBe(false);
      expect(input.isBlocked).toBe(false);
      expect(input.onFormChange).toBe(undefined);
      expect(Object.values(input).filter((value) => typeof value !== 'function').length).toBe(16);
      expect(Object.values(input).filter((value) => typeof value === 'function').length).toBe(17);
    });

    test('the object argument is used', () => {
      expect.assertions(21);

      const root = new Input();
      const config = {
        name: 'test',
        validate: () => 'error',
        init: () => {},
        actions: {},
        parent: root,
        root,
        onFormChange: () => {},
        preventInputPendingBlocking: true,
        preventPendingBlocking: true,
        getValue: () => 100,
        setValue: () => {},
        children: [{}],
        clearValue: 5
      };
      const input = new Input(config);

      expect(input.name).toBe('test');
      expect(input.actions).toBe(config.actions);
      expect(input.isDirty).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.isInputPending).toBe(false);
      expect(input.isSubmitted).toBe(false);
      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      expect(input.parent).toBe(root);
      expect(input.initialValue).toBe(100);
      expect(input.root).toBe(root);
      expect('value' in input).toBe(false);
      expect(input.children.length).toBe(1);
      expect(input.isPendingBlocked).toBe(false);
      expect(typeof input.pending).toBe('object');
      expect(input.isPending).toBe(false);
      expect(input.isBlocked).toBe(false);
      expect(typeof input.onFormChange).toBe('function');
      expect(input.validate === config.validate).toBe(false);
      expect(Object.values(input).filter((value) => typeof value !== 'function').length).toBe(14);
      expect(Object.values(input).filter((value) => typeof value === 'function').length).toBe(18);
    });

    test('getValue is ignored', () => {
      expect.assertions(3);

      const observation = jest.fn();

      expect(() => new Input({
        getValue: Mvc.observe(() => {}),
        setValue() {}
      })).toThrowError(Error);
      expect(() => new Input({
        getValue: Mvc.observe(() => {}),
        setValue() {}
      })).toThrowError('Observed non-promise object or function cannot be ignored.');

      const input = new Input({
        getValue: () => {},
        setValue() {}
      });

      observe.on(observation);
      observe.observe(input.getValue);
      input.getValue();
      expect(observation.mock.calls.length).toBe(0);
      observe.off(observation);
    });

    test('if setValue\'s presence is not the same as getValue\'s an error is thrown', () => {
      expect.assertions(4);
      expect(() => new Input({
        getValue: () => {}
      })).toThrowError(Error);
      expect(() => new Input({
        getValue: () => {}
      })).toThrowError('getValue and setValue must be either both provided or both absent.');
      expect(() => new Input({
        setValue() {}
      })).toThrowError(Error);
      expect(() => new Input({
        setValue() {}
      })).toThrowError('getValue and setValue must be either both provided or both absent.');
    });

    test('if getValue and an initialValue is passed an error is thrown', () => {
      expect.assertions(2);
      expect(() => {
        new Input({
          getValue() {},
          setValue() {},
          initialValue: undefined
        });
      }).toThrowError(Error);
      expect(() => {
        new Input({
          getValue() {},
          setValue() {},
          initialValue: undefined
        });
      }).toThrowError('Cannot provide an initial value if getValue was provided.');
    });

    test('if getValue is passed it\'s used to get the initial value', () => {
      expect.assertions(1);
      expect(new Input({
        getValue() { return 10; },
        setValue() {}
      }).initialValue).toBe(10);
    });

    test('if getValue is passed there\'s no value property', () => {
      expect.assertions(2);
      expect(new Input({
        getValue() { return 10; },
        setValue() {}
      }).hasOwnProperty('value')).toBe(false);
      expect(new Input().hasOwnProperty('value')).toBe(true);
    });

    test('if getValue is not passed the value is the same as the initial value', () => {
      expect.assertions(2);
      expect(new Input().value).toBe(undefined);
      expect(new Input({
        initialValue: 4
      }).value).toBe(4);
    });

    test('if getValue is not passed getValue is an ignored function that returns the value', () => {
      expect.assertions(3);

      const observation = jest.fn();
      const input = new Input();

      input.onChange(3);

      observe.on(observation);
      observe.observe(input.getValue);
      expect(input.getValue()).toBe(3);
      expect(input.getValue() === input.value).toBe(true);
      expect(observation.mock.calls.length).toBe(0);
      observe.off(observation);
    });

    test('the children config is turned into an array of children inputs', () => {
      expect.assertions(42);

      const childConfig = {
        name: 'test',
        validate: () => 'error',
        init: () => {},
        actions: {},
        parent: {},
        root: {},
        onFormChange: () => {},
        preventInputPendingBlocking: true,
        preventPendingBlocking: true,
        getValue: () => 100,
        setValue: () => {},
        children: [{}],
        clearValue: 5
      };
      const input = new Input({
        children: [
          {},
          childConfig
        ]
      });
      const [child1, child2] = input.children;

      expect(input.children.length).toBe(2);
      expect(child1.name).toBe(undefined);
      expect(child1.actions).toBe(undefined);
      expect(child1.isDirty).toBe(false);
      expect(child1.isTouched).toBe(false);
      expect(child1.isInputPending).toBe(false);
      expect(child1.isSubmitted).toBe(false);
      expect(child1.hasErrors).toBe(false);
      expect(child1.errors).toBe(null);
      expect(child1.parent).toBe(input);
      expect(child1.initialValue).toBe(undefined);
      expect(child1.root).toBe(input);
      expect(child1.value).toBe(undefined);
      expect(child1.children).toBe(undefined);
      expect(child1.isPendingBlocked).toBe(false);
      expect(typeof child1.pending).toBe('object');
      expect(child1.isPending).toBe(false);
      expect(child1.isBlocked).toBe(false);
      expect(child1.onFormChange).toBe(undefined);
      expect(Object.values(child1).filter((value) => typeof value !== 'function').length).toBe(16);
      expect(Object.values(child1).filter((value) => typeof value === 'function').length).toBe(17);
      expect(child2.name).toBe('test');
      expect(child2.actions).toBe(childConfig.actions);
      expect(child2.isDirty).toBe(false);
      expect(child2.isTouched).toBe(false);
      expect(child2.isInputPending).toBe(false);
      expect(child2.isSubmitted).toBe(false);
      expect(child2.hasErrors).toBe(false);
      expect(child2.errors).toBe(null);
      expect(child2.parent).toBe(input);
      expect(child2.initialValue).toBe(100);
      expect(child2.root).toBe(input);
      expect('value' in child2).toBe(false);
      expect(child2.children.length).toBe(1);
      expect(child2.isPendingBlocked).toBe(false);
      expect(typeof child2.pending).toBe('object');
      expect(child2.isPending).toBe(false);
      expect(child2.isBlocked).toBe(false);
      expect(typeof child2.onFormChange).toBe('function');
      expect(child2.validate === childConfig.validate).toBe(false);
      expect(Object.values(child2).filter((value) => typeof value !== 'function').length).toBe(14);
      expect(Object.values(child2).filter((value) => typeof value === 'function').length).toBe(18);
    });

    test('the children inputs are observed children objects', () => {
      expect.assertions(12);

      const input = observe.root(new Input({
        children: [{
          validate: () => Promise.resolve()
        }]
      }));

      expect(input.isPending).toBe(false);
      expect(input.pending.has('validate')).toBe(false);
      expect(input.children[0].isPending).toBe(false);
      expect(input.children[0].pending.has('validate')).toBe(false);

      const promise = input.children[0].validate().then(() => {
        expect(input.isPending).toBe(false);
        expect(input.pending.has('validate')).toBe(false);
        expect(input.children[0].isPending).toBe(false);
        expect(input.children[0].pending.has('validate')).toBe(false);
      });

      expect(input.isPending).toBe(true);
      expect(input.pending.has('validate')).toBe(false);
      expect(input.children[0].isPending).toBe(true);
      expect(input.children[0].pending.has('validate')).toBe(true);

      return promise;
    });

    test('the input becomes the parent input of its children', () => {
      expect.assertions(1);

      const input = new Input({
        children: [{}]
      });

      expect(input.children[0].parent).toBe(input);
    });

    test('the root becomes the root of the children', () => {
      expect.assertions(3);

      const root = new Input({
        children: [{
          children: [{}]
        }]
      });

      expect(root.root).toBe(root);
      expect(root.children[0].root).toBe(root);
      expect(root.children[0].children[0].root).toBe(root);
    });

    test('init is called', () => {
      expect.assertions(2);

      let inputArg;
      let thisArg;
      const input = new Input({
        init({input}) {
          inputArg = input;
          thisArg = this;
        }
      });

      expect(inputArg).toBe(input);
      expect(thisArg).toBe(input);
    });

    test('doesn\'t do init validation', () => {
      expect.assertions(1);

      const observation = jest.fn();

      new Input({
        validate: observation
      });

      expect(observation.mock.calls.length).toBe(0);
    });

    test('Input is observed', () => {
      expect.assertions(29);

      const observation = jest.fn();

      observe.on(observation);

      const input = observe.root(new Input({
        onFormChange: () => {},
        validate: ({event}) => event === 'async' && Promise.resolve()
      }));

      // 1 observed construction
      expect(observation.mock.calls.length).toBe(1);
      input.onStartPending();
      // 1 observed construction and 1observed function call
      expect(observation.mock.calls.length).toBe(2);
      input.onChange(40);
      // 1 observed construction and 2 observed function call
      expect(observation.mock.calls.length).toBe(3);
      expect(input.getValue()).toBe(40);
      // 1 observed construction and 2 observed function call
      expect(observation.mock.calls.length).toBe(3);
      expect(input.getResult()).toBe(40);
      // 1 observed construction and 2 observed function call
      expect(observation.mock.calls.length).toBe(3);
      input.onFormChange();
      // 1 observed construction and 3 observed function calls
      expect(observation.mock.calls.length).toBe(4);
      input.markAsInputPending();
      // 1 observed construction and 4 observed function calls
      expect(observation.mock.calls.length).toBe(5);
      input.markAsDirty();
      // 1 observed construction and 5 observed function calls
      expect(observation.mock.calls.length).toBe(6);
      input.onBlur();
      // 1 observed construction and 6 observed function calls
      expect(observation.mock.calls.length).toBe(7);
      input.submit();
      // 1 observed construction and 7 observed function calls
      expect(observation.mock.calls.length).toBe(8);
      input.reset();
      // 1 observed construction and 8 observed function calls
      expect(observation.mock.calls.length).toBe(9);
      input.clear();
      // 1 observed construction and 9 observed function calls
      expect(observation.mock.calls.length).toBe(10);
      input.add({name: 'child'});
      // 1 observed constructions and 10 observed function calls
      expect(observation.mock.calls.length).toBe(11);
      observe.off(observation);

      const child2 = new Input({name: 'child2'});

      observe.on(observation);
      input.addChild(child2);
      // 1 observed constructions and 11 observed function calls
      expect(observation.mock.calls.length).toBe(12);
      expect(input.get('child2')).toBe(child2);
      // 1 observed constructions and 11 observed function calls
      expect(observation.mock.calls.length).toBe(12);
      child2.remove();
      // 1 observed constructions and 12 observed function calls
      expect(observation.mock.calls.length).toBe(13);
      input.removeChild(input.get('child'));
      // 1 observed constructions and 13 observed function calls
      expect(observation.mock.calls.length).toBe(14);
      input.setRoot(input);
      // 1 observed constructions and 14 observed function calls
      expect(observation.mock.calls.length).toBe(15);

      expect(input.isPending).toBe(false);
      expect(input.pending.has('validate')).toBe(false);

      const promise = input.validate({event: 'async'}).then(() => {
        // 1 observed constructions, 15 observed function calls and 1 settled observed promise
        expect(observation.mock.calls.length).toBe(17);
        expect(input.isPending).toBe(false);
        expect(input.pending.has('validate')).toBe(false);
        observe.off(observation);
      });

      // 1 observed constructions and 15 observed function calls
      expect(observation.mock.calls.length).toBe(16);
      expect(input.isPending).toBe(true);
      expect(input.pending.has('validate')).toBe(true);

      return promise;
    });

    test('the actions object is observed', () => {
      expect.assertions(4);

      const observation = jest.fn();
      const input = new Input({
        actions: {
          submit: () => {},
          reset: () => {},
          clear: () => {},
          randomMethod: () => {}
        }
      });

      observe.on(observation);
      input.actions.submit();
      expect(observation.mock.calls.length).toBe(1);
      input.actions.reset();
      expect(observation.mock.calls.length).toBe(2);
      input.actions.clear();
      expect(observation.mock.calls.length).toBe(3);
      input.actions.randomMethod();
      expect(observation.mock.calls.length).toBe(4);
      observe.off(observation);
    });

    test('throws if there are children with duplicate names', () => {
      expect.assertions(2);
      expect(() => {
        new Input({
          children: [{name: 'test'}, {name: 'test'}]
        });
      }).toThrowError(Error);
      expect(() => {
        new Input({
          children: [{name: 'test'}, {name: 'test'}]
        });
      }).toThrowError('Duplicate child name: test');
    });

    test('Input can not be applied', () => {
      expect.assertions(2);
      expect(Input).toThrowError(Error);
      expect(Input).toThrowError('The observed constructor must be invoked with \'new\'.');
    });
  });

  describe('onChange', () => {
    test('calls setValue', () => {
      expect.assertions(2);

      const input = new Input({
        getValue() {},
        setValue(value) {
          expect(value).toBe(14);
          expect(this).toBe(input);
        }
      });

      input.onChange(14);
    });

    test('if there was no setValue passed, sets the value on the input', () => {
      expect.assertions(1);

      const input = new Input();

      input.onChange(342);

      expect(input.value).toBe(342);
    });

    test('if input was isInputPending, itself and the acendants chain stop being isInputPending'
      + ' if it doesn\'t have isInputPending children', () => {
      expect.assertions(4);

      const input = new Input({
        children: [{
          children: [{}]
        }]
      });

      input.children[0].onStartPending();
      expect(input.children[0].isInputPending).toBe(true);
      expect(input.isInputPending).toBe(true);
      input.children[0].onChange();
      expect(input.children[0].isInputPending).toBe(false);
      expect(input.isInputPending).toBe(false);
    });

    test('if input itself is not input pending but has input pending children,'
      + ' itself and the ascendants chain continue to be isInputPending', () => {
      expect.assertions(6);

      const input = new Input({
        children: [{
          children: [{}]
        }]
      });

      input.children[0].children[0].onStartPending();
      expect(input.children[0].children[0].isInputPending).toBe(true);
      expect(input.children[0].isInputPending).toBe(true);
      expect(input.isInputPending).toBe(true);
      input.children[0].onChange();
      expect(input.children[0].children[0].isInputPending).toBe(true);
      expect(input.children[0].isInputPending).toBe(true);
      expect(input.isInputPending).toBe(true);
    });

    test('if the parent has other is pending children it continues to be input pending', () => {
      expect.assertions(6);

      const input = new Input({
        children: [{}, {}]
      });

      input.children[0].onStartPending();
      input.children[1].onStartPending();
      expect(input.children[0].isInputPending).toBe(true);
      expect(input.children[1].isInputPending).toBe(true);
      expect(input.isInputPending).toBe(true);
      input.children[0].onChange();
      expect(input.children[0].isInputPending).toBe(false);
      expect(input.children[1].isInputPending).toBe(true);
      expect(input.isInputPending).toBe(true);
    });

    test('marks the root as dirty', () => {
      expect.assertions(8);

      let lastChildValue = 50;
      const root = new Input({
        initialValue: 20,
        children: [
          {initialValue: 30},
          {initialValue: 40},
          {
            getValue: () => lastChildValue,
            setValue() {}
          }
        ]
      });

      lastChildValue = 200;

      root.children[0].onChange(100);

      expect(root.getValue()).toBe(20);
      expect(root.children[0].getValue()).toBe(100);
      expect(root.children[1].getValue()).toBe(40);
      expect(root.children[2].getValue()).toBe(200);
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(true);
      expect(root.children[1].isDirty).toBe(false);
      expect(root.children[2].isDirty).toBe(true);
    });

    test('marks the input and the ascendants chain as touched', () => {
      expect.assertions(8);

      const root = new Input({
        children: [
          {
            children: [{}]
          },
          {}
        ]
      });

      expect(root.isTouched).toBe(false);
      expect(root.children[0].isTouched).toBe(false);
      expect(root.children[0].children[0].isTouched).toBe(false);
      expect(root.children[1].isTouched).toBe(false);
      root.children[0].children[0].onChange();
      expect(root.isTouched).toBe(true);
      expect(root.children[0].isTouched).toBe(true);
      expect(root.children[0].children[0].isTouched).toBe(true);
      expect(root.children[1].isTouched).toBe(false);
    });

    test('triggers the change validation on the root with the input as target', () => {
      expect.assertions(16);

      const root = new Input({
        validate({input, target, event}) {
          expect(this).toBe(root);
          expect(input).toBe(root);
          expect(target).toBe(root.children[0]);
          expect(event).toBe('change');
        },
        children: [
          {
            validate({input, target, event}) {
              expect(this).toBe(root.children[0]);
              expect(input).toBe(root.children[0]);
              expect(target).toBe(root.children[0]);
              expect(event).toBe('change');
            },
            children: [{
              validate({input, target, event}) {
                expect(this).toBe(root.children[0].children[0]);
                expect(input).toBe(root.children[0].children[0]);
                expect(target).toBe(root.children[0]);
                expect(event).toBe('change');
              }
            }]
          },
          {
            validate({input, target, event}) {
              expect(this).toBe(root.children[1]);
              expect(input).toBe(root.children[1]);
              expect(target).toBe(root.children[0]);
              expect(event).toBe('change');
            },
          }
        ]
      });

      root.children[0].onChange();
    });

    test('calls onFormChange on the input and the ascendants chain with the event input as target'
      + ' and for each input\'s onFormChange call, the input as the input argument' , () => {
      expect.assertions(7);

      const observation = jest.fn();
      const root = new Input({
        onFormChange({target, input}) {
          expect(this).toBe(root);
          expect(input).toBe(root);
          expect(target).toBe(root.children[0]);
        },
        children: [
          {
            onFormChange({target, input}) {
              expect(this).toBe(root.children[0]);
              expect(input).toBe(root.children[0]);
              expect(target).toBe(root.children[0]);
            },
            children: [{
              onFormChange: observation
            }]
          },
          {
            onFormChange: observation
          }
        ]
      });

      root.children[0].onChange();
      expect(observation.mock.calls.length).toBe(0);
    });

    test('first calls setValue, marks as input pending, as dirty and as touched, then'
      + ' validates, then calls onFormChange', () => {
      expect.assertions(13);

      let x = 0;
      let value = 3;
      const input = new Input({
        getValue: () => value,
        setValue(v) {
          value = v;

          expect(++x).toBe(1);
        },
        validate() {
          expect(input.isInputPending).toBe(false);
          expect(input.isDirty).toBe(true);
          expect(input.isTouched).toBe(true);
          expect(++x).toBe(2);
        },
        onFormChange() {
          expect(++x).toBe(3);
        }
      });

      input.onStartPending();

      expect(x).toBe(0);
      expect(input.isInputPending).toBe(true);
      expect(input.isDirty).toBe(false);
      expect(input.isTouched).toBe(false);
      input.onChange(100);
      expect(input.isInputPending).toBe(false);
      expect(input.isDirty).toBe(true);
      expect(input.isTouched).toBe(true);
    });
  });

  describe('markAsInputPending', () => {
    test('if the input itself is input pending and has no input pending children,'
      + ' itself and the ascendants chain remain input pending', () => {
      expect.assertions(9);

      const root = new Input({
        children: [{
          children: [{}]
        }]
      });

      expect(root.children[0].children[0].isInputPending).toBe(false);
      expect(root.children[0].isInputPending).toBe(false);
      expect(root.isInputPending).toBe(false);
      root.children[0].onStartPending();
      expect(root.children[0].children[0].isInputPending).toBe(false);
      expect(root.children[0].isInputPending).toBe(true);
      expect(root.isInputPending).toBe(true);
      root.children[0].markAsInputPending();
      expect(root.children[0].children[0].isInputPending).toBe(false);
      expect(root.children[0].isInputPending).toBe(true);
      expect(root.isInputPending).toBe(true);
    });

    test('if the input itself is not input pending but has input pending children,'
      + ' itself and the ascendants chain remain input pending', () => {
      expect.assertions(9);

      const input = new Input({
        children: [{
          children: [{}]
        }]
      });

      expect(input.children[0].children[0].isInputPending).toBe(false);
      expect(input.children[0].isInputPending).toBe(false);
      expect(input.isInputPending).toBe(false);
      input.children[0].children[0].onStartPending();
      expect(input.children[0].children[0].isInputPending).toBe(true);
      expect(input.children[0].isInputPending).toBe(true);
      expect(input.isInputPending).toBe(true);
      input.children[0].markAsInputPending();
      expect(input.children[0].children[0].isInputPending).toBe(true);
      expect(input.children[0].isInputPending).toBe(true);
      expect(input.isInputPending).toBe(true);

    });

    test('updates the isInputPending state accordingly on all ascendants chain', () => {
      expect.assertions(9);
      // start by setting isInputPending incorrectly as true and test that it is corrected

      const root1 = new Input({
        children: [{
          children: [{}]
        }]
      });

      root1.isInputPending = true;
      root1.children[0].isInputPending = true;
      root1.children[0].children[0].isInputPending = true;

      root1.children[0].markAsInputPending();
      expect(root1.isInputPending).toBe(true);
      expect(root1.children[0].isInputPending).toBe(true);
      expect(root1.children[0].children[0].isInputPending).toBe(true);

      const root2 = new Input({
        children: [{
          children: [{}]
        }]
      });

      root2.isInputPending = true;
      root2.children[0].isInputPending = true;

      root2.children[0].markAsInputPending();
      expect(root2.isInputPending).toBe(false);
      expect(root2.children[0].isInputPending).toBe(false);
      expect(root2.children[0].children[0].isInputPending).toBe(false);

      const root3 = new Input({
        children: [{
          children: [{}]
        }]
      });

      root3.isInputPending = true;

      root3.children[0].markAsInputPending();
      expect(root3.isInputPending).toBe(false);
      expect(root3.children[0].isInputPending).toBe(false);
      expect(root3.children[0].children[0].isInputPending).toBe(false);
    });

    test('if the parent has other input pending children, the ascendants chain continues'
      + ' to be input pending', () => {
      expect.assertions(8);

      const root = new Input({
        children: [{
          children: [{}, {}]
        }]
      });

      root.children[0].children[0].isInputPending = true;
      root.children[0].children[1].isInputPending = true;

      root.children[0].markAsInputPending();
      expect(root.isInputPending).toBe(true);
      expect(root.children[0].isInputPending).toBe(true);
      expect(root.children[0].children[0].isInputPending).toBe(true);
      expect(root.children[0].children[1].isInputPending).toBe(true);
      root.children[0].children[0].markAsInputPending();
      expect(root.isInputPending).toBe(true);
      expect(root.children[0].isInputPending).toBe(true);
      expect(root.children[0].children[0].isInputPending).toBe(false);
      expect(root.children[0].children[1].isInputPending).toBe(true);
    });
  });

  describe('markAsDirty', () => {
    test('if the input has the same value as the initial value and it doesn\'t have dirty'
      + ' children, it\'s not dirty', () => {
      expect.assertions(3);

      const root = new Input({
        initialValue: 20,
        children: [
          {initialValue: 30}
        ]
      });

      root.isDirty = true;

      expect(root.isDirty).toBe(true);
      root.markAsDirty();
      expect(root.isDirty).toBe(false);
      expect(root.children[0].isDirty).toBe(false);
    });

    test('updates the isDirty state accordingly on subtree', () => {
      expect.assertions(6);

      const root = new Input({
        initialValue: 20,
        children: [
          {initialValue: 30},
          {initialValue: 40}
        ]
      });

      root.children[0].value = 100;
      root.children[1].isDirty = true;

      expect(root.isDirty).toBe(false);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[1].isDirty).toBe(true);
      root.markAsDirty();
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(true);
      expect(root.children[1].isDirty).toBe(false);
    });

    test('if the input has a different value than the initial value, it\'s dirty', () => {
      expect.assertions(6);

      const root = new Input({
        initialValue: 20,
        children: [
          {initialValue: 30},
          {initialValue: 40}
        ]
      });

      root.children[1].value = 100;

      expect(root.isDirty).toBe(false);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[1].isDirty).toBe(false);
      root.markAsDirty();
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[1].isDirty).toBe(true);
    });

    test('if the input has isDirty children, itself continues to be isDirty even if it has the'
      + ' same initial value', () => {
      expect.assertions(6);

      const root = new Input({
        initialValue: 20,
        children: [
          {initialValue: 30},
          {initialValue: 40}
        ]
      });

      root.children[1].value = 100;

      expect(root.isDirty).toBe(false);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[1].isDirty).toBe(false);
      root.markAsDirty();
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[1].isDirty).toBe(true);
    });

    test('the input is dirty if its value is different that its initial value'
      + ' even if none of its children is dirty', () => {
      expect.assertions(6);

      const root = new Input({
        initialValue: 20,
        children: [
          {initialValue: 30},
          {initialValue: 40}
        ]
      });

      root.value = 100;

      expect(root.isDirty).toBe(false);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[1].isDirty).toBe(false);
      root.markAsDirty();
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[1].isDirty).toBe(false);
    });
  });

  describe('validate', () => {
    test('no options', () => {
      expect.assertions(4);

      const input = new Input({
        validate({input: input_, target, event}) {
          expect(this).toBe(input);
          expect(input_).toBe(input);
          expect(target).toBe(input);
          expect(event).toBe(undefined);
        }
      });

      input.validate();
    });

    test('initially resets the errors to null', () => {
      expect.assertions(18);

      let error = 'Error';
      const input = new Input({
        validate({input: input_, target, event}) {
          expect(input.hasErrors).toBe(false);
          expect(input.errors).toBe(null);
          expect(this).toBe(input);
          expect(input_).toBe(input);
          expect(target).toBe(input);
          expect(event).toBe('test');

          return error;
        }
      });

      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      input.validate({event: 'test'});
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['Error']);

      error = 'new error';

      input.validate({event: 'test'});
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['new error']);
    });

    test('old error is replaced by new validation', () => {
      expect.assertions(6);

      let error = 'Error';
      const input = new Input({
        validate: () => error
      });

      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      input.validate({event: 'test'});
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['Error']);

      error = null;

      input.validate({event: 'test'});
      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
    });

    test('can pass custom target', () => {
      expect.assertions(4);

      const input = new Input({
        validate({input: input_, target: target_, event}) {
          expect(this).toBe(input);
          expect(input_).toBe(input);
          expect(target_).toBe(target);
          expect(event).toBe(undefined);
        }
      });
      const target = {};

      input.validate({target});
    });

    test('validates the children first with the same target and event', () => {
      expect.assertions(10);

      let x = 0;
      const target_ = {};
      const root = new Input({
        validate({input, target, event}) {
          expect(this).toBe(root);
          expect(input).toBe(root);
          expect(target).toBe(target_);
          expect(event).toBe('test');
          expect(++x).toBe(2);
        },
        children: [{
          validate({input, target, event}) {
            expect(this).toBe(root.children[0]);
            expect(input).toBe(root.children[0]);
            expect(target).toBe(target_);
            expect(event).toBe('test');
            expect(++x).toBe(1);
          }
        }]
      });

      root.validate({target: target_, event: 'test'});
    });

    test('if no target is passed, the children will receive the same target', () => {
      expect.assertions(8);

      const root = new Input({
        validate({input, target, event}) {
          expect(this).toBe(root);
          expect(input).toBe(root);
          expect(target).toBe(root);
          expect(event).toBe(undefined);
        },
        children: [{
          validate({input, target, event}) {
            expect(this).toBe(root.children[0]);
            expect(input).toBe(root.children[0]);
            expect(target).toBe(root);
            expect(event).toBe(undefined);
          }
        }]
      });

      root.validate();
    });

    test('the error can be any truthy value', () => {
      expect.assertions(6);

      const errObj = {};
      const input = new Input({
        validate: () => errObj,
        children: [{
          validate: () => 1
        }]
      });

      input.validate();
      expect(input.hasErrors).toBe(true);
      expect(input.errors.length).toBe(2);
      expect(input.errors[0]).toBe(1);
      expect(input.errors[1]).toBe(errObj);
      expect(input.children[0].hasErrors).toBe(true);
      expect(input.children[0].errors).toEqual([1]);
    });

    test('gathers errors from the children', () => {
      expect.assertions(13);

      let x = 0;
      const input = new Input({
        validate: () => {
          expect(++x).toBe(4);

          return null;
        },
        children: [
          {
            validate: () => {
              expect(++x).toBe(1);

              return null;
            }
          },
          {
            validate: () => {
              expect(++x).toBe(3);

              return null;
            },
            children: [{
              validate: () => {
                expect(++x).toBe(2);

                return 'err';
              }
            }]
          }
        ]
      });

      input.validate();
      expect(input.hasErrors).toBe(true);
      expect(input.errors.length).toBe(1);
      expect(input.errors[0]).toBe('err');
      expect(input.children[0].hasErrors).toBe(false);
      expect(input.children[0].errors).toBe(null);
      expect(input.children[1].hasErrors).toBe(true);
      expect(input.children[1].errors).toEqual(['err']);
      expect(input.children[1].children[0].hasErrors).toBe(true);
      expect(input.children[1].children[0].errors).toEqual(['err']);
    });

    test('the result can be an array of errors', () => {
      expect.assertions(8);

      const input = new Input({
        validate: () => ['err1', 'err2'],
        children: [
          {
            validate: () => ['child err1', 'child err2']
          }
        ]
      });

      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      expect(input.children[0].hasErrors).toBe(false);
      expect(input.children[0].errors).toBe(null);

      input.validate();

      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['child err1', 'child err2', 'err1', 'err2']);
      expect(input.children[0].hasErrors).toBe(true);
      expect(input.children[0].errors).toEqual(['child err1', 'child err2']);
    });

    test('calling validate on the child doesn\'t update the parent', () => {
      expect.assertions(8);

      const input = new Input({
        validate: () => 'err',
        children: [
          {
            validate: () => 'child err'
          }
        ]
      });

      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      expect(input.children[0].hasErrors).toBe(false);
      expect(input.children[0].errors).toBe(null);

      input.children[0].validate();

      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      expect(input.children[0].hasErrors).toBe(true);
      expect(input.children[0].errors).toEqual(['child err']);
    });

    test('async validation returns a promise and after it\'s settled the errors are set', () => {
      expect.assertions(4);

      const input = new Input({
        validate: () => Promise.resolve('err')
      });
      const promise = input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['err']);
      });

      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);

      return promise;
    });

    test('the result of the async validation can be an array of errors', () => {
      expect.assertions(8);

      const input = new Input({
        validate: () => Promise.resolve(['err1', 'err2']),
        children: [
          {
            validate: () => Promise.resolve(['child err1', 'child err2'])
          }
        ]
      });

      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      expect(input.children[0].hasErrors).toBe(false);
      expect(input.children[0].errors).toBe(null);

      return input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['child err1', 'child err2', 'err1', 'err2']);
        expect(input.children[0].hasErrors).toBe(true);
        expect(input.children[0].errors).toEqual(['child err1', 'child err2']);
      });
    });

    test('the input reports pending operations while async validation is in progress', () => {
      expect.assertions(6);

      const input = new Input({
        validate: () => Promise.resolve('err')
      });

      expect(input.isPending).toBe(false);
      expect(input.pending.has('validate')).toBe(false);

      const promise = input.validate().then(() => {
        expect(input.isPending).toBe(false);
        expect(input.pending.has('validate')).toBe(false);
      });

      expect(input.isPending).toBe(false);
      expect(input.pending.has('validate')).toBe(true);

      return promise;
    });

    test('rooted input is pending while async validation is in progress', () => {
      expect.assertions(6);

      const input = observe.root(new Input({
        validate: () => Promise.resolve('err')
      }));

      expect(input.isPending).toBe(false);
      expect(input.pending.has('validate')).toBe(false);

      const promise = input.validate().then(() => {
        expect(input.isPending).toBe(false);
        expect(input.pending.has('validate')).toBe(false);
      });

      expect(input.isPending).toBe(true);
      expect(input.pending.has('validate')).toBe(true);

      return promise;
    });

    test('awaits children validations', () => {
      expect.assertions(23);

      const input = observe.root(new Input({
        validate: () => {
          expect(input.isPending).toBe(true);
          expect(input.children[0].isPending).toBe(false);
          expect(input.hasErrors).toBe(false);
          expect(input.children[0].hasErrors).toBe(true);
          expect(input.children[0].errors).toEqual(['child err']);

          return 'err';
        },
        children: [{
          validate: () => {
            expect(input.isPending).toBe(false);
            expect(input.children[0].isPending).toBe(false);
            expect(input.hasErrors).toBe(false);
            expect(input.children[0].hasErrors).toBe(false);

            return Promise.resolve('child err');
          }
        }]
      }));

      expect(input.isPending).toBe(false);
      expect(input.children[0].isPending).toBe(false);
      expect(input.hasErrors).toBe(false);
      expect(input.children[0].hasErrors).toBe(false);

      const promise = input.validate().then(() => {
        expect(input.isPending).toBe(false);
        expect(input.children[0].isPending).toBe(false);
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['child err', 'err']);
        expect(input.children[0].hasErrors).toBe(true);
        expect(input.children[0].errors).toEqual(['child err']);
      });

      expect(input.isPending).toBe(true);
      expect(input.children[0].isPending).toBe(true);
      expect(input.hasErrors).toBe(false);
      expect(input.children[0].hasErrors).toBe(false);

      return promise;
    });

    test('last level children with sync validation are marked with errors synchronously', () => {
      expect.assertions(10);

      const input = new Input({
        validate: () => 'err',
        children: [{
          validate: () => Promise.resolve('child err'),
          children: [{
            validate: () => 'grand child err'
          }]
        }]
      });

      const promise = input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['grand child err', 'child err', 'err']);
        expect(input.children[0].hasErrors).toBe(true);
        expect(input.children[0].errors).toEqual(['grand child err', 'child err']);
        expect(input.children[0].children[0].hasErrors).toBe(true);
        expect(input.children[0].children[0].errors).toEqual(['grand child err']);
      });

      expect(input.hasErrors).toBe(false);
      expect(input.children[0].hasErrors).toBe(false);
      expect(input.children[0].children[0].hasErrors).toBe(true);
      expect(input.children[0].children[0].errors).toEqual(['grand child err']);

      return promise;
    });

    test('if async validation rejects asyncValidationError is used as the result', () => {
      expect.assertions(10);

      const input = new Input({
        validate: () => 'err',
        children: [{
          validate: () => Promise.reject('child err'),
          children: [{
            validate: () => 'grand child err'
          }]
        }]
      });

      const promise = input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['grand child err', 'Validation failed', 'err']);
        expect(input.children[0].hasErrors).toBe(true);
        expect(input.children[0].errors).toEqual(['grand child err', 'Validation failed']);
        expect(input.children[0].children[0].hasErrors).toBe(true);
        expect(input.children[0].children[0].errors).toEqual(['grand child err']);
      });

      expect(input.hasErrors).toBe(false);
      expect(input.children[0].hasErrors).toBe(false);
      expect(input.children[0].children[0].hasErrors).toBe(true);
      expect(input.children[0].children[0].errors).toEqual(['grand child err']);

      return promise;
    });

    test('custom async validation error message', () => {
      expect.assertions(2);

      const input = new Input({
        validate: () => Promise.reject('err')
      });

      const promise = input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['test']);

        Form.asyncValidationError = oldMessage;
      });

      const oldMessage = Form.asyncValidationError;

      Form.asyncValidationError = 'test';

      return promise;
    });

    test('if asyncValidationError is a function it\'s called', () => {
      expect.assertions(3);

      const input = new Input({
        validate: () => Promise.reject('err')
      });

      const promise = input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['custom message']);

        Form.asyncValidationError = oldMessage;
      });

      const oldMessage = Form.asyncValidationError;

      Form.asyncValidationError = (error) => {
        expect(error).toBe('err');

        return 'custom message';
      };

      return promise;
    });

    test('if async validation is initiated and then a sync validation with errors is done'
      + ' the async result overwrites the sync one when it\'s completed', () => {
      expect.assertions(5);

      const input = new Input({
        validate: ({event}) => {
          if (event === 'async') {
            return Promise.resolve('async error');
          }

          return 'err';
        }
      });

      const promise = input.validate({event: 'async'}).then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['async error']);
      });

      expect(input.hasErrors).toBe(false);
      input.validate();
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['err']);

      return promise;
    });

    test('if async validation with no errors is initiated and then a sync validation with errors'
      + ' is done the async result overwrites the sync one when it\'s completed', () => {
      expect.assertions(5);

      const input = new Input({
        validate: ({event}) => {
          if (event === 'async') {
            return Promise.resolve();
          }

          return 'err';
        }
      });

      const promise = input.validate({event: 'async'}).then(() => {
        expect(input.hasErrors).toBe(false);
        expect(input.errors).toBe(null);
      });

      expect(input.hasErrors).toBe(false);
      input.validate();
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['err']);

      return promise;
    });

    test('if during the async validation, a child is revalidated and its error'
      + ' is changed, and there are no async children validations,'
      + ' the parent will get the old error', () => {
      expect.assertions(10);

      let childError = 'first err';
      const input = new Input({
        validate: () => {
          expect(input.children[0].hasErrors).toBe(true);
          expect(input.children[0].errors).toEqual(['first err']);

          return Promise.resolve('async error');
        },
        children: [{
          validate: () => childError
        }]
      });

      const promise = input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['first err', 'async error']);
        expect(input.children[0].hasErrors).toBe(true);
        expect(input.children[0].errors).toEqual(['second err']);
      });

      childError = 'second err';

      expect(input.hasErrors).toBe(false);
      input.children[0].validate();
      expect(input.hasErrors).toBe(false);
      expect(input.children[0].hasErrors).toBe(true);
      expect(input.children[0].errors).toEqual(['second err']);

      return promise;
    });

    test('if during the async validation, a child is revalidated and its error'
      + ' is changed, and there are async children validations,'
      + ' the parent will get the new error', () => {
      expect.assertions(10);

      let childError = 'first err';
      const input = new Input({
        validate: () => {
          expect(input.children[0].hasErrors).toBe(true);
          expect(input.children[0].errors).toEqual(['second err']);

          return Promise.resolve('async error');
        },
        children: [
          {
            validate: () => childError
          },
          {
            validate: () => Promise.resolve()
          }
        ]
      });

      const promise = input.validate().then(() => {
        expect(input.hasErrors).toBe(true);
        expect(input.errors).toEqual(['second err', 'async error']);
        expect(input.children[0].hasErrors).toBe(true);
        expect(input.children[0].errors).toEqual(['second err']);
      });

      childError = 'second err';

      expect(input.hasErrors).toBe(false);
      input.children[0].validate();
      expect(input.hasErrors).toBe(false);
      expect(input.children[0].hasErrors).toBe(true);
      expect(input.children[0].errors).toEqual(['second err']);

      return promise;
    });

    test('async invalid field is cleared', () => {
      expect.assertions(15);

      let username;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation.async((value) =>
              Promise.resolve(value === 'john' ? 'username is taken' : null))
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'john';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(false);
        expect(form.get('username').errors).toBe(null);
        expect(form.get('username').isPending).toBe(false);
        expect(form.hasErrors).toBe(false);
        expect(form.errors).toBe(null);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      username = '';

      return promise;
    });

    test('async valid field is cleared, then sync field is invalid', () => {
      expect.assertions(39);

      let username;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'test';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['Required']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      username = '';

      form.validate({
        target: form.get('username'),
        event: 'change'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(true);

      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required', 'invalid password']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async valid field has new value, then sync field is invalid', () => {
      expect.assertions(30);

      let username;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation.async((value) =>
              Promise.resolve(value === 'john' ? 'username is taken' : null))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'test';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(false);
        expect(form.get('username').errors).toBe(null);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      username = '';
      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['invalid password']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('required async valid field has new value, then sync field is invalid', () => {
      expect.assertions(30);

      let username;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'test';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(false);
        expect(form.get('username').errors).toBe(null);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      username = '';
      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['invalid password']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('required async valid field is cleared, then sync field is invalid', () => {
      expect.assertions(39);

      let username;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'test';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['Required']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      username = '';

      form.validate({
        target: form.get('username'),
        event: 'change'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(true);

      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required', 'invalid password']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async invalid field is cleared, then sync field is invalid', () => {
      expect.assertions(39);

      let username;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'john';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['Required']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      username = '';

      form.validate({
        target: form.get('username'),
        event: 'change'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(true);

      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required', 'invalid password']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async invalid field, then sync invalid field', () => {
      expect.assertions(30);

      let username;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'john';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['username is taken']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['username is taken', 'invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['invalid password']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async valid field, then sync valid field', () => {
      expect.assertions(30);

      let username;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'marry';

      const promise = form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(false);
        expect(form.get('username').errors).toBe(null);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(false);
        expect(form.get('password').errors).toBe(null);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(false);
        expect(form.errors).toBe(null);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      password = '1aA!aa';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async valid field, then sync invalid field, then the async'
      + ' field is cleared, then another async valid field', () => {
      expect.assertions(75);

      let username;
      let nickname;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'nickname',
            getValue: () => nickname,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'neo' ? 'nickname is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'test';

      form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['Required']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('nickname').hasErrors).toBe(false);
        expect(form.get('nickname').errors).toBe(null);
        expect(form.get('nickname').isPending).toBe(true);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'invalid password']);
        expect(form.isPending).toBe(true);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(false);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(false);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['invalid password']);
      expect(form.isPending).toBe(true);

      username = '';

      form.validate({
        target: form.get('username'),
        event: 'change'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(false);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required', 'invalid password']);
      expect(form.isPending).toBe(true);

      nickname = 'test';

      const promise = form.validate({
        target: form.get('nickname'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['Required']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('nickname').hasErrors).toBe(false);
        expect(form.get('nickname').errors).toBe(null);
        expect(form.get('nickname').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async valid field, then sync invalid field, then the async'
      + ' field is cleared, then another async invalid field,'
      + ' then the sync field is cleared', () => {
      expect.assertions(87);

      let username;
      let nickname;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'nickname',
            getValue: () => nickname,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'neo' ? 'nickname is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'test';

      form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['Required']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('nickname').hasErrors).toBe(true);
        expect(form.get('nickname').errors).toEqual(['nickname is taken']);
        expect(form.get('nickname').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['Required']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'Required']);
        expect(form.isPending).toBe(true);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(false);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(false);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['invalid password']);
      expect(form.isPending).toBe(true);

      username = '';

      form.validate({
        target: form.get('username'),
        event: 'change'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(false);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required', 'invalid password']);
      expect(form.isPending).toBe(true);

      nickname = 'neo';

      const promise = form.validate({
        target: form.get('nickname'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(true);
        expect(form.get('username').errors).toEqual(['Required']);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('nickname').hasErrors).toBe(true);
        expect(form.get('nickname').errors).toEqual(['nickname is taken']);
        expect(form.get('nickname').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['Required']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'nickname is taken', 'Required']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      password = '';

      form.validate({
        target: form.get('password'),
        event: 'change'
      });

      expect(form.get('username').hasErrors).toBe(true);
      expect(form.get('username').errors).toEqual(['Required']);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['Required']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required', 'Required']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async valid field, then another async valid field,'
      + ' then another sync invalid field', () => {
      expect.assertions(63);

      let username;
      let nickname;
      let password;
      const form = observe.root(new Form({
        children: [
          {
            name: 'username',
            getValue: () => username,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'john' ? 'username is taken' : null)))
          },
          {
            name: 'nickname',
            getValue: () => nickname,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.async((value) =>
                Promise.resolve(value === 'neo' ? 'nickname is taken' : null)))
          },
          {
            name: 'password',
            getValue: () => password,
            setValue() {},
            validate: validation(
              validation.required(),
              validation.validate((value) => {
                return value && value.length < 6
                  ? 'invalid password'
                  : null;
              }, {events: ['blur']})
            )
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      username = 'test';

      form.validate({
        target: form.get('username'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(false);
        expect(form.get('username').errors).toBe(null);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('nickname').hasErrors).toBe(false);
        expect(form.get('nickname').errors).toBe(null);
        expect(form.get('nickname').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(false);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      nickname = 'test';

      const promise = form.validate({
        target: form.get('nickname'),
        event: 'change'
      }).then(() => {
        expect(form.get('username').hasErrors).toBe(false);
        expect(form.get('username').errors).toBe(null);
        expect(form.get('username').isPending).toBe(false);
        expect(form.get('nickname').hasErrors).toBe(false);
        expect(form.get('nickname').errors).toBe(null);
        expect(form.get('nickname').isPending).toBe(false);
        expect(form.get('password').hasErrors).toBe(true);
        expect(form.get('password').errors).toEqual(['invalid password']);
        expect(form.get('password').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['invalid password']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(false);
      expect(form.get('password').errors).toBe(null);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      password = '123';

      form.validate({
        target: form.get('password'),
        event: 'blur'
      });

      expect(form.get('username').hasErrors).toBe(false);
      expect(form.get('username').errors).toBe(null);
      expect(form.get('username').isPending).toBe(true);
      expect(form.get('nickname').hasErrors).toBe(false);
      expect(form.get('nickname').errors).toBe(null);
      expect(form.get('nickname').isPending).toBe(true);
      expect(form.get('password').hasErrors).toBe(true);
      expect(form.get('password').errors).toEqual(['invalid password']);
      expect(form.get('password').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['invalid password']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async valid parent and sync invalid child', () => {
      expect.assertions(21);

      let child = 'test';
      const form = observe.root(new Form({
        validate: ({event}) => {
          // skip init validation
          return event === 'async-initial'
            ? new Promise((resolve) => {
              setTimeout(resolve);
            })
            : null;
        },
        children: [
          {
            name: 'child',
            getValue: () => child,
            setValue() {},
            validate: validation.required()
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      const promise = form.validate({
        event: 'async-initial'
      }).then(() => {
        expect(form.get('child').hasErrors).toBe(true);
        expect(form.get('child').errors).toEqual(['Required']);
        expect(form.get('child').isPending).toBe(false);
        expect(form.hasErrors).toBe(false);
        expect(form.errors).toBe(null);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('child').hasErrors).toBe(false);
      expect(form.get('child').errors).toBe(null);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      child = '';

      form.validate({
        target: form.get('child'),
        event: 'change'
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async invalid parent with errors from itself and sync invalid child', () => {
      expect.assertions(21);

      let child = 'test';
      const form = observe.root(new Form({
        validate: ({input, event}) => {
          // skip init validation
          return event === 'async-initial'
            ? new Promise((resolve) => {
              setTimeout(() => {
                resolve(input.errors);
              });
            })
            : null;
        },
        children: [
          {
            name: 'child',
            getValue: () => child,
            setValue() {},
            validate: validation.required()
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      const promise = form.validate({
        event: 'async-initial'
      }).then(() => {
        expect(form.get('child').hasErrors).toBe(true);
        expect(form.get('child').errors).toEqual(['Required']);
        expect(form.get('child').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('child').hasErrors).toBe(false);
      expect(form.get('child').errors).toBe(null);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      child = '';

      form.validate({
        target: form.get('child'),
        event: 'change'
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('sync invalid child and async valid parent', () => {
      expect.assertions(21);

      let child = 'test';
      const form = observe.root(new Form({
        validate: ({event}) => {
          // skip init validation
          return event === 'async-initial'
            ? new Promise((resolve) => {
              setTimeout(resolve);
            })
            : null;
        },
        children: [
          {
            name: 'child',
            getValue: () => child,
            setValue() {},
            validate: validation.required()
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      child = '';

      form.validate({
        target: form.get('child'),
        event: 'change'
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(false);

      const promise = form.validate({
        event: 'async-initial'
      }).then(() => {
        expect(form.get('child').hasErrors).toBe(true);
        expect(form.get('child').errors).toEqual(['Required']);
        expect(form.get('child').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('sync invalid child and async invalid parent with errors from itself', () => {
      expect.assertions(21);

      let child = 'test';
      const form = observe.root(new Form({
        validate: ({input, event}) => {
          // skip init validation
          return event === 'async-initial'
            ? new Promise((resolve) => {
              setTimeout(() => {
                resolve(input.errors);
              });
            })
            : null;
        },
        children: [
          {
            name: 'child',
            getValue: () => child,
            setValue() {},
            validate: validation.required()
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      child = '';

      form.validate({
        target: form.get('child'),
        event: 'change'
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(false);

      const promise = form.validate({
        event: 'async-initial'
      }).then(() => {
        expect(form.get('child').hasErrors).toBe(true);
        expect(form.get('child').errors).toEqual(['Required']);
        expect(form.get('child').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('sync invalid child and async invalid parent with errors from child', () => {
      expect.assertions(21);

      let child = 'test';
      const form = observe.root(new Form({
        validate: ({input, event}) => {
          // skip init validation
          return event === 'async-initial'
            ? new Promise((resolve) => {
              setTimeout(() => {
                resolve(input.children.filter((child) => child.hasErrors)
                  .map((child) => child.errors)
                  .reduce((prev, next) => prev.concat(next)));
              });
            })
            : null;
        },
        children: [
          {
            name: 'child',
            getValue: () => child,
            setValue() {},
            validate: validation.required()
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      child = '';

      form.validate({
        target: form.get('child'),
        event: 'change'
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);
      expect(form.isPending).toBe(false);

      const promise = form.validate({
        event: 'async-initial'
      }).then(() => {
        expect(form.get('child').hasErrors).toBe(true);
        expect(form.get('child').errors).toEqual(['Required']);
        expect(form.get('child').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required', 'Required']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['Required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('always validated sync invalid child and async invalid parent', () => {
      expect.assertions(21);

      let child = 'test';
      const form = observe.root(new Form({
        validate: ({input, event}) => {
          // skip init validation
          return event === 'async-initial'
            ? new Promise((resolve) => {
              setTimeout(() => {
                resolve(input.errors);
              }, 2000);
            })
            : null;
        },
        children: [
          {
            name: 'child',
            getValue: () => child,
            setValue() {},
            validate: ({input}) => input.getValue() ? null : 'required'
          }
        ]
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      child = '';

      form.validate({
        target: form.get('child'),
        event: 'change'
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['required']);
      expect(form.isPending).toBe(false);

      const promise = form.validate({
        event: 'async-initial'
      }).then(() => {
        expect(form.get('child').hasErrors).toBe(true);
        expect(form.get('child').errors).toEqual(['required']);
        expect(form.get('child').isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['required']);
        expect(form.isPending).toBe(false);
      });

      expect(form.get('child').hasErrors).toBe(true);
      expect(form.get('child').errors).toEqual(['required']);
      expect(form.get('child').isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.isPending).toBe(true);

      return promise;
    });

    test('async invalid input and async validation rejection', () => {
      expect.assertions(15);

      let value = 'john';
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        validate: validation.async((value) =>
          value === 'john'
            ? Promise.resolve('username is taken')
            : Promise.reject('rejection'))
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Validation failed']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = null;

      const promise = form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Validation failed']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      return promise;
    });

    test('async validation rejection and async valid input, before rejection settled', () => {
      expect.assertions(15);

      let value = 'john';
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        validate: validation.async((value) =>
          value === 'john'
            ? Promise.resolve().then(() => Promise.reject('username is taken'))
            : Promise.resolve())
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(false);
        expect(form.errors).toBe(null);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = null;

      const promise = form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(false);
        expect(form.errors).toBe(null);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      return promise;
    });

    test('async validation rejection and async valid input, after rejection settled', () => {
      expect.assertions(15);

      let value = 'john';
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        validate: validation.async((value) =>
          value === 'john'
            ? Promise.reject('username is taken')
            : Promise.resolve())
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Validation failed']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = null;

      const promise = form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Validation failed']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      return promise;
    });

    test('async validation rejection and cleared sync invalid input', () => {
      expect.assertions(12);

      let value = 'john';
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        validate: validation(
          validation.required(),
          validation.async(() => Promise.reject('username is taken')))
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      const promise = form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = null;

      form.validate({event: 'change'});

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);

      return promise;
    });

    test('input becomes non-pending later because of slower previous validation', () => {
      expect.assertions(15);

      let value = 'john';
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        // skip init validation
        validate: ({event}) => event === 'init'
          ? null
          : value === 'john'
            ? Promise
              .resolve()
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve('username is taken'))
            : Promise.resolve('username is still taken')
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      const promise = form.validate().then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['username is taken']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = 'smith';

      form.validate().then(() => {
        expect(form.isPending).toBe(true);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['username is still taken']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      return promise;
    });

    test('input with slower previous validation becomes non-pending earlier because of the'
      + ' async validator', () => {
      expect.assertions(15);

      let value = 'john';
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        validate: validation.async(() => value === 'john'
          ? Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve('username is taken'))
          : Promise.resolve('username is still taken'))
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['username is still taken']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = 'smith';

      const promise = form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['username is still taken']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      return promise;
    });

    test('input with slower previous validation becomes non-pending earlier because of the'
      + ' validation validator', () => {
      expect.assertions(15);

      let value = 'john';
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        // skip init validation
        validate: validation(({event}) => event === 'init'
          ? null
          : value === 'john'
            ? Promise
              .resolve()
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve('username is taken'))
            : Promise.resolve('username is still taken'))
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['username is still taken']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = 'smith';

      const promise = form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['username is still taken']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      return promise;
    });

    test('required async input becomes non-pending earlier', () => {
      expect.assertions(17);

      let value = 'john';
      const asyncValidationObservation = jest.fn();
      const finalValidationObservation = jest.fn();
      const form = observe.root(new Form({
        getValue: () => value,
        setValue() {},
        // skip init validation
        validate: validation(
          validation.required(),
          validation.async(() => {
            asyncValidationObservation();

            return Promise
              .resolve()
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => Promise.resolve())
              .then(() => {
                finalValidationObservation();

                return Promise.resolve('username is taken');
              });
            }))
      }));

      expect(form.isPending).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      form.validate({event: 'change'}).then(() => {
        expect(form.isPending).toBe(false);
        expect(form.hasErrors).toBe(true);
        expect(form.errors).toEqual(['Required']);
      });

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);

      value = '';

      form.validate({event: 'change'});

      expect(form.isPending).toBe(true);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['Required']);

      // need to wait for the queue from validation to be resolved, for the form to set the errors,
      // for the pending state to be updated and for the validate then callback above.
      return Promise
        .resolve()
        .then(() => Promise.resolve())
        .then(() => Promise.resolve())
        .then(() => Promise.resolve())
        .then(() => {
          expect(asyncValidationObservation.mock.calls.length).toBe(1);
          expect(finalValidationObservation.mock.calls.length).toBe(0);
          expect(form.isPending).toBe(false);
          expect(form.hasErrors).toBe(true);
          expect(form.errors).toEqual(['Required']);
        });
    });
  });

  describe('onStartPending', () => {
    test('marks all the ascendants chain as isInputPending', () => {
      expect.assertions(8);

      const root = new Input({
        children: [
          {
            children: [{}]
          },
          {}
        ]
      });

      expect(root.isInputPending).toBe(false);
      expect(root.children[0].isInputPending).toBe(false);
      expect(root.children[0].children[0].isInputPending).toBe(false);
      expect(root.children[1].isInputPending).toBe(false);
      root.children[0].children[0].onStartPending();
      expect(root.isInputPending).toBe(true);
      expect(root.children[0].isInputPending).toBe(true);
      expect(root.children[0].children[0].isInputPending).toBe(true);
      expect(root.children[1].isInputPending).toBe(false);
    });
  });

  describe('onBlur', () => {
    test('marks the input and all the ascendants chain as touched', () => {
      expect.assertions(8);

      const root = new Input({
        children: [
          {
            children: [{}]
          },
          {}
        ]
      });

      expect(root.isTouched).toBe(false);
      expect(root.children[0].isTouched).toBe(false);
      expect(root.children[0].children[0].isTouched).toBe(false);
      expect(root.children[1].isTouched).toBe(false);
      root.children[0].children[0].onBlur();
      expect(root.isTouched).toBe(true);
      expect(root.children[0].isTouched).toBe(true);
      expect(root.children[0].children[0].isTouched).toBe(true);
      expect(root.children[1].isTouched).toBe(false);
    });

    test('triggers the blur validation on the root with the input as the target', () => {
      expect.assertions(16);

      const root = new Input({
        validate({input, target, event}) {
          expect(this).toBe(root);
          expect(input).toBe(root);
          expect(target).toBe(root.children[0]);
          expect(event).toBe('blur');
        },
        children: [
          {
            validate({input, target, event}) {
              expect(this).toBe(root.children[0]);
              expect(input).toBe(root.children[0]);
              expect(target).toBe(root.children[0]);
              expect(event).toBe('blur');
            },
            children: [{
              validate({input, target, event}) {
                expect(this).toBe(root.children[0].children[0]);
                expect(input).toBe(root.children[0].children[0]);
                expect(target).toBe(root.children[0]);
                expect(event).toBe('blur');
              }
            }]
          },
          {
            validate({input, target, event}) {
              expect(this).toBe(root.children[1]);
              expect(input).toBe(root.children[1]);
              expect(target).toBe(root.children[0]);
              expect(event).toBe('blur');
            },
          }
        ]
      });

      root.children[0].onBlur();
    });

    test('marks the input as touched and then validates', () => {
      expect.assertions(3);

      const input = new Input({
        validate() {
          expect(input.isTouched).toBe(true);
        }
      });

      expect(input.isTouched).toBe(false);
      input.onBlur();
      expect(input.isTouched).toBe(true);
    });
  });

  describe('submit', () => {
    test('if the input is blocked it can not be submitted', () => {
      expect.assertions(6);

      const input = new Input();

      expect(input.isBlocked).toBe(false);
      expect(input.isSubmitted).toBe(false);
      input.onStartPending();
      expect(input.isBlocked).toBe(true);
      expect(input.isSubmitted).toBe(false);
      input.submit();
      expect(input.isBlocked).toBe(true);
      expect(input.isSubmitted).toBe(false);
    });

    test('if the input is not blocked it can be submitted', () => {
      expect.assertions(4);

      const input = new Input();

      expect(input.isBlocked).toBe(false);
      expect(input.isSubmitted).toBe(false);
      input.submit();
      expect(input.isBlocked).toBe(false);
      expect(input.isSubmitted).toBe(true);
    });

    test('validates the input with the submit event and the input itself as target', () => {
      expect.assertions(4);

      const input = new Input({
        validate({input: input_, event, target}) {
          expect(input_).toBe(input);
          expect(event).toBe('submit');
          expect(target).toBe(input);
          expect(this).toBe(input);
        }
      });

      input.submit();
    });

    test('doesn\'t validate the ancestors', () => {
      expect.assertions(5);

      const observation = jest.fn();
      const root = new Input({
        validate: observation,
        children: [
          {
            validate({input, event, target}) {
              expect(input).toBe(root.children[0]);
              expect(event).toBe('submit');
              expect(target).toBe(root.children[0]);
              expect(this).toBe(root.children[0]);
            }
          }
        ]
      });

      root.children[0].submit();
      expect(observation.mock.calls.length).toBe(0);
    });

    test('the input remains submitted even if it became invalid during submission', () => {
      expect.assertions(6);

      const input = new Input({
        validate: () => 'err'
      });

      expect(input.isSubmitted).toBe(false);
      expect(input.hasErrors).toBe(false);
      expect(input.errors).toBe(null);
      input.submit();
      expect(input.isSubmitted).toBe(true);
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['err']);
    });

    test('ancestors can still be valid even if the input becomes invalid during submission', () => {
      expect.assertions(13);

      const rootSubmitObservation = jest.fn();
      const rootValidateObservation = jest.fn();
      const root = new Input({
        validate: rootValidateObservation,
        actions: {
          submit: rootSubmitObservation
        },
        children: [
          {
            validate: () => 'err'
          }
        ]
      });

      root.children[0].submit();
      expect(root.children[0].isSubmitted).toBe(true);
      expect(root.children[0].hasErrors).toBe(true);
      expect(root.children[0].errors).toEqual(['err']);
      expect(root.hasErrors).toBe(false);
      expect(root.errors).toBe(null);
      expect(root.isSubmitted).toBe(false);
      expect(rootSubmitObservation.mock.calls.length).toBe(0);
      expect(rootValidateObservation.mock.calls.length).toBe(0);
      root.submit();
      expect(root.hasErrors).toBe(true);
      expect(root.errors).toEqual(['err']);
      expect(root.isSubmitted).toBe(true);
      expect(rootSubmitObservation.mock.calls.length).toBe(0);
      expect(rootValidateObservation.mock.calls.length).toBe(1);
    });

    test('calls the submit action with the input as this and submission arguments', () => {
      expect.assertions(3);

      const input = new Input({
        actions: {
          submit(x, y) {
            expect(x).toBe(1);
            expect(y).toBe(2);
            expect(this).toBe(input);
          }
        }
      });

      input.submit(1, 2);
    });

    test('doesn\'t call the submit action if the input becomes blocked during submission', () => {
      expect.assertions(3);

      const observation = jest.fn();
      const input = new Input({
        validate: () => 'err',
        actions: {
          submit: observation
        }
      });

      expect(input.isBlocked).toBe(false);
      input.submit();
      expect(input.isBlocked).toBe(true);
      expect(observation.mock.calls.length).toBe(0);
    });

    test('sets isSubmitted, then validates, then calls the submit action', () => {
      expect.assertions(5);

      const validationObservation = jest.fn();
      const submissionObservation = jest.fn();
      const input = new Input({
        validate: () => {
          expect(input.isSubmitted).toBe(true);
          expect(submissionObservation.mock.calls.length).toBe(0);
          validationObservation();
        },
        actions: {
          submit: () => {
            expect(input.isSubmitted).toBe(true);
            expect(validationObservation.mock.calls.length).toBe(1);
            submissionObservation();
          }
        }
      });

      expect(input.isSubmitted).toBe(false);
      input.submit();
    });

    test('if the input has async validation during submit, the ancestors become pending'
      + ' blocked', () => {
      expect.assertions(24);

      const root = observe.root(new Input({
        children: [
          {
            validate: () => Promise.resolve('err')
          }
        ]
      }));

      expect(root.isPending).toBe(false);
      expect(root.isPendingBlocked).toBe(false);
      expect(root.hasErrors).toBe(false);
      expect(root.errors).toBe(null);
      expect(root.children[0].isPending).toBe(false);
      expect(root.children[0].isPendingBlocked).toBe(false);
      expect(root.children[0].hasErrors).toBe(false);
      expect(root.children[0].errors).toBe(null);
      root.children[0].submit();
      expect(root.isPending).toBe(true);
      expect(root.isPendingBlocked).toBe(true);
      expect(root.hasErrors).toBe(false);
      expect(root.errors).toBe(null);
      expect(root.children[0].isPending).toBe(true);
      expect(root.children[0].isPendingBlocked).toBe(true);
      expect(root.children[0].hasErrors).toBe(false);
      expect(root.children[0].errors).toBe(null);

      // need to wait for the form to set the errors and for the pending state to be updated
      return Promise
        .resolve()
        .then(() => Promise.resolve())
        .then(() => Promise.resolve())
        .then(() => {
          expect(root.isPending).toBe(false);
          expect(root.isPendingBlocked).toBe(false);
          expect(root.hasErrors).toBe(false);
          expect(root.errors).toBe(null);
          expect(root.children[0].isPending).toBe(false);
          expect(root.children[0].isPendingBlocked).toBe(false);
          expect(root.children[0].hasErrors).toBe(true);
          expect(root.children[0].errors).toEqual(['err']);
        });
    });
  });

  describe('getResult', () => {
    test('is ignored', () => {
      expect.assertions(2);

      const observation = jest.fn();
      const input = new Input({
        getValue() { return 4; },
        setValue() {}
      });

      observe.on(observation);
      expect(input.getResult()).toBe(4);
      expect(observation.mock.calls.length).toBe(0);
      observe.off(observation);
    });

    test('returns appropriate result', () => {
      expect.assertions(1);
      expect(new Input({
        getValue() { return 100; },
        setValue() {},
        children: [
          {},
          {
            name: 'child2',
            children: [
              {
                name: 'grandChild1',
                getValue() { return 1000; },
                setValue() {}
              },
              {
                name: 'grandChild2',
                initialValue: 300
              }
            ]
          }
        ]
      }).getResult()).toEqual([
        undefined,
        {
          grandChild1: 1000,
          grandChild2: 300
        }
      ]);
    });

    test('if the children config was an empty array, returns an empty array', () => {
      expect.assertions(1);
      expect(new Input({
        children: []
      }).getResult()).toEqual([]);
    });

    test('if the children config had at least one object with no name, returns an array', () => {
      expect.assertions(1);
      expect(new Input({
        children: [
          {
            initialValue: 4
          },
          {
            name: 'child2',
            initialValue: 400
          }
        ]
      }).getResult()).toEqual([4, 400]);
    });

    test('if all the config children had a name, returns a regular object', () => {
      expect.assertions(1);
      expect(new Input({
        children: [
          {
            name: 'child1',
            initialValue: 4
          },
          {
            name: 'child2',
            initialValue: 400
          }
        ]
      }).getResult()).toEqual({
        child1: 4,
        child2: 400
      });
    });

    test('includes results of children', () => {
      expect.assertions(2);

      const input = new Input({
        children: [
          {
            name: 'child1',
            initialValue: {x: 4}
          },
          {
            name: 'child2',
            initialValue: 400,
            children: [
              {
                name: 'grandChild1',
                initialValue: 3
              },
              {
                name: 'grandChild2',
                initialValue: 500
              }
            ]
          }
        ]
      });

      expect(input.get('child2').getResult()).toEqual({
        grandChild1: 3,
        grandChild2: 500
      });
      expect(input.getResult()).toEqual({
        child1: {x: 4},
        child2: input.get('child2').getResult()
      });
    });

    test('if there are no children, returns what getValue returns', () => {
      expect.assertions(9);

      const thisArgs = [];
      const input = new Input({
        getValue() {
          thisArgs.push(this);

          return 1234;
        },
        setValue() {}
      });

      // getValue is called to set initialValue
      expect(thisArgs.length).toBe(1);
      expect(thisArgs[0]).toBe(input);
      expect(input.getResult()).toBe(1234);
      expect(input.getResult()).toBe(input.getValue());
      // getValue is called 3 more times
      expect(thisArgs.length).toBe(4);
      expect(thisArgs[0]).toBe(input);
      expect(thisArgs[1]).toBe(input);
      expect(thisArgs[2]).toBe(input);
      expect(thisArgs[3]).toBe(input);
    });

    test('null and undefined names don\'t count as names', () => {
      expect.assertions(2);
      expect(new Input({
        children: [
          {
            name: null,
            initialValue: 4
          },
          {
            name: 'child2',
            initialValue: 400
          }
        ]
      }).getResult()).toEqual([4, 400]);
      expect(new Input({
        children: [
          {
            name: undefined,
            initialValue: 4
          },
          {
            name: 'child2',
            initialValue: 400
          }
        ]
      }).getResult()).toEqual([4, 400]);
    });
  });

  describe('reset', () => {
    test('if the input is pending blocked it can not be reset', () => {
      expect.assertions(6);

      const input = new Input({
        initialValue: 1
      });

      input.onChange(3);
      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(3);
      input.onStartPending();
      expect(input.isPendingBlocked).toBe(true);
      expect(input.getValue()).toBe(3);
      input.reset();
      expect(input.isPendingBlocked).toBe(true);
      expect(input.getValue()).toBe(3);
    });

    test('if the input is not pending blocked it can be reset', () => {
      expect.assertions(4);

      const input = new Input({
        initialValue: 1
      });

      input.onChange(3);
      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(3);
      input.reset();
      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(1);
    });

    test('resets the children', () => {
      expect.assertions(24);

      const input = new Input({
        initialValue: 1,
        children: [{
          initialValue: 2
        }]
      });

      expect(input.children[0].getValue()).toBe(2);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.getValue()).toBe(1);
      expect(input.isSubmitted).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
      input.children[0].onChange(4);
      input.children[0].submit();
      input.onChange(3);
      input.submit();
      expect(input.children[0].getValue()).toBe(4);
      expect(input.children[0].isSubmitted).toBe(true);
      expect(input.children[0].isTouched).toBe(true);
      expect(input.children[0].isDirty).toBe(true);
      expect(input.getValue()).toBe(3);
      expect(input.isSubmitted).toBe(true);
      expect(input.isTouched).toBe(true);
      expect(input.isDirty).toBe(true);
      input.reset();
      expect(input.children[0].getValue()).toBe(2);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.getValue()).toBe(1);
      expect(input.isSubmitted).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
    });

    test('sets isSubmitted and isTouched to false and sets the value to the initial value', () => {
      expect.assertions(6);

      const input = new Input({
        initialValue: 1
      });

      input.onChange(3);
      input.submit();
      expect(input.isSubmitted).toBe(true);
      expect(input.isTouched).toBe(true);
      expect(input.getValue()).toBe(3);
      input.reset();
      expect(input.isSubmitted).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.getValue()).toBe(1);
    });

    test('calls setValue with the input as this and the initialValue as the value', () => {
      expect.assertions(5);

      const initialValue = 1;
      let inputValue = initialValue;
      let resetting = false;
      const input = new Input({
        getValue: () => inputValue,
        setValue(value) {
          inputValue = value;

          if (resetting) {
            expect(value).toBe(initialValue);
            expect(this).toBe(input);
          }
        }
      });

      expect(input.getValue()).toBe(1);
      input.onChange(4);
      expect(input.getValue()).toBe(4);

      resetting = true;

      input.reset();
      expect(input.getValue()).toBe(1);
    });

    test('updates the dirty state on the root', () => {
      expect.assertions(6);

      const root = new Input({
        initialValue: 1,
        children: [{
          initialValue: 2,
          children: [{
            initialValue: 3
          }]
        }]
      });

      root.onChange(4);
      root.children[0].onChange(5);
      root.children[0].children[0].onChange(6);
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(true);
      expect(root.children[0].children[0].isDirty).toBe(true);
      root.children[0].reset();
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[0].children[0].isDirty).toBe(false);
    });

    test('validates the root with the submit event and the input itself as target', () => {
      expect.assertions(8);

      const root = new Input({
        validate({input, event, target}) {
          expect(input).toBe(root);
          expect(event).toBe('reset');
          expect(target).toBe(root.children[0]);
          expect(this).toBe(root);
        },
        children: [{
          validate({input, event, target}) {
            expect(input).toBe(root.children[0]);
            expect(event).toBe('reset');
            expect(target).toBe(root.children[0]);
            expect(this).toBe(root.children[0]);
          },
        }]
      });

      root.children[0].reset();
    });

    test('the children don\'t revalidate the root', () => {
      expect.assertions(13);

      const observation = jest.fn();
      const root = new Input({
        validate({input, event, target}) {
          observation();
          expect(input).toBe(root);
          expect(event).toBe('reset');
          expect(target).toBe(root.children[0]);
          expect(this).toBe(root);
        },
        children: [{
          validate({input, event, target}) {
            expect(input).toBe(root.children[0]);
            expect(event).toBe('reset');
            expect(target).toBe(root.children[0]);
            expect(this).toBe(root.children[0]);
          },
          children: [{
            validate({input, event, target}) {
              expect(input).toBe(root.children[0].children[0]);
              expect(event).toBe('reset');
              expect(target).toBe(root.children[0]);
              expect(this).toBe(root.children[0].children[0]);
            }
          }]
        }]
      });

      root.children[0].reset();
      expect(observation.mock.calls.length).toBe(1);
    });

    test('calls the reset action with the input as this even if the input becomes invalid'
      + ' during reset', () => {
      expect.assertions(4);

      const input = new Input({
        validate: () => 'err',
        actions: {
          reset() {
            expect(this).toBe(input);
          }
        }
      });

      expect(input.hasErrors).toBe(false);
      input.reset();
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['err']);
    });

    test('doesn\'t call the reset action if the input becomes pending blocked during reset', () => {
      expect.assertions(3);

      const observation = jest.fn();
      const input = new Input({
        validate: () => {
          input.onStartPending();
        },
        actions: {
          reset: observation
        }
      });

      expect(input.isPendingBlocked).toBe(false);
      input.reset();
      expect(input.isPendingBlocked).toBe(true);
      expect(observation.mock.calls.length).toBe(0);
    });

    test('doesn\'t call the reset action on the parent or children', () => {
      expect.assertions(1);

      const observation = jest.fn();
      const root = new Input({
        actions: {
          reset: observation
        },
        children: [{
          children: [{
            actions: {
              reset: observation
            }
          }]
        }]
      });

      root.children[0].reset();
      expect(observation.mock.calls.length).toBe(0);
    });

    test('resets the children, then sets the value, sets isSubmitted and isTouched,'
      + ' updates isDirty, validates and then calls the reset action', () => {
      expect.assertions(62);

      let inputValue = 1;
      let resetting = false;
      const validationObservation = jest.fn();
      const childValidationObservation = jest.fn();
      const resetObservation = jest.fn();
      const input = new Input({
        getValue: () => inputValue,
        setValue: (value) => {
          if (resetting) {
            expect(input.isTouched).toBe(true);
            expect(input.isDirty).toBe(true);
            expect(input.isSubmitted).toBe(true);
            expect(input.getValue()).toBe(3);
            expect(input.children[0].isTouched).toBe(false);
            expect(input.children[0].isDirty).toBe(true);
            expect(input.children[0].isSubmitted).toBe(false);
            expect(input.children[0].getValue()).toBe(2);
          }

          inputValue = value;
        },
        validate: ({event}) => {
          if (event === 'reset') {
            expect(input.isTouched).toBe(false);
            expect(input.isDirty).toBe(false);
            expect(input.isSubmitted).toBe(false);
            expect(input.getValue()).toBe(1);
            expect(input.children[0].isTouched).toBe(false);
            expect(input.children[0].isDirty).toBe(false);
            expect(input.children[0].isSubmitted).toBe(false);
            expect(input.children[0].getValue()).toBe(2);
            validationObservation();
            expect(childValidationObservation.mock.calls.length).toBe(1);
            expect(resetObservation.mock.calls.length).toBe(0);
          }
        },
        actions: {
          reset: () => {
            expect(input.isTouched).toBe(false);
            expect(input.isDirty).toBe(false);
            expect(input.isSubmitted).toBe(false);
            expect(input.getValue()).toBe(1);
            expect(input.children[0].isTouched).toBe(false);
            expect(input.children[0].isDirty).toBe(false);
            expect(input.children[0].isSubmitted).toBe(false);
            expect(input.children[0].getValue()).toBe(2);
            resetObservation();
            expect(validationObservation.mock.calls.length).toBe(1);
            expect(childValidationObservation.mock.calls.length).toBe(1);
          }
        },
        children: [{
          initialValue: 2,
          validate: ({event}) => {
            if (event === 'reset') {
              expect(input.isTouched).toBe(false);
              expect(input.isDirty).toBe(false);
              expect(input.isSubmitted).toBe(false);
              expect(input.getValue()).toBe(1);
              expect(input.children[0].isTouched).toBe(false);
              expect(input.children[0].isDirty).toBe(false);
              expect(input.children[0].isSubmitted).toBe(false);
              expect(input.children[0].getValue()).toBe(2);
              childValidationObservation();
              expect(validationObservation.mock.calls.length).toBe(0);
              expect(resetObservation.mock.calls.length).toBe(0);
            }
          }
        }]
      });

      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
      expect(input.isSubmitted).toBe(false);
      expect(input.getValue()).toBe(1);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].getValue()).toBe(2);
      input.onChange(3);
      input.children[0].onChange(4);
      input.submit();
      input.children[0].submit();
      expect(input.isTouched).toBe(true);
      expect(input.isDirty).toBe(true);
      expect(input.isSubmitted).toBe(true);
      expect(input.getValue()).toBe(3);
      expect(input.children[0].isTouched).toBe(true);
      expect(input.children[0].isDirty).toBe(true);
      expect(input.children[0].isSubmitted).toBe(true);
      expect(input.children[0].getValue()).toBe(4);

      resetting = true;

      input.reset();
      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
      expect(input.isSubmitted).toBe(false);
      expect(input.getValue()).toBe(1);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].getValue()).toBe(2);
    });
  });

  describe('clear', () => {
    test('if the input is pending blocked it can not be cleared', () => {
      expect.assertions(6);

      const input = new Input({
        initialValue: 1
      });

      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(1);
      input.onStartPending();
      expect(input.isPendingBlocked).toBe(true);
      expect(input.getValue()).toBe(1);
      input.clear();
      expect(input.isPendingBlocked).toBe(true);
      expect(input.getValue()).toBe(1);
    });

    test('if the input is not pending blocked it can be cleared', () => {
      expect.assertions(4);

      const input = new Input({
        initialValue: 1
      });

      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(1);
      input.clear();
      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(null);
    });

    test('the initialValue is set to the clear value', () => {
      expect.assertions(6);

      const input = new Input({
        initialValue: 1
      });

      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(1);
      expect(input.initialValue).toBe(1);
      input.clear();
      expect(input.isPendingBlocked).toBe(false);
      expect(input.getValue()).toBe(null);
      expect(input.initialValue).toBe(null);
    });

    test('if a clearValue is provided, it\'s used as the value', () => {
      expect.assertions(4);

      let inputValue = 3;
      const input = new Input({
        clearValue: undefined,
        getValue: () => inputValue,
        setValue(value) { inputValue = value; }
      });

      expect(input.initialValue).toBe(3);
      expect(input.getValue()).toBe(3);
      input.clear();
      expect(input.initialValue).toBe(undefined);
      expect(input.getValue()).toBe(undefined);
    });

    test('if a clearValue is provided and it\'s truthy, it\'s used as the value', () => {
      expect.assertions(4);

      let inputValue = 3;
      const input = new Input({
        clearValue: 100,
        getValue: () => inputValue,
        setValue(value) { inputValue = value; }
      });

      expect(input.initialValue).toBe(3);
      expect(input.getValue()).toBe(3);
      input.clear();
      expect(input.initialValue).toBe(100);
      expect(input.getValue()).toBe(100);
    });

    test('if a clearValue is not provided, if the initialValue is falsy'
      + ' it\'s used as the value', () => {
      expect.assertions(6);

      const input = new Input({
        initialValue: 0
      });

      expect(input.initialValue).toBe(0);
      expect(input.getValue()).toBe(0);
      input.onChange(4);
      expect(input.initialValue).toBe(0);
      expect(input.getValue()).toBe(4);
      input.clear();
      expect(input.initialValue).toBe(0);
      expect(input.getValue()).toBe(0);
    });

    test('if a clearValue is not provided and the initialValue is truthy'
      + ' null is used as the value', () => {
      expect.assertions(4);

      let inputValue = 3;
      const input = new Input({
        getValue: () => inputValue,
        setValue(value) { inputValue = value; }
      });

      expect(input.initialValue).toBe(3);
      expect(input.getValue()).toBe(3);
      input.clear();
      expect(input.initialValue).toBe(null);
      expect(input.getValue()).toBe(null);
    });

    test('clears the children', () => {
      expect.assertions(30);

      const input = new Input({
        initialValue: 1,
        children: [{
          initialValue: 2
        }]
      });

      expect(input.children[0].getValue()).toBe(2);
      expect(input.children[0].initialValue).toBe(2);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.getValue()).toBe(1);
      expect(input.initialValue).toBe(1);
      expect(input.isSubmitted).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
      input.children[0].onChange(4);
      input.children[0].submit();
      input.onChange(3);
      input.submit();
      expect(input.children[0].getValue()).toBe(4);
      expect(input.children[0].initialValue).toBe(2);
      expect(input.children[0].isSubmitted).toBe(true);
      expect(input.children[0].isTouched).toBe(true);
      expect(input.children[0].isDirty).toBe(true);
      expect(input.getValue()).toBe(3);
      expect(input.initialValue).toBe(1);
      expect(input.isSubmitted).toBe(true);
      expect(input.isTouched).toBe(true);
      expect(input.isDirty).toBe(true);
      input.clear();
      expect(input.children[0].getValue()).toBe(null);
      expect(input.children[0].initialValue).toBe(null);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.getValue()).toBe(null);
      expect(input.initialValue).toBe(null);
      expect(input.isSubmitted).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
    });

    test('sets isSubmitted and isTouched to false and sets the value to the initial value', () => {
      expect.assertions(8);

      const input = new Input({
        initialValue: 1
      });

      input.onChange(3);
      input.submit();
      expect(input.isSubmitted).toBe(true);
      expect(input.isTouched).toBe(true);
      expect(input.getValue()).toBe(3);
      expect(input.initialValue).toBe(1);
      input.clear();
      expect(input.isSubmitted).toBe(false);
      expect(input.isTouched).toBe(false);
      expect(input.getValue()).toBe(null);
      expect(input.initialValue).toBe(null);
    });

    test('calls setValue with the input as this and the initialValue as the value', () => {
      expect.assertions(9);

      let inputValue = 1;
      let clearting = false;
      const input = new Input({
        getValue: () => inputValue,
        setValue(value) {
          inputValue = value;

          if (clearting) {
            expect(value).toBe(null);
            expect(value).toBe(input.initialValue);
            expect(this).toBe(input);
          }
        }
      });

      expect(input.getValue()).toBe(1);
      expect(input.initialValue).toBe(1);
      input.onChange(4);
      expect(input.getValue()).toBe(4);
      expect(input.initialValue).toBe(1);

      clearting = true;

      input.clear();
      expect(input.getValue()).toBe(null);
      expect(input.initialValue).toBe(null);
    });

    test('updates the dirty state on the root', () => {
      expect.assertions(6);

      const root = new Input({
        initialValue: 1,
        children: [{
          initialValue: 2,
          children: [{
            initialValue: 3
          }]
        }]
      });

      root.onChange(4);
      root.children[0].onChange(5);
      root.children[0].children[0].onChange(6);
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(true);
      expect(root.children[0].children[0].isDirty).toBe(true);
      root.children[0].clear();
      expect(root.isDirty).toBe(true);
      expect(root.children[0].isDirty).toBe(false);
      expect(root.children[0].children[0].isDirty).toBe(false);
    });

    test('validates the root with the clear event and the input itself as target', () => {
      expect.assertions(8);

      const root = new Input({
        validate({input, event, target}) {
          expect(input).toBe(root);
          expect(event).toBe('clear');
          expect(target).toBe(root.children[0]);
          expect(this).toBe(root);
        },
        children: [{
          validate({input, event, target}) {
            expect(input).toBe(root.children[0]);
            expect(event).toBe('clear');
            expect(target).toBe(root.children[0]);
            expect(this).toBe(root.children[0]);
          },
        }]
      });

      root.children[0].clear();
    });

    test('the children don\'t revalidate the root', () => {
      expect.assertions(13);

      const observation = jest.fn();
      const root = new Input({
        validate({input, event, target}) {
          observation();
          expect(input).toBe(root);
          expect(event).toBe('clear');
          expect(target).toBe(root.children[0]);
          expect(this).toBe(root);
        },
        children: [{
          validate({input, event, target}) {
            expect(input).toBe(root.children[0]);
            expect(event).toBe('clear');
            expect(target).toBe(root.children[0]);
            expect(this).toBe(root.children[0]);
          },
          children: [{
            validate({input, event, target}) {
              expect(input).toBe(root.children[0].children[0]);
              expect(event).toBe('clear');
              expect(target).toBe(root.children[0]);
              expect(this).toBe(root.children[0].children[0]);
            }
          }]
        }]
      });

      root.children[0].clear();
      expect(observation.mock.calls.length).toBe(1);
    });

    test('calls the clear action with the input as this even if the input becomes invalid'
      + ' during clearing', () => {
      expect.assertions(4);

      const input = new Input({
        validate: () => 'err',
        actions: {
          clear() {
            expect(this).toBe(input);
          }
        }
      });

      expect(input.hasErrors).toBe(false);
      input.clear();
      expect(input.hasErrors).toBe(true);
      expect(input.errors).toEqual(['err']);
    });

    test('doesn\'t call the clear action if the input becomes pending blocked during clear', () => {
      expect.assertions(3);

      const observation = jest.fn();
      const input = new Input({
        validate: () => {
          input.onStartPending();
        },
        actions: {
          clear: observation
        }
      });

      expect(input.isPendingBlocked).toBe(false);
      input.clear();
      expect(input.isPendingBlocked).toBe(true);
      expect(observation.mock.calls.length).toBe(0);
    });

    test('doesn\'t call the clear action on the parent or children', () => {
      expect.assertions(1);

      const observation = jest.fn();
      const root = new Input({
        actions: {
          clear: observation
        },
        children: [{
          children: [{
            actions: {
              clear: observation
            }
          }]
        }]
      });

      root.children[0].clear();
      expect(observation.mock.calls.length).toBe(0);
    });

    test('clears the children, then sets the initialValue, then sets the value, sets isSubmitted'
      + ' and isTouched, updates isDirty, validates and then calls the clear action', () => {
      expect.assertions(76);

      let inputValue = 1;
      let clearting = false;
      const validationObservation = jest.fn();
      const childValidationObservation = jest.fn();
      const clearObservation = jest.fn();
      const input = new Input({
        getValue: () => inputValue,
        setValue: (value) => {
          if (clearting) {
            expect(input.isTouched).toBe(true);
            expect(input.isDirty).toBe(true);
            expect(input.isSubmitted).toBe(true);
            expect(input.getValue()).toBe(3);
            expect(input.initialValue).toBe(null);
            expect(input.children[0].isTouched).toBe(false);
            expect(input.children[0].isDirty).toBe(true);
            expect(input.children[0].isSubmitted).toBe(false);
            expect(input.children[0].getValue()).toBe(null);
            expect(input.children[0].initialValue).toBe(null);
          }

          inputValue = value;
        },
        validate: ({event}) => {
          if (event === 'clear') {
            expect(input.isTouched).toBe(false);
            expect(input.isDirty).toBe(false);
            expect(input.isSubmitted).toBe(false);
            expect(input.getValue()).toBe(null);
            expect(input.initialValue).toBe(null);
            expect(input.children[0].isTouched).toBe(false);
            expect(input.children[0].isDirty).toBe(false);
            expect(input.children[0].isSubmitted).toBe(false);
            expect(input.children[0].getValue()).toBe(null);
            expect(input.children[0].initialValue).toBe(null);
            validationObservation();
            expect(childValidationObservation.mock.calls.length).toBe(1);
            expect(clearObservation.mock.calls.length).toBe(0);
          }
        },
        actions: {
          clear: () => {
            expect(input.isTouched).toBe(false);
            expect(input.isDirty).toBe(false);
            expect(input.isSubmitted).toBe(false);
            expect(input.getValue()).toBe(null);
            expect(input.initialValue).toBe(null);
            expect(input.children[0].isTouched).toBe(false);
            expect(input.children[0].isDirty).toBe(false);
            expect(input.children[0].isSubmitted).toBe(false);
            expect(input.children[0].getValue()).toBe(null);
            expect(input.children[0].initialValue).toBe(null);
            clearObservation();
            expect(validationObservation.mock.calls.length).toBe(1);
            expect(childValidationObservation.mock.calls.length).toBe(1);
          }
        },
        children: [{
          initialValue: 2,
          validate: ({event}) => {
            if (event === 'clear') {
              expect(input.isTouched).toBe(false);
              expect(input.isDirty).toBe(false);
              expect(input.isSubmitted).toBe(false);
              expect(input.getValue()).toBe(null);
              expect(input.initialValue).toBe(null);
              expect(input.children[0].isTouched).toBe(false);
              expect(input.children[0].isDirty).toBe(false);
              expect(input.children[0].isSubmitted).toBe(false);
              expect(input.children[0].getValue()).toBe(null);
              expect(input.children[0].initialValue).toBe(null);
              childValidationObservation();
              expect(validationObservation.mock.calls.length).toBe(0);
              expect(clearObservation.mock.calls.length).toBe(0);
            }
          }
        }]
      });

      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
      expect(input.isSubmitted).toBe(false);
      expect(input.getValue()).toBe(1);
      expect(input.initialValue).toBe(1);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].getValue()).toBe(2);
      expect(input.children[0].initialValue).toBe(2);
      input.onChange(3);
      input.children[0].onChange(4);
      input.submit();
      input.children[0].submit();
      expect(input.isTouched).toBe(true);
      expect(input.isDirty).toBe(true);
      expect(input.isSubmitted).toBe(true);
      expect(input.getValue()).toBe(3);
      expect(input.initialValue).toBe(1);
      expect(input.children[0].isTouched).toBe(true);
      expect(input.children[0].isDirty).toBe(true);
      expect(input.children[0].isSubmitted).toBe(true);
      expect(input.children[0].getValue()).toBe(4);
      expect(input.children[0].initialValue).toBe(2);

      clearting = true;

      input.clear();
      expect(input.isTouched).toBe(false);
      expect(input.isDirty).toBe(false);
      expect(input.isSubmitted).toBe(false);
      expect(input.getValue()).toBe(null);
      expect(input.initialValue).toBe(null);
      expect(input.children[0].isTouched).toBe(false);
      expect(input.children[0].isDirty).toBe(false);
      expect(input.children[0].isSubmitted).toBe(false);
      expect(input.children[0].getValue()).toBe(null);
      expect(input.children[0].initialValue).toBe(null);
    });
  });

  describe('get', () => {
    test('gets the children with matching name', () => {
      expect.assertions(5);

      const input = new Input({
        children: [
          {},
          {name: 'undefined'},
          {name: 'test'}
        ]
      });

      expect(!!input.get('a')).toBe(false);
      expect(!!input.get(null)).toBe(false);
      expect(!!input.get(undefined)).toBe(false);
      expect(!!input.get('test')).toBe(true);
      expect(!!input.get(0)).toBe(false);
    });

    test('is ignored', () => {
      expect.assertions(2);

      const observation = jest.fn();
      const input = new Input({
        children: [
          {name: 'test'}
        ]
      });

      observe.on(observation);
      expect(!!input.get('test')).toBe(true);
      expect(observation.mock.calls.length).toBe(0);
      observe.off(observation);
    });
  });

  describe('addChild', () => {
    test('throws if the child already has a parent', () => {
      expect.assertions(2);

      const root = new Input({
        children: [{}]
      });
      const input = new Input();

      expect(() => {
        input.addChild(root.children[0]);
      }).toThrowError(Error);
      expect(() => {
        input.addChild(root.children[0]);
      }).toThrowError('The child input already has a parent.');
    });

    test('throws if there are children with duplicate names', () => {
      expect.assertions(2);

      const parent = new Input({
        children: [{name: 'child'}]
      });

      expect(() => {
        parent.addChild(new Input({name: 'child'}));
      }).toThrowError(Error);
      expect(() => {
        parent.addChild(new Input({name: 'child'}));
      }).toThrowError('Duplicate child name: child');
    });

    test('sets the destination as the parent', () => {
      expect.assertions(1);

      const parent = new Input();
      const child = new Input();

      parent.addChild(child);
      expect(child.parent).toBe(parent);
    });

    test('sets the parent\'s root as the root on the child input and its descendants', () => {
      expect.assertions(8);

      const root = new Input({
        children: [{}]
      });
      const [parent] = root.children;
      const input = new Input({
        children: [{}]
      });
      const [grandChild] = input.children;

      expect(root.root).toBe(root);
      expect(parent.root).toBe(root);
      expect(input.root).toBe(input);
      expect(grandChild.root).toBe(input);
      parent.addChild(input);
      expect(root.root).toBe(root);
      expect(parent.root).toBe(root);
      expect(input.root).toBe(root);
      expect(grandChild.root).toBe(root);
    });

    test('the child input becomes a child of the parent', () => {
      expect.assertions(8);

      const parent = new Input();
      const child = new Input({name: 'child'});
      const anotherChild = new Input();

      expect(parent.children).toBe(undefined);
      expect(parent.get('child')).toBe(undefined);
      parent.addChild(child);
      expect(parent.children.length).toBe(1);
      expect(parent.children[0]).toBe(child);
      expect(parent.get('child')).toBe(child);
      parent.addChild(anotherChild);
      expect(parent.children.length).toBe(2);
      expect(parent.children[1]).toBe(anotherChild);
      expect(parent.get('anotherChild')).toBe(undefined);
    });

    test('if an index is passed the child is inserted at that position', () => {
      expect.assertions(7);

      const parent = new Input();
      const child = new Input();
      const anotherChild = new Input();
      const yetAnotherChild = new Input();

      parent.addChild(child, 5);
      expect(parent.children[0]).toBe(child);
      expect(parent.children[5]).toBe(undefined);
      parent.addChild(anotherChild, -1);
      expect(parent.children[0]).toBe(anotherChild);
      expect(parent.children[-1]).toBe(undefined);
      parent.addChild(yetAnotherChild, 1);
      expect(parent.children[1]).toBe(yetAnotherChild);
      expect(parent.children[0]).toBe(anotherChild);
      expect(parent.children[2]).toBe(child);
    });

    test('the child input becomes an observed child of the parent', () => {
      expect.assertions(10);

      const parent = observe.root(new Input());
      const child = new Input();

      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(false);

      const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
        .then(() => {
          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(false);
        });

      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(false);
      expect(child.pending.has('method')).toBe(true);
      parent.addChild(child);
      expect(parent.isPending).toBe(true);
      expect(child.isPending).toBe(true);

      return promise;
    });

    test('the ascendants\' input pending state is updated', () => {
      expect.assertions(8);

      const parent = new Input();
      const child = new Input();

      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(false);
      child.onStartPending();
      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(true);
      parent.addChild(child);
      expect(parent.isInputPending).toBe(true);
      expect(child.isInputPending).toBe(true);
      child.onChange();
      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(false);
    });

    test('updates the dirty state on the root', () => {
      expect.assertions(8);

      const parent = new Input();
      const child = new Input();

      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(false);
      child.onChange(3);
      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(true);
      parent.addChild(child);
      expect(parent.isDirty).toBe(true);
      expect(child.isDirty).toBe(true);
      child.reset();
      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(false);
    });

    test('if the child is touched and parent is not, the parent doesn\'t become touched', () => {
      expect.assertions(12);

      const parent = new Input();
      const child = new Input();

      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(false);
      child.onChange();
      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(true);
      parent.addChild(child);
      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(true);
      child.reset();
      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(false);
      child.onChange();
      expect(parent.isTouched).toBe(true);
      expect(child.isTouched).toBe(true);
      parent.reset();
      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(false);
    });

    test('validates the root with the add event and the parent input as target', () => {
      expect.assertions(8);

      const parent = new Input({
        validate({input, event, target}) {
          expect(this).toBe(parent);
          expect(input).toBe(parent);
          expect(event).toBe('add');
          expect(target).toBe(parent);
        }
      });
      const child = new Input({
        validate({input, event, target}) {
          expect(this).toBe(child);
          expect(input).toBe(child);
          expect(event).toBe('add');
          expect(target).toBe(parent);
        }
      });

      parent.addChild(child);
    });

    test('first all the state is updated and then the validation is performed', () => {
      expect.assertions(22);

      const parent = observe.root(new Input());
      const child = new Input({
        name: 'child',
        validate({event}) {
          if (event === 'add') {
            expect(child.parent).toBe(parent);
            expect(child.root).toBe(parent);
            expect(parent.children[0]).toBe(child);
            expect(parent.get('child')).toBe(child);
            expect(child.pending.has('method')).toBe(true);
            expect(child.isPending).toBe(true);
            expect(parent.isPending).toBe(true);
            expect(child.isInputPending).toBe(true);
            expect(parent.isInputPending).toBe(true);
            expect(child.isDirty).toBe(true);
            expect(parent.isDirty).toBe(true);
          }
        }
      });

      child.onChange(3);
      child.onStartPending();
      observe.observe((() => Promise.resolve()), {key: 'method'}).call(child);
      expect(child.parent).toBe(undefined);
      expect(child.root).toBe(child);
      expect(parent.children).toBe(undefined);
      expect(parent.get('child')).toBe(undefined);
      expect(child.pending.has('method')).toBe(true);
      expect(child.isPending).toBe(false);
      expect(parent.isPending).toBe(false);
      expect(child.isInputPending).toBe(true);
      expect(parent.isInputPending).toBe(false);
      expect(child.isDirty).toBe(true);
      expect(parent.isDirty).toBe(false);
      parent.addChild(child);
    });

    test('the added input can be a Form instance', () => {
      expect.assertions(2);

      const parent = new Input();
      const child = new Form();

      expect(parent.children).toBe(undefined);
      parent.addChild(child);
      expect(parent.children[0]).toBe(child);
    });
  });

  describe('add', () => {
    test('throws if there are children with duplicate names', () => {
      expect.assertions(2);

      const parent = new Input({
        children: [{name: 'child'}]
      });

      expect(() => {
        parent.add({name: 'child'});
      }).toThrowError(Error);
      expect(() => {
        parent.add({name: 'child'});
      }).toThrowError('Duplicate child name: child');
    });

    test('sets the destination as the parent', () => {
      expect.assertions(1);

      const parent = new Input();

      parent.add({name: 'child'});
      expect(parent.get('child').parent).toBe(parent);
    });

    test('sets the parent\'s root as the root on the child input and its descendants', () => {
      expect.assertions(4);

      const root = new Input({
        children: [{}]
      });
      const [parent] = root.children;

      parent.add({
        name: 'child',
        children: [{
          name: 'grandChild'
        }]
      });

      expect(root.root).toBe(root);
      expect(parent.root).toBe(root);
      expect(parent.get('child').root).toBe(root);
      expect(parent.get('child').get('grandChild').root).toBe(root);
    });

    test('the resulted child input becomes a child of the parent', () => {
      expect.assertions(4);

      const parent = new Input();

      expect(parent.children).toBe(undefined);
      expect(parent.get('child')).toBe(undefined);
      parent.add({name: 'child'});
      expect(parent.children.length).toBe(1);
      expect(!!parent.get('child')).toBe(true);
    });

    test('if an index is passed the resulted child is inserted at that position', () => {
      expect.assertions(7);

      const parent = new Input();

      expect(parent.children).toBe(undefined);
      expect(parent.get('child')).toBe(undefined);
      parent.add({name: 'child'});
      expect(parent.children.length).toBe(1);
      expect(!!parent.get('child')).toBe(true);
      parent.add({});
      expect(parent.children.length).toBe(2);
      parent.add({name: 'anotherChild'}, 1);
      expect(parent.children[1].name).toBe('anotherChild');
      expect(parent.children.length).toBe(3);
    });

    test('the resulted child input becomes an observed child of the parent', () => {
      expect.assertions(8);

      const parent = observe.root(new Input());

      parent.add({name: 'child'});

      const child = parent.get('child');

      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(false);

      const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
        .then(() => {
          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(false);
        });

      expect(parent.isPending).toBe(true);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);

      return promise;
    });

    test('updates the dirty state on the root', () => {
      expect.assertions(3);

      let childValue = 0;
      const parent = new Input();

      expect(parent.isDirty).toBe(false);

      parent.add({
        name: 'child',
        getValue: () => ++childValue,
        setValue() {}
      });

      const child = parent.get('child');

      expect(parent.isDirty).toBe(true);
      expect(child.isDirty).toBe(true);
    });

    test('validates the root with the add event and the parent input as target', () => {
      expect.assertions(9);

      const parent = new Input({
        validate({input, event, target}) {
          expect(this).toBe(parent);
          expect(input).toBe(parent);
          expect(event).toBe('add');
          expect(target).toBe(parent);
        }
      });

      parent.add({
        name: 'child',
        validate({input, event, target}) {
          expect(!!parent.get('child')).toBe(true);
          expect(this).toBe(parent.get('child'));
          expect(input).toBe(parent.get('child'));
          expect(event).toBe('add');
          expect(target).toBe(parent);
        }
      });
    });

    test('first all the state is updated and then the validation is performed', () => {
      expect.assertions(15);

      const parent = observe.root(new Input());
      let childValue = 0;

      expect(parent.children).toBe(undefined);
      expect(parent.get('child')).toBe(undefined);
      expect(parent.isDirty).toBe(false);
      expect(parent.isPending).toBe(false);
      expect(parent.isInputPending).toBe(false);
      parent.add({
        name: 'child',
        getValue: () => {
          ++childValue;

          const child = parent.get('child');

          if (child) {
            // the child doesn't exist yet when getValue is called the first time
            parent.get('child').onStartPending();
            observe.observe((() => Promise.resolve()), {key: 'method'}).call(parent.get('child'));
          }

          return childValue;
        },
        setValue() {},
        validate({event}) {
          const child = parent.get('child');

          expect(event).toBe('add');
          expect(child.parent).toBe(parent);
          expect(child.root).toBe(parent);
          expect(parent.children.length).toBe(1);
          expect(child.isDirty).toBe(true);
          expect(parent.isDirty).toBe(true);
          expect(child.isPending).toBe(true);
          expect(parent.isPending).toBe(true);
          expect(child.isInputPending).toBe(true);
          expect(parent.isInputPending).toBe(true);
        }
      });
    });
  });

  describe('setRoot', () => {
    test('sets the root on the input and all its ascendants', () => {
      expect.assertions(6);

      const root = new Input({
        children: [{
          children: [{}]
        }]
      });
      const fakeRoot = {};

      expect(root.root).toBe(root);
      expect(root.children[0].root).toBe(root);
      expect(root.children[0].children[0].root).toBe(root);
      root.setRoot(fakeRoot);
      expect(root.root).toBe(fakeRoot);
      expect(root.children[0].root).toBe(fakeRoot);
      expect(root.children[0].children[0].root).toBe(fakeRoot);
    });
  });

  describe('removeChild', () => {
    test('throws if the parent doesn\'t have any children', () => {
      expect.assertions(3);

      const parent = new Input();
      const child = new Input();

      expect(parent.children).toBe(undefined);
      expect(() => {
        parent.removeChild(child);
      }).toThrowError(Error);
      expect(() => {
        parent.removeChild(child);
      }).toThrowError('Input doesn\'t have the child.');
    });

    test('throws if the child input is not a child of the parent', () => {
      expect.assertions(2);

      const parent = new Input({children: [{}]});
      const child = new Input();

      expect(() => {
        parent.removeChild(child);
      }).toThrowError(Error);
      expect(() => {
        parent.removeChild(child);
      }).toThrowError('Input doesn\'t have the child.');
    });

    test('the child input stops being a child of the parent', () => {
      expect.assertions(5);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.children[0]).toBe(child);
      expect(parent.get('child')).toBe(child);
      parent.removeChild(child);
      expect(parent.children.length).toBe(0);
      expect(parent.children[0]).toBe(undefined);
      expect(parent.get('child')).toBe(undefined);
    });

    test('the child input continues to be pending', () => {
      expect.assertions(11);

      const parent = observe.root(new Input({children: [{name: 'child'}]}));
      const [child] = parent.children;

      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(false);

      const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
        .then(() => {
          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(false);
        });

      expect(parent.isPending).toBe(true);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);
      parent.removeChild(child);
      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);

      return promise;
    });

    test('the child input stops being an observed child of the parent', () => {
      expect.assertions(17);

      const parent = observe.root(new Input({children: [{name: 'child'}]}));
      const [child] = parent.children;

      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(false);

      const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
        .then(() => {
          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(false);

          const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
            .then(() => {
              expect(parent.isPending).toBe(false);
              expect(child.isPending).toBe(false);
              expect(child.pending.has('method')).toBe(false);
            });

          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(true);

          return promise;
        });

      expect(parent.isPending).toBe(true);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);
      parent.removeChild(child);
      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);

      return promise;
    });

    test('the child input\'s parent is set to null', () => {
      expect.assertions(2);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(child.parent).toBe(parent);
      parent.removeChild(child);
      expect(child.parent).toBe(null);
    });

    test('sets the child input as the root on itself and its descendants', () => {
      expect.assertions(6);

      const root = new Input({
        children: [{
          name: 'child',
          children: [{
            name: 'grandChild'
          }]
        }]
      });
      const [child] = root.children;
      const [grandChild] = child.children;

      expect(root.root).toBe(root);
      expect(child.root).toBe(root);
      expect(grandChild.root).toBe(root);
      root.removeChild(child);
      expect(root.root).toBe(root);
      expect(child.root).toBe(child);
      expect(grandChild.root).toBe(child);
    });

    test('the input pending state of the old ascendants is updated', () => {
      expect.assertions(8);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(false);
      child.onStartPending();
      expect(parent.isInputPending).toBe(true);
      expect(child.isInputPending).toBe(true);
      parent.removeChild(child);
      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(true);
      child.onChange();
      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(false);
    });

    test('updates the dirty state on the old root', () => {
      expect.assertions(8);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(false);
      child.onChange(3);
      expect(parent.isDirty).toBe(true);
      expect(child.isDirty).toBe(true);
      parent.removeChild(child);
      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(true);
      child.reset();
      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(false);
    });

    test('if the child was the only touched input, the parent remains touched', () => {
      expect.assertions(10);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(false);
      child.onChange();
      expect(parent.isTouched).toBe(true);
      expect(child.isTouched).toBe(true);
      parent.removeChild(child);
      expect(parent.isTouched).toBe(true);
      expect(child.isTouched).toBe(true);
      child.reset();
      expect(parent.isTouched).toBe(true);
      expect(child.isTouched).toBe(false);
      parent.reset();
      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(false);
    });

    test('validates the old root with the remove event and the old parent input as target', () => {
      expect.assertions(4);

      const parent = new Input({
        validate({input, event, target}) {
          expect(this).toBe(parent);
          expect(input).toBe(parent);
          expect(event).toBe('remove');
          expect(target).toBe(parent);
        },
        children: [{name: 'child'}]
      });
      const [child] = parent.children;

      parent.removeChild(child);
    });

    test('the child is not validated when it\'s removed', () => {
      expect.assertions(5);

      const observation = jest.fn();
      const parent = new Input({
        validate({input, event, target}) {
          expect(this).toBe(parent);
          expect(input).toBe(parent);
          expect(event).toBe('remove');
          expect(target).toBe(parent);
        },
        children: [{
          name: 'child',
          validate: observation
        }]
      });
      const [child] = parent.children;

      parent.removeChild(child);
      expect(observation.mock.calls.length).toBe(0);
    });

    test('first all the state is updated and then the validation is performed', () => {
      expect.assertions(22);

      const parent = observe.root(new Input({
        validate({event}) {
          if (event === 'remove') {
            expect(child.parent).toBe(null);
            expect(child.root).toBe(child);
            expect(parent.children[0]).toBe(undefined);
            expect(parent.get('child')).toBe(undefined);
            expect(child.pending.has('method')).toBe(true);
            expect(child.isPending).toBe(true);
            expect(parent.isPending).toBe(false);
            expect(child.isInputPending).toBe(true);
            expect(parent.isInputPending).toBe(false);
            expect(child.isDirty).toBe(true);
            expect(parent.isDirty).toBe(false);
          }
        },
        children: [{name: 'child'}]
      }));
      const [child] = parent.children;

      child.onChange(3);
      child.onStartPending();
      observe.observe((() => Promise.resolve()), {key: 'method'}).call(child);
      expect(child.parent).toBe(parent);
      expect(child.root).toBe(parent);
      expect(parent.children[0]).toBe(child);
      expect(parent.get('child')).toBe(child);
      expect(child.pending.has('method')).toBe(true);
      expect(child.isPending).toBe(true);
      expect(parent.isPending).toBe(true);
      expect(child.isInputPending).toBe(true);
      expect(parent.isInputPending).toBe(true);
      expect(child.isDirty).toBe(true);
      expect(parent.isDirty).toBe(true);
      parent.removeChild(child);
    });

    test('the removed input can be a Form instance', () => {
      expect.assertions(2);

      const parent = new Input();
      const child = new Form();

      parent.addChild(child);
      expect(parent.children[0]).toBe(child);
      parent.removeChild(child);
      expect(parent.children[0]).toBe(undefined);
    });
  });

  describe('remove', () => {
    test('throws if the input doesn\'t have a parent', () => {
      expect.assertions(2);

      const child = new Input();

      expect(child.remove).toThrowError(Error);
      expect(child.remove).toThrowError('The input doesn\'t have a parent.');
    });

    test('throws if the parent doesn\'t have any children', () => {
      expect.assertions(3);

      const parent = new Input();
      const child = new Input();

      child.parent = parent;

      expect(child.parent.children).toBe(undefined);
      expect(child.remove).toThrowError(Error);
      expect(child.remove).toThrowError('Input doesn\'t have the child.');
    });

    test('throws if the child input is not a child of its parent', () => {
      expect.assertions(2);

      const parent = new Input({children: [{}]});
      const child = new Input();

      child.parent = parent;

      expect(child.remove).toThrowError(Error);
      expect(child.remove).toThrowError('Input doesn\'t have the child.');
    });

    test('the child input stops being a child of the parent', () => {
      expect.assertions(5);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.children[0]).toBe(child);
      expect(parent.get('child')).toBe(child);
      child.remove();
      expect(parent.children.length).toBe(0);
      expect(parent.children[0]).toBe(undefined);
      expect(parent.get('child')).toBe(undefined);
    });

    test('the child input continues to be pending', () => {
      expect.assertions(11);

      const parent = observe.root(new Input({children: [{name: 'child'}]}));
      const [child] = parent.children;

      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(false);

      const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
        .then(() => {
          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(false);
        });

      expect(parent.isPending).toBe(true);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);
      child.remove();
      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);

      return promise;
    });

    test('the child input stops being an observed child of the parent', () => {
      expect.assertions(17);

      const parent = observe.root(new Input({children: [{name: 'child'}]}));
      const [child] = parent.children;

      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(false);

      const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
        .then(() => {
          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(false);

          const promise = observe.observe((() => Promise.resolve()), {key: 'method'}).call(child)
            .then(() => {
              expect(parent.isPending).toBe(false);
              expect(child.isPending).toBe(false);
              expect(child.pending.has('method')).toBe(false);
            });

          expect(parent.isPending).toBe(false);
          expect(child.isPending).toBe(false);
          expect(child.pending.has('method')).toBe(true);

          return promise;
        });

      expect(parent.isPending).toBe(true);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);
      child.remove();
      expect(parent.isPending).toBe(false);
      expect(child.isPending).toBe(true);
      expect(child.pending.has('method')).toBe(true);

      return promise;
    });

    test('the child input\'s parent is set to null', () => {
      expect.assertions(2);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(child.parent).toBe(parent);
      child.remove();
      expect(child.parent).toBe(null);
    });

    test('sets the child input as the root on itself and its descendants', () => {
      expect.assertions(6);

      const root = new Input({
        children: [{
          name: 'child',
          children: [{
            name: 'grandChild'
          }]
        }]
      });
      const [child] = root.children;
      const [grandChild] = child.children;

      expect(root.root).toBe(root);
      expect(child.root).toBe(root);
      expect(grandChild.root).toBe(root);
      child.remove();
      expect(root.root).toBe(root);
      expect(child.root).toBe(child);
      expect(grandChild.root).toBe(child);
    });

    test('the input pending state of the old ascendants is updated', () => {
      expect.assertions(8);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(false);
      child.onStartPending();
      expect(parent.isInputPending).toBe(true);
      expect(child.isInputPending).toBe(true);
      child.remove();
      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(true);
      child.onChange();
      expect(parent.isInputPending).toBe(false);
      expect(child.isInputPending).toBe(false);
    });

    test('updates the dirty state on the old root', () => {
      expect.assertions(8);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(false);
      child.onChange(3);
      expect(parent.isDirty).toBe(true);
      expect(child.isDirty).toBe(true);
      child.remove();
      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(true);
      child.reset();
      expect(parent.isDirty).toBe(false);
      expect(child.isDirty).toBe(false);
    });

    test('if the child was the only touched input, the parent remains touched', () => {
      expect.assertions(10);

      const parent = new Input({children: [{name: 'child'}]});
      const [child] = parent.children;

      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(false);
      child.onChange();
      expect(parent.isTouched).toBe(true);
      expect(child.isTouched).toBe(true);
      child.remove();
      expect(parent.isTouched).toBe(true);
      expect(child.isTouched).toBe(true);
      child.reset();
      expect(parent.isTouched).toBe(true);
      expect(child.isTouched).toBe(false);
      parent.reset();
      expect(parent.isTouched).toBe(false);
      expect(child.isTouched).toBe(false);
    });

    test('validates the old root with the remove event and the old parent input as target', () => {
      expect.assertions(4);

      const parent = new Input({
        validate({input, event, target}) {
          expect(this).toBe(parent);
          expect(input).toBe(parent);
          expect(event).toBe('remove');
          expect(target).toBe(parent);
        },
        children: [{name: 'child'}]
      });
      const [child] = parent.children;

      child.remove();
    });

    test('the child is not validated when it\'s removed', () => {
      expect.assertions(5);

      const observation = jest.fn();
      const parent = new Input({
        validate({input, event, target}) {
          expect(this).toBe(parent);
          expect(input).toBe(parent);
          expect(event).toBe('remove');
          expect(target).toBe(parent);
        },
        children: [{
          name: 'child',
          validate: observation
        }]
      });
      const [child] = parent.children;

      child.remove();
      expect(observation.mock.calls.length).toBe(0);
    });

    test('first all the state is updated and then the validation is performed', () => {
      expect.assertions(22);

      const parent = observe.root(new Input({
        validate({event}) {
          if (event === 'remove') {
            expect(child.parent).toBe(null);
            expect(child.root).toBe(child);
            expect(parent.children[0]).toBe(undefined);
            expect(parent.get('child')).toBe(undefined);
            expect(child.pending.has('method')).toBe(true);
            expect(child.isPending).toBe(true);
            expect(parent.isPending).toBe(false);
            expect(child.isInputPending).toBe(true);
            expect(parent.isInputPending).toBe(false);
            expect(child.isDirty).toBe(true);
            expect(parent.isDirty).toBe(false);
          }
        },
        children: [{name: 'child'}]
      }));
      const [child] = parent.children;

      child.onChange(3);
      child.onStartPending();
      observe.observe((() => Promise.resolve()), {key: 'method'}).call(child);
      expect(child.parent).toBe(parent);
      expect(child.root).toBe(parent);
      expect(parent.children[0]).toBe(child);
      expect(parent.get('child')).toBe(child);
      expect(child.pending.has('method')).toBe(true);
      expect(child.isPending).toBe(true);
      expect(parent.isPending).toBe(true);
      expect(child.isInputPending).toBe(true);
      expect(parent.isInputPending).toBe(true);
      expect(child.isDirty).toBe(true);
      expect(parent.isDirty).toBe(true);
      child.remove();
    });

    test('the removed input can be a Form instance', () => {
      expect.assertions(2);

      const parent = new Input();
      const child = new Form();

      parent.addChild(child);
      expect(parent.children[0]).toBe(child);
      child.remove();
      expect(parent.children[0]).toBe(undefined);
    });
  });

  describe('isPendingBlocked', () => {
    test('if the input is input pending, it\'s pending blocked', () => {
      expect.assertions(6);

      const input = new Input();

      expect(input.isInputPending).toBe(false);
      expect(input.isPendingBlocked).toBe(false);
      input.onStartPending();
      expect(input.isInputPending).toBe(true);
      expect(input.isPendingBlocked).toBe(true);
      input.onChange();
      expect(input.isInputPending).toBe(false);
      expect(input.isPendingBlocked).toBe(false);
    });

    test('if preventInputPendingBlocking is true and the input is input pending, it\'s not'
      + ' pending blocked', () => {
      expect.assertions(6);

      const input = new Input({preventInputPendingBlocking: true});

      expect(input.isInputPending).toBe(false);
      expect(input.isPendingBlocked).toBe(false);
      input.onStartPending();
      expect(input.isInputPending).toBe(true);
      expect(input.isPendingBlocked).toBe(false);
      input.onChange();
      expect(input.isInputPending).toBe(false);
      expect(input.isPendingBlocked).toBe(false);
    });

    test('if the input is pending, it\'s pending blocked', () => {
      expect.assertions(6);

      const input = observe.root(new Input({
        actions: {
          method: () => Promise.resolve()
        }
      }));

      expect(input.isPending).toBe(false);
      expect(input.isPendingBlocked).toBe(false);

      const promise = input.actions.method().then(() => {
        expect(input.isPending).toBe(false);
        expect(input.isPendingBlocked).toBe(false);
      });

      expect(input.isPending).toBe(true);
      expect(input.isPendingBlocked).toBe(true);

      return promise;
    });

    test('if preventPendingBlocking is true and the input is pending, it\'s not'
      + ' pending blocked', () => {
      expect.assertions(6);

      const input = observe.root(new Input({
        preventPendingBlocking: true,
        actions: {
          method: () => Promise.resolve()
        }
      }));

      expect(input.isPending).toBe(false);
      expect(input.isPendingBlocked).toBe(false);

      const promise = input.actions.method().then(() => {
        expect(input.isPending).toBe(false);
        expect(input.isPendingBlocked).toBe(false);
      });

      expect(input.isPending).toBe(true);
      expect(input.isPendingBlocked).toBe(false);

      return promise;
    });
  });

  describe('isBlocked', () => {
    test('if the input is pending blocked, it\'s blocked', () => {
      expect.assertions(6);

      const input = new Input();

      expect(input.isPendingBlocked).toBe(false);
      expect(input.isBlocked).toBe(false);
      input.onStartPending();
      expect(input.isPendingBlocked).toBe(true);
      expect(input.isBlocked).toBe(true);
      input.onChange();
      expect(input.isPendingBlocked).toBe(false);
      expect(input.isBlocked).toBe(false);
    });

    test('if the input has errors, it\'s blocked', () => {
      expect.assertions(6);

      let hasErrors = true;
      const input = new Input({
        validate: () => {
          if (hasErrors) {
            hasErrors = false;

            return 'err';
          }
        }
      });

      expect(input.hasErrors).toBe(false);
      expect(input.isBlocked).toBe(false);
      input.validate();
      expect(input.hasErrors).toBe(true);
      expect(input.isBlocked).toBe(true);
      input.validate();
      expect(input.hasErrors).toBe(false);
      expect(input.isBlocked).toBe(false);
    });
  });

  describe('Form', () => {
    test('creates an input', () => {
      expect.assertions(41);

      const form = new Form();

      expect(form.name).toBe(undefined);
      expect(form.actions).toBe(undefined);
      expect(form.isDirty).toBe(false);
      expect(form.isTouched).toBe(false);
      expect(form.isInputPending).toBe(false);
      expect(form.isSubmitted).toBe(false);
      expect(form.hasErrors).toBe(false);
      expect(form.errors).toBe(null);
      expect(form.parent).toBe(undefined);
      expect(form.initialValue).toBe(undefined);
      expect(form.root).toBe(form);
      expect(form.value).toBe(undefined);
      expect(form.children).toBe(undefined);
      expect(form.isPendingBlocked).toBe(false);
      expect(typeof form.pending).toBe('object');
      expect(form.isPending).toBe(false);
      expect(form.isBlocked).toBe(false);
      expect(form.onFormChange).toBe(undefined);
      expect(Object.values(form).filter((value) => typeof value !== 'function').length).toBe(16);
      expect(Object.values(form).filter((value) => typeof value === 'function').length).toBe(17);

      const root = new Form();
      const config = {
        name: 'test',
        validate: () => 'error',
        init: () => {},
        actions: {},
        parent: root,
        root,
        onFormChange: () => {},
        preventInputPendingBlocking: true,
        preventPendingBlocking: true,
        getValue: () => 100,
        setValue: () => {},
        children: [{}],
        clearValue: 5
      };
      const form2 = new Form(config);

      expect(form2.name).toBe('test');
      expect(form2.actions).toBe(config.actions);
      expect(form2.isDirty).toBe(false);
      expect(form2.isTouched).toBe(false);
      expect(form2.isInputPending).toBe(false);
      expect(form2.isSubmitted).toBe(false);
      expect(form2.hasErrors).toBe(true);
      expect(form2.errors).toEqual(['error']);
      expect(form2.parent).toBe(root);
      expect(form2.initialValue).toBe(100);
      expect(form2.root).toBe(root);
      expect('value' in form2).toBe(false);
      expect(form2.children.length).toBe(1);
      expect(form2.isPendingBlocked).toBe(false);
      expect(typeof form2.pending).toBe('object');
      expect(form2.isPending).toBe(false);
      expect(form2.isBlocked).toBe(true);
      expect(typeof form2.onFormChange).toBe('function');
      expect(form2.validate === config.validate).toBe(false);
      expect(Object.values(form2).filter((value) => typeof value !== 'function').length).toBe(14);
      expect(Object.values(form2).filter((value) => typeof value === 'function').length).toBe(18);
    });

    test('does init validation', () => {
      expect.assertions(12);

      const observation = jest.fn();
      let validationInput;
      let validationTarget;
      let validationThis;
      let childValidationInput;
      let childValidationTarget;
      let childValidationThis;
      const form = new Form({
        root: new Input({
          validate: observation
        }),
        validate: function ({input, target, event}) {
          expect(event).toBe('init');

          validationInput = input;
          validationTarget = target;
          validationThis = this;

          return 'error';
        },
        children: [{
          validate({input, target, event}) {
            childValidationInput = input;
            childValidationTarget = target;
            childValidationThis = this;

            expect(event).toBe('init');
          }
        }]
      });

      expect(validationInput).toBe(form);
      expect(validationTarget).toBe(form);
      expect(validationThis).toBe(form);
      expect(childValidationInput).toBe(form.children[0]);
      expect(childValidationTarget).toBe(form);
      expect(childValidationThis).toBe(form.children[0]);
      expect(form.hasErrors).toBe(true);
      expect(form.errors).toEqual(['error']);
      expect(form.children[0].hasErrors).toBe(false);
      expect(observation.mock.calls.length).toBe(0);
    });

    test('Form can not be applied', () => {
      expect.assertions(2);
      expect(Form).toThrowError(Error);
      expect(Form).toThrowError('The observed constructor must be invoked with \'new\'.');
    });

    test('Form is observed', () => {
      expect.assertions(2);

      const observation = jest.fn();

      observe.on(observation);

      new Form({
        validate: () => {
          // the init validation is triggered after the Input is constructed
          // and since the observation was not called it means that the Form is
          // observed as well, not just the input, and that the observation
          // is done after the Form construction is finished
          expect(observation.mock.calls.length).toBe(0);
        }
      });
      // 1 observed construction
      expect(observation.mock.calls.length).toBe(1);
      observe.off(observation);
    });
  });
});
