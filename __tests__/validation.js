import {jest} from '@jest/globals';

import {Input} from '../src/form.js';
import * as validation from '../src/validation.js';

describe('validation', () => {
  describe('validation', () => {
    test('if there are no errors undefined is returned', () => {
      expect.assertions(1);
      expect(validation.validation()()).toBe(undefined);
    });

    test('first sync error is returned', () => {
      expect.assertions(1);
      expect(validation.validation(
        () => 'error',
        () => 'error2')()).toBe('error');
    });

    test('all promise errors are reported', () => {
      expect.assertions(1);

      return validation.validation(
        () => Promise.resolve('error1'),
        () => Promise.resolve(),
        () => Promise.resolve(['error2', 'error3']))().then((errors) => {
          expect(errors).toEqual(['error1', 'error2', 'error3']);
        });
    });

    test('if there is an async error, the result is always an array', () => {
      expect.assertions(1);

      return validation.validation(() => Promise.resolve('error'))().then((errors) => {
        expect(errors).toEqual(['error']);
      });
    });

    test('all promises are awaited', () => {
      expect.assertions(3);

      const validationFuncObservation = jest.fn();
      const promiseThenObservation = jest.fn();

      return validation.validation(
        () => Promise.resolve().then(() => Promise.resolve().then(() => {
          expect(promiseThenObservation.mock.calls.length).toBe(0);
          validationFuncObservation();
        })),
        () => Promise.resolve('error'))().then((errors) => {
          // 1 observed function call
          expect(validationFuncObservation.mock.calls.length).toBe(1);
          expect(errors).toEqual(['error']);
          promiseThenObservation();
        });
    });

    test('if sync error, async validations are ignored and the rest of the async validation'
      + ' functions are not called', () => {
      expect.assertions(3);

      const firstValidationFuncObservation = jest.fn();
      const thirdValidationFuncObservation = jest.fn();

      expect(validation.validation(
        () => {
          firstValidationFuncObservation();

          return Promise.resolve('async error1');
        },
        () => 'sync error',
        () => {
          thirdValidationFuncObservation();

          return Promise.resolve('async error3');
        })()).toBe('sync error');
      // 1 observed function call
      expect(firstValidationFuncObservation.mock.calls.length).toBe(1);
      expect(thirdValidationFuncObservation.mock.calls.length).toBe(0);
    });

    test('integration with required', () => {
      expect.assertions(1);
      expect(validation.validation(
        () => null,
        validation.required())({
          input: new Input({
            getValue: () => '',
            setValue() {}
          }),
          event: 'submit'
        })).toBe('Required');
    });

    test('integration with async', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      return validation.validation(
        () => null,
        validation.async(() => Promise.resolve('error')))({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toEqual(['error']);
        });
    });

    test('integration with required and async', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.validation(
        validation.async(() => Promise.resolve('error')),
        validation.required({events: ['change']}))({
          input,
          target: input,
          event: 'change'
        })).toBe('Required');
    });

    test('older validation finishes earlier because of newer quicker validation', () => {
      expect.assertions(4);

      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      let isValidatingSlowly = true;
      const input = new Input();
      const validationFunc = validation.validation(() => {
        if (isValidatingSlowly) {
          isValidatingSlowly = false;

          slowValidationObservation();

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve()).then(() => {
              finalSlowValidationObservation();
            });
        }

        return Promise.resolve('error');
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toEqual(['error']);
      });

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toEqual(['error']);
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });
    });

    test('older validation finishes earlier because of sync validation', () => {
      expect.assertions(4);

      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      let isAsyncValidation = true;
      const input = new Input();
      const validationFunc = validation.validation(() => {
        if (isAsyncValidation) {
          isAsyncValidation = false;

          slowValidationObservation();

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve()).then(() => {
              finalSlowValidationObservation();
            });
        }

        return 'error';
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });

      expect(validationFunc({
        input,
        target: input,
        event: 'change'
      })).toBe('error');

      return promise;
    });
  });

  describe('validate', () => {
    test('invalid default submit', () => {
      expect.assertions(1);
      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Invalid');
    });

    test('valid default submit', () => {
      expect.assertions(1);
      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'submit',
        input: new Input({
          getValue: () => 'test',
          setValue() {}
        })
      })).toBe(null);
    });

    test('blur is default event with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'blur',
        input,
        target: input
      })).toBe('Invalid');
    });

    test('ignored error on unknown event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate(
        (value) => value === 'test' ? null : 'Invalid',
        {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Invalid');
    });

    test('error on non-submit event is ignored if target is not input', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'blur',
        input
      })).toBe(undefined);
      expect(validation.validate(
        ({input}) => input.getValue() === 'test' ? null : 'Invalid',
        {events: ['custom']})({
        event: 'custom',
        input
      })).toBe(undefined);
    });

    test('custom target can be provided', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });
      const target = new Input();

      expect(validation.validate(
        ({input}) => input.getValue() === 'test' ? null : 'Invalid',
        {target: () => target})({
        event: 'blur',
        input,
        target
      })).toBe('Invalid');
      expect(validation.validate(
        ({input}) => input.getValue() === 'test' ? null : 'Invalid',
        {
          events: ['custom'],
          target: () => target
        })({
        event: 'custom',
        input,
        target
      })).toBe('Invalid');
    });

    test('if validation error changes it replaces the existing error', () => {
      expect.assertions(6);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.validate(({input}) =>
        input.getValue() === 'test' ? null : validationMessage);

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Another validation message');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Another validation message');

      inputValue = 'test';

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(3);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.validate(({input}) =>
        input.getValue() === 'test' ? null : 'Invalid');

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      inputValue = 'test';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('error is reported with unrecognized event and with different target when ignoreEvent'
      + ' is true', () => {
      expect.assertions(1);
      expect(validation.validate(
        ({input}) => input.getValue() === 'test' ? null : 'Invalid',
        {ignoreEvent: true})({
        event: 'custom',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Invalid');
    });

    test('default events can be changed', () => {
      expect.assertions(3);

      validation.validate.events = ['custom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'custom',
        input,
        target: input
      })).toBe('Invalid');

      inputValue = 'test';

      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'custom',
        input,
        target: input
      })).toBe(null);

      delete validation.validate.events;

      inputValue = 0;

      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('changed default events can be overwritten', () => {
      expect.assertions(2);

      validation.validate.events = ['defaultCustom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid')({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);

      expect(validation.validate(
        ({input}) => input.getValue() === 'test' ? null : 'Invalid',
        {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Invalid');

      delete validation.validate.events;
    });

    test('submit event is still considered even if default events are overwritten', () => {
      expect.assertions(1);

      expect(
        validation.validate(({input}) => input.getValue() === 'test' ? null : 'Invalid',
        {events: ['custom']})({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        }),
      })).toBe('Invalid');
    });
  });

  describe('required', () => {
    test('undefined is required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Required');
    });

    test('null is required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe('Required');
    });

    test('empty string is required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Required');
    });

    test('0 is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe(null);
    });

    test('space is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => ' ',
          setValue() {}
        })
      })).toBe(null);
    });

    test('false is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => false,
          setValue() {}
        })
      })).toBe(null);
    });

    test('NaN is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => NaN,
          setValue() {}
        })
      })).toBe(null);
    });

    test('a symbol is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => Symbol(),
          setValue() {}
        })
      })).toBe(null);
    });

    test('default message is used', () => {
      expect.assertions(1);

      validation.required.message = () => 'Custom required message';

      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Custom required message');

      delete validation.required.message;
    });

    test('the default message receives the right arguments', () => {
      expect.assertions(5);

      const testInput = new Input({
        getValue() {return null;},
        setValue() {}
      });
      const targetInput = new Input();

      validation.required.message = ({value, input, event, target}) => {
        expect(value).toBe(null);
        expect(input).toBe(testInput);
        expect(target).toBe(targetInput);
        expect(event).toBe('submit');

        return 'Custom required message';
      };

      expect(validation.required()({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Custom required message');

      delete validation.required.message;
    });

    test('option message is used', () => {
      expect.assertions(1);
      expect(validation.required({
        message: () => 'Option required message'
      })({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Option required message');
    });

    test('option message receieves the right arguments', () => {
      expect.assertions(5);

      const testInput = new Input({
        getValue() {return null;},
        setValue() {}
      });
      const targetInput = new Input();

      expect(validation.required({
        message: ({value, input, event, target}) => {
          expect(value).toBe(null);
          expect(input).toBe(testInput);
          expect(target).toBe(targetInput);
          expect(event).toBe('submit');

          return 'Option required message';
        }
      })({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Option required message');
    });

    test('option message overwrites required.message', () => {
      expect.assertions(1);

      validation.required.message = () => 'Custom required message';

      expect(validation.required({
        message: () => 'Overwriting option required message'
      })({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Overwriting option required message');

      delete validation.required.message;
    });

    test('required validation on submit', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe('Required');
    });

    test('required validation on blur with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => null,
        setValue() {}
      });

      expect(validation.required()({
        event: 'blur',
        input,
        target: input
      })).toBe('Required');
    });

    test('no required validation on blur without input as target', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'blur',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('no required validation on other events', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'custom',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('if validation error changes it replaces the existing error', () => {
      expect.assertions(6);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.required();

      validation.required.message = () => validationMessage;

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Another validation message');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Another validation message');

      inputValue = 'test';

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);

      delete validation.required.message;
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(3);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.required();

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Required');

      inputValue = 'test';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('custom events can be used', () => {
      expect.assertions(1);

      const input = new Input();

      expect(validation.required({events: ['custom']})({
        input,
        event: 'custom',
        target: input
      })).toBe('Required');
    });

    test('the default events can be changed', () => {
      expect.assertions(1);

      validation.required.events = ['custom'];

      const input = new Input();

      expect(validation.required()({
        input,
        event: 'custom',
        target: input
      })).toBe('Required');

      delete validation.required.events;
    });

    test('the default events can be overwritten', () => {
      expect.assertions(1);

      validation.required.events = ['customDefault'];

      const input = new Input();

      expect(validation.required({events: ['custom']})({
        input,
        event: 'custom',
        target: input
      })).toBe('Required');

      delete validation.required.events;
    });

    test('if events are not customized, the validate defaults are used', () => {
      expect.assertions(2);

      validation.validate.events = ['custom'];

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.required()({
        input,
        event: 'custom',
        target: input
      })).toBe('Required');

      validation.required.events = ['blur'];

      expect(validation.required()({
        input,
        event: 'custom',
        target: input
      })).toBe(undefined);

      delete validation.validate.events;
      delete validation.required.events;
    });

    test('the events can be ignored and validation always performed', () => {
      expect.assertions(1);

      const input = new Input();

      expect(validation.required({ignoreEvent: true})({
        input,
        event: 'custom',
        target: input
      })).toBe('Required');
    });

    test('submit event is still considered even if default events are overwritten', () => {
      expect.assertions(1);

      const input = new Input();

      expect(validation.required({events: ['custom']})({
        input,
        event: 'submit',
        target: input
      })).toBe('Required');
    });
  });

  describe('min', () => {
    test('less value is invalid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Minimum allowed is 3');
    });

    test('greater value is valid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(-3)({
        input,
        event: 'blur',
        target: input
      })).toBe(null);
    });

    test('equal value is valid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => -3,
        setValue() {}
      });

      expect(validation.min(-3)({
        input,
        event: 'blur',
        target: input
      })).toBe(null);
    });

    test('non-numbers are not validated', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => null,
        setValue() {}
      });

      expect(validation.min(3)({
        input,
        event: 'blur',
        target: input
      })).toBe(null);
    });

    test('default message is used', () => {
      expect.assertions(1);

      validation.min.message = ({value, minValue}) =>
        `Custom message: ${value} less than ${minValue}`;

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Custom message: 0 less than 3');

      delete validation.min.message;
    });

    test('the default message receives the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return 0;},
        setValue() {}
      });
      const targetInput = new Input();

      validation.min.message = ({minValue, value, input, event, target}) => {
        expect(minValue).toBe(3);
        expect(value).toBe(0);
        expect(input).toBe(testInput);
        expect(target).toBe(targetInput);
        expect(event).toBe('submit');

        return 'Custom min message';
      };

      expect(validation.min(3)({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Custom min message');

      delete validation.min.message;
    });

    test('option message is used', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3, {
        message: ({value, minValue}) => `Option message: ${value} less than ${minValue}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Option message: 0 less than 3');
    });

    test('option message receieves the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return 0;},
        setValue() {}
      });
      const targetInput = new Input();

      expect(validation.min(3, {
        message: ({minValue, value, input, event, target}) => {
          expect(minValue).toBe(3);
          expect(value).toBe(0);
          expect(input).toBe(testInput);
          expect(target).toBe(targetInput);
          expect(event).toBe('submit');

          return 'Option min message';
        }
      })({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Option min message');
    });

    test('option message overwrites min.message', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      validation.min.message = () => 'Custom min message';

      expect(validation.min(3, {
        message: ({value, minValue}) =>
          `Overwritting message: ${value} less than ${minValue}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Overwritting message: 0 less than 3');

      delete validation.min.message;
    });

    test('invalid default submit', () => {
      expect.assertions(1);
      expect(validation.min(3)({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Minimum allowed is 3');
    });

    test('valid default submit', () => {
      expect.assertions(1);
      expect(validation.min(3)({
        event: 'submit',
        input: new Input({
          getValue: () => 4,
          setValue() {}
        })
      })).toBe(null);
    });

    test('blur is default event with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3)({
        event: 'blur',
        input,
        target: input
      })).toBe('Minimum allowed is 3');
    });

    test('ignored error on unknown event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Minimum allowed is 3');
    });

    test('error on non-submit event is ignored if target is not input', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3)({
        event: 'blur',
        input
      })).toBe(undefined);
      expect(validation.min(3, {events: ['custom']})({
        event: 'custom',
        input
      })).toBe(undefined);
    });

    test('if validation error changes it replaces the existing error', () => {
      expect.assertions(6);

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.min(3, {message: () => validationMessage});

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Another validation message');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Another validation message');

      inputValue = 3;

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(3);

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.min(3);

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Minimum allowed is 3');

      inputValue = 3;

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('error is reported with unrecognized event and with different target when ignoreEvent'
      + ' is true', () => {
      expect.assertions(1);
      expect(validation.min(3, {ignoreEvent: true})({
        event: 'custom',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Minimum allowed is 3');
    });

    test('default events can be changed', () => {
      expect.assertions(3);

      validation.min.events = ['custom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.min(3)({
        event: 'custom',
        input,
        target: input
      })).toBe('Minimum allowed is 3');

      inputValue = 3;

      expect(validation.min(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(null);

      delete validation.min.events;

      inputValue = 0;

      expect(validation.min(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('changed default events can be overwritten', () => {
      expect.assertions(2);

      validation.min.events = ['defaultCustom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.min(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);

      expect(validation.min(3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Minimum allowed is 3');

      delete validation.min.events;
    });

    test('if events are not customized, the validate defaults are used', () => {
      expect.assertions(2);

      validation.validate.events = ['custom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.min(3)({
        input,
        event: 'custom',
        target: input
      })).toBe('Minimum allowed is 3');

      validation.min.events = ['blur'];

      expect(validation.min(3)({
        input,
        event: 'custom',
        target: input
      })).toBe(undefined);

      delete validation.validate.events;
      delete validation.min.events;
    });

    test('the events can be ignored and validation always performed', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.min(3, {ignoreEvent: true})({
        input,
        event: 'custom',
        target: input
      })).toBe('Minimum allowed is 3');
    });

    test('submit event is still considered even if default events are overwritten', () => {
      expect.assertions(1);

      expect(
        validation.min(3, {events: ['custom']})({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        }),
      })).toBe('Minimum allowed is 3');
    });
  });

  describe('max', () => {
    test('greater value is invalid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(-3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Maximum allowed is -3');
    });

    test('less value is valid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(3)({
        input,
        event: 'blur',
        target: input
      })).toBe(null);
    });

    test('equal value is valid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 3,
        setValue() {}
      });

      expect(validation.max(3)({
        input,
        event: 'blur',
        target: input
      })).toBe(null);
    });

    test('non-numbers are not validated', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => null,
        setValue() {}
      });

      expect(validation.max(-3)({
        input,
        event: 'blur',
        target: input
      })).toBe(null);
    });

    test('default message is used', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      validation.max.message = ({value, maxValue}) =>
        `Custom message: ${value} greater than ${maxValue}`;

      expect(validation.max(-3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Custom message: 0 greater than -3');

      delete validation.max.message;
    });

    test('the default message receives the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return 0;},
        setValue() {}
      });
      const targetInput = new Input();

      validation.max.message = ({maxValue, value, input, event, target}) => {
        expect(maxValue).toBe(-3);
        expect(value).toBe(0);
        expect(input).toBe(testInput);
        expect(target).toBe(targetInput);
        expect(event).toBe('submit');

        return 'Custom max message';
      };

      expect(validation.max(-3)({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Custom max message');

      delete validation.max.message;
    });

    test('option message is used', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(-3, {
        message: ({value, maxValue}) => `Option message: ${value} greater than ${maxValue}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Option message: 0 greater than -3');
    });

    test('option message receieves the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return 0;},
        setValue() {}
      });
      const targetInput = new Input();

      expect(validation.max(-3, {
        message: ({maxValue, value, input, event, target}) => {
          expect(maxValue).toBe(-3);
          expect(value).toBe(0);
          expect(input).toBe(testInput);
          expect(target).toBe(targetInput);
          expect(event).toBe('submit');

          return 'Option max message';
        }
      })({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Option max message');
    });

    test('option message overwrites max.message', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      validation.max.message = () => 'Custom max message';

      expect(validation.max(-3, {
        message: ({value, maxValue}) =>
          `Overwritting message: ${value} greater than ${maxValue}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Overwritting message: 0 greater than -3');

      delete validation.max.message;
    });

    test('invalid default submit', () => {
      expect.assertions(1);
      expect(validation.max(-3)({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Maximum allowed is -3');
    });

    test('valid default submit', () => {
      expect.assertions(1);
      expect(validation.max(-3)({
        event: 'submit',
        input: new Input({
          getValue: () => -4,
          setValue() {}
        })
      })).toBe(null);
    });

    test('blur is default event with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(-3)({
        event: 'blur',
        input,
        target: input
      })).toBe('Maximum allowed is -3');
    });

    test('ignored error on unknown event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(-3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(-3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Maximum allowed is -3');
    });

    test('error on non-submit event is ignored if target is not input', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(-3)({
        event: 'blur',
        input
      })).toBe(undefined);
      expect(validation.max(-3, {events: ['custom']})({
        event: 'custom',
        input
      })).toBe(undefined);
    });

    test('if validation error changes it replaces the existing error', () => {
      expect.assertions(6);

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.max(-3, {message: () => validationMessage});

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Another validation message');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Another validation message');

      inputValue = -3;

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(3);

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.max(-3);

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Maximum allowed is -3');

      inputValue = -3;

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('error is reported with unrecognized event and with different target when ignoreEvent'
      + ' is true', () => {
      expect.assertions(1);
      expect(validation.max(-3, {ignoreEvent: true})({
        event: 'custom',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Maximum allowed is -3');
    });

    test('default events can be changed', () => {
      expect.assertions(3);

      validation.max.events = ['custom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.max(-3)({
        event: 'custom',
        input,
        target: input
      })).toBe('Maximum allowed is -3');

      inputValue = -3;

      expect(validation.max(-3)({
        event: 'custom',
        input,
        target: input
      })).toBe(null);

      delete validation.max.events;

      inputValue = 0;

      expect(validation.max(-3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('changed default events can be overwritten', () => {
      expect.assertions(2);

      validation.max.events = ['defaultCustom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.max(-3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);

      expect(validation.max(-3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Maximum allowed is -3');

      delete validation.max.events;
    });

    test('if events are not customized, the validate defaults are used', () => {
      expect.assertions(2);

      validation.validate.events = ['custom'];

      let inputValue = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.max(-3)({
        input,
        event: 'custom',
        target: input
      })).toBe('Maximum allowed is -3');

      validation.max.events = ['blur'];

      expect(validation.max(-3)({
        input,
        event: 'custom',
        target: input
      })).toBe(undefined);

      delete validation.validate.events;
      delete validation.max.events;
    });

    test('the events can be ignored and validation always performed', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.max(-3, {ignoreEvent: true})({
        input,
        event: 'custom',
        target: input
      })).toBe('Maximum allowed is -3');
    });

    test('submit event is still considered even if default events are overwritten', () => {
      expect.assertions(1);

      expect(
        validation.max(-3, {events: ['custom']})({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        }),
      })).toBe('Maximum allowed is -3');
    });
  });

  describe('minLength', () => {
    test('less length is invalid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.minLength(3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Minimum allowed length is 3');
    });

    test('greater length is valid', () => {
      expect.assertions(1);
      expect(validation.minLength(-3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe(null);
    });

    test('equal length is valid', () => {
      expect.assertions(1);
      expect(validation.minLength(-3)({
        input: new Input({
          getValue: () => -3,
          setValue() {}
        })
      })).toBe(null);
    });

    test('non-strings are not validated', () => {
      expect.assertions(1);
      expect(validation.minLength(3)({
        input: new Input({
          getValue: () => 1,
          setValue() {}
        })
      })).toBe(null);
    });

    test('default message is used', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      validation.minLength.message = ({value, minLength}) =>
        `Custom message: ${value.length} less than ${minLength}`;

      expect(validation.minLength(3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Custom message: 0 less than 3');

      delete validation.minLength.message;
    });

    test('the default message receives the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return '';},
        setValue() {}
      });
      const targetInput = new Input();

      validation.minLength.message = ({minLength, value, input, event, target}) => {
        expect(minLength).toBe(3);
        expect(value).toBe('');
        expect(input).toBe(testInput);
        expect(target).toBe(targetInput);
        expect(event).toBe('submit');

        return 'Custom minLength message';
      };

      expect(validation.minLength(3)({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Custom minLength message');

      delete validation.minLength.message;
    });

    test('option message is used', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.minLength(3, {
        message: ({value, minLength}) =>
          `Option message: ${value.length} less than ${minLength}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Option message: 0 less than 3');
    });

    test('option message receieves the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return '';},
        setValue() {}
      });
      const targetInput = new Input();

      expect(validation.minLength(3, {
        message: ({minLength, value, input, event, target}) => {
          expect(minLength).toBe(3);
          expect(value).toBe('');
          expect(input).toBe(testInput);
          expect(target).toBe(targetInput);
          expect(event).toBe('submit');

          return 'Option minLength message';
        }
      })({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Option minLength message');
    });

    test('option message overwrites minLength.message', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      validation.minLength.message = () => 'Custom min length message';

      expect(validation.minLength(3, {
        message: ({value, minLength}) =>
          `Overwritting message: ${value.length} less than ${minLength}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Overwritting message: 0 less than 3');

      delete validation.minLength.message;
    });

    test('invalid default submit', () => {
      expect.assertions(1);
      expect(validation.minLength(3)({
        event: 'submit',
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Minimum allowed length is 3');
    });

    test('valid default submit', () => {
      expect.assertions(1);
      expect(validation.minLength(3)({
        event: 'submit',
        input: new Input({
          getValue: () => 'abcd',
          setValue() {}
        })
      })).toBe(null);
    });

    test('blur is default event with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.minLength(3)({
        event: 'blur',
        input,
        target: input
      })).toBe('Minimum allowed length is 3');
    });

    test('ignored error on unknown event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.minLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.minLength(3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Minimum allowed length is 3');
    });

    test('error on non-submit event is ignored if target is not input', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.minLength(3)({
        event: 'blur',
        input
      })).toBe(undefined);
      expect(validation.minLength(3, {events: ['custom']})({
        event: 'custom',
        input
      })).toBe(undefined);
    });

    test('if validation error changes it replaces the existing error', () => {
      expect.assertions(6);

      let inputValue = '';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.minLength(3, {message: () => validationMessage});

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Another validation message');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Another validation message');

      inputValue = 'abcd';

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(3);

      let inputValue = '';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.minLength(3);

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Minimum allowed length is 3');

      inputValue = 'abcd';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('error is reported with unrecognized event and with different target when ignoreEvent'
      + ' is true', () => {
      expect.assertions(1);
      expect(validation.minLength(3, {ignoreEvent: true})({
        event: 'custom',
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Minimum allowed length is 3');
    });

    test('default events can be changed', () => {
      expect.assertions(3);

      validation.minLength.events = ['custom'];

      let inputValue = '';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.minLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe('Minimum allowed length is 3');

      inputValue = 'abcd';

      expect(validation.minLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(null);

      delete validation.minLength.events;

      inputValue = '';

      expect(validation.minLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('changed default events can be overwritten', () => {
      expect.assertions(2);

      validation.minLength.events = ['defaultCustom'];

      let inputValue = '';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.minLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);

      expect(validation.minLength(3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Minimum allowed length is 3');

      delete validation.minLength.events;
    });

    test('if events are not customized, the validate defaults are used', () => {
      expect.assertions(2);

      validation.validate.events = ['custom'];

      let inputValue = '';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.minLength(3)({
        input,
        event: 'custom',
        target: input
      })).toBe('Minimum allowed length is 3');

      validation.minLength.events = ['blur'];

      expect(validation.minLength(3)({
        input,
        event: 'custom',
        target: input
      })).toBe(undefined);

      delete validation.validate.events;
      delete validation.minLength.events;
    });

    test('the events can be ignored and validation always performed', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation.minLength(3, {ignoreEvent: true})({
        input,
        event: 'custom',
        target: input
      })).toBe('Minimum allowed length is 3');
    });

    test('submit event is still considered even if default events are overwritten', () => {
      expect.assertions(1);

      expect(
        validation.minLength(3, {events: ['custom']})({
        event: 'submit',
        input: new Input({
          getValue: () => '',
          setValue() {}
        }),
      })).toBe('Minimum allowed length is 3');
    });
  });

  describe('maxLength', () => {
    test('greater length is invalid', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcd',
        setValue() {}
      });

      expect(validation.maxLength(3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Maximum allowed length is 3');
    });

    test('less length is valid', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 'ab',
          setValue() {}
        })
      })).toBe(null);
    });

    test('equal length is valid', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 'abc',
          setValue() {}
        })
      })).toBe(null);
    });

    test('non-strings are not validated', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 1234,
          setValue() {}
        })
      })).toBe(null);
    });

    test('default message is used', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcd',
        setValue() {}
      });

      validation.maxLength.message = ({value, maxLength}) =>
        `Custom message: ${value.length} greater than ${maxLength}`;

      expect(validation.maxLength(3)({
        input,
        event: 'blur',
        target: input
      })).toBe('Custom message: 4 greater than 3');

      delete validation.maxLength.message;
    });

    test('the default message receives the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return 'abcd';},
        setValue() {}
      });
      const targetInput = new Input();

      validation.maxLength.message = ({maxLength, value, input, event, target}) => {
        expect(maxLength).toBe(3);
        expect(value).toBe('abcd');
        expect(input).toBe(testInput);
        expect(target).toBe(targetInput);
        expect(event).toBe('submit');

        return 'Custom maxLength message';
      };

      expect(validation.maxLength(3)({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Custom maxLength message');

      delete validation.maxLength.message;
    });

    test('option message is used', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcd',
        setValue() {}
      });

      expect(validation.maxLength(3, {
        message: ({value, maxLength}) =>
          `Option message: ${value.length} greater than ${maxLength}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Option message: 4 greater than 3');
    });

    test('option message receieves the right arguments', () => {
      expect.assertions(6);

      const testInput = new Input({
        getValue() {return 'abcd';},
        setValue() {}
      });
      const targetInput = new Input();

      expect(validation.maxLength(3, {
        message: ({maxLength, value, input, event, target}) => {
          expect(maxLength).toBe(3);
          expect(value).toBe('abcd');
          expect(input).toBe(testInput);
          expect(target).toBe(targetInput);
          expect(event).toBe('submit');

          return 'Option maxLength message';
        }
      })({
        event: 'submit',
        input: testInput,
        target: targetInput
      })).toBe('Option maxLength message');
    });

    test('option message overwrites maxLength.message', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcd',
        setValue() {}
      });

      validation.maxLength.message = () => 'Custom max length message';

      expect(validation.maxLength(3, {
        message: ({value, maxLength}) =>
          `Overwritting message: ${value.length} greater than ${maxLength}`
      })({
        input,
        event: 'blur',
        target: input
      })).toBe('Overwritting message: 4 greater than 3');

      delete validation.maxLength.message;
    });

    test('invalid default submit', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        event: 'submit',
        input: new Input({
          getValue: () => 'abcde',
          setValue() {}
        })
      })).toBe('Maximum allowed length is 3');
    });

    test('valid default submit', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        event: 'submit',
        input: new Input({
          getValue: () => 'ab',
          setValue() {}
        })
      })).toBe(null);
    });

    test('blur is default event with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcde',
        setValue() {}
      });

      expect(validation.maxLength(3)({
        event: 'blur',
        input,
        target: input
      })).toBe('Maximum allowed length is 3');
    });

    test('ignored error on unknown event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcde',
        setValue() {}
      });

      expect(validation.maxLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcde',
        setValue() {}
      });

      expect(validation.maxLength(3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Maximum allowed length is 3');
    });

    test('error on non-submit event is ignored if target is not input', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 'abcde',
        setValue() {}
      });

      expect(validation.maxLength(3)({
        event: 'blur',
        input
      })).toBe(undefined);
      expect(validation.maxLength(3, {events: ['custom']})({
        event: 'custom',
        input
      })).toBe(undefined);
    });

    test('if validation error changes it replaces the existing error', () => {
      expect.assertions(6);

      let inputValue = 'abcde';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.maxLength(3, {message: () => validationMessage});

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Another validation message');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Another validation message');

      inputValue = 'ab';

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(3);

      let inputValue = 'abcde';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.maxLength(3);

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Maximum allowed length is 3');

      inputValue = 'ab';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('error is reported with unrecognized event and with different target when ignoreEvent'
      + ' is true', () => {
      expect.assertions(1);
      expect(validation.maxLength(3, {ignoreEvent: true})({
        event: 'custom',
        input: new Input({
          getValue: () => 'abcde',
          setValue() {}
        })
      })).toBe('Maximum allowed length is 3');
    });

    test('default events can be changed', () => {
      expect.assertions(3);

      validation.maxLength.events = ['custom'];

      let inputValue = 'abcde';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.maxLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe('Maximum allowed length is 3');

      inputValue = 'ab';

      expect(validation.maxLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(null);

      delete validation.maxLength.events;

      inputValue = 'abcde';

      expect(validation.maxLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('changed default events can be overwritten', () => {
      expect.assertions(2);

      validation.maxLength.events = ['defaultCustom'];

      let inputValue = 'abcde';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.maxLength(3)({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);

      expect(validation.maxLength(3, {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Maximum allowed length is 3');

      delete validation.maxLength.events;
    });

    test('if events are not customized, the validate defaults are used', () => {
      expect.assertions(2);

      validation.validate.events = ['custom'];

      let inputValue = 'abcd';
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      expect(validation.maxLength(2)({
        input,
        event: 'custom',
        target: input
      })).toBe('Maximum allowed length is 2');

      validation.maxLength.events = ['blur'];

      expect(validation.maxLength(2)({
        input,
        event: 'custom',
        target: input
      })).toBe(undefined);

      delete validation.validate.events;
      delete validation.maxLength.events;
    });

    test('the events can be ignored and validation always performed', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 'abcd',
        setValue() {}
      });

      expect(validation.maxLength(2, {ignoreEvent: true})({
        input,
        event: 'custom',
        target: input
      })).toBe('Maximum allowed length is 2');
    });

    test('submit event is still considered even if default events are overwritten', () => {
      expect.assertions(1);

      expect(
        validation.maxLength(3, {events: ['custom']})({
        event: 'submit',
        input: new Input({
          getValue: () => 'abcde',
          setValue() {}
        }),
      })).toBe('Maximum allowed length is 3');
    });
  });

  describe('async', () => {
    test('if the validation func doesn\'t return a promise an error is thrown', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      expect(() => validation.async(() => 'error')({
        input,
        target: input,
        event: 'change'
      })).toThrowError(Error);
    });

    test('valid input with default change event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 3,
        setValue() {}
      });

      return validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe(null);
      });
    });

    test('invalid input with default change event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 4,
        setValue() {}
      });

      return validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
      });
    });

    test('valid input with custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 3,
        setValue() {}
      });

      return validation.async(
        (value) => Promise.resolve(value === 3 ? null : 'error'),
        {events: ['custom']})({
        input,
        target: input,
        event: 'custom'
      }).then((err) => {
        expect(err).toBe(null);
      });
    });

    test('invalid input with custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });

      return validation.async(
        (value) => Promise.resolve(value === 3 ? null : 'error'),
        {events: ['custom']})({
        input,
        target: input,
        event: 'custom'
      }).then((err) => {
        expect(err).toBe('error');
      });
    });

    test('the default events can be changed', () => {
      expect.assertions(1);

      validation.async.events = ['custom'];

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });

      return validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'custom'
      }).then((err) => {
        expect(err).toBe('error');

        delete validation.async.events;
      });
    });

    test('the default events can be overwritten', () => {
      expect.assertions(1);

      validation.async.events = ['customDefault'];

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });

      return validation.async(
        (value) => Promise.resolve(value === 3 ? null : 'error'),
        {events: ['custom']})({
        input,
        target: input,
        event: 'custom'
      }).then((err) => {
        expect(err).toBe('error');

        delete validation.async.events;
      });
    });

    test('ignored event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => undefined,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input
      })).toBe(undefined);
    });

    test('ignored submit event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => undefined,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'submit'
      })).toBe(undefined);
    });

    test('ignored event with value other than the undefined value that validation.async'
      + ' initially has', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 3,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input
      })).toBe(null);
    });

    test('ignored change event when target is not the input', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => undefined,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        event: 'change'
      })).toBe(undefined);
    });

    test('if validation is skipped the existing error is used', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(validationFunc({input})).toBe('error');
      });
    });

    test('ignored event with changed value', () => {
      expect.assertions(2);

      let inputValue = 2;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');

        inputValue = 8;

        expect(validationFunc({
          input,
          target: input
        })).toBe(null);
      });
    });

    test('more recent value not reported as invalid because of old invalid value', () => {
      expect.assertions(4);

      let inputValue = 2;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');

        const promise = validationFunc({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toBe(null);
          expect(input.getValue()).toBe(3);
        });

        inputValue = 3;

        expect(validationFunc({
          input,
          target: input
        })).toBe(null);

        return promise;
      });
    });

    test('pending validation sets the old error to null', () => {
      expect.assertions(4);

      let inputValue = 2;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');

        const promise = validationFunc({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toBe('error');
          expect(input.getValue()).toBe(2);
        });

        expect(validationFunc({input})).toBe(null);

        return promise;
      });
    });

    test('rejection is ignored', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => Promise.reject());

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).catch(() => {
        expect(validationFunc({input})).toBe(null);
      });
    });

    test('multiple pending validations', () => {
      expect.assertions(1);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => Promise.resolve(`error${++errorCount}`));

      return Promise.all([
        validationFunc({
          input,
          target: input,
          event: 'change'
        }),
        validationFunc({
          input,
          target: input,
          event: 'change'
        })
      ]).then((errors) => {
        expect(errors).toEqual(['error2', 'error2']);
      });
    });

    test('two temporally separate validations', () => {
      expect.assertions(2);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => Promise.resolve(`error${++errorCount}`));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error1');

        return validationFunc({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toBe('error2');
        });
      });
    });

    test('ignored later settled validation', () => {
      expect.assertions(1);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        if (!errorCount) {
          return Promise.resolve().then(() => `error${++errorCount}`);
        }

        return Promise.resolve(`error${++errorCount}`);
      });

      return Promise.all([
        validationFunc({
          input,
          target: input,
          event: 'change'
        }),
        validationFunc({
          input,
          target: input,
          event: 'change'
        })
      ]).then((result) => {
        expect(result).toEqual(['error2', 'error2']);
      });
    });

    test('ignored slow rejected validation', () => {
      expect.assertions(2);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        if (!errorCount) {
          const err = `error${++errorCount}`;

          return Promise.resolve().then(() => Promise.reject(err));
        }

        return Promise.resolve(`error${++errorCount}`);
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error2');
      });

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error2');
      });
    });

    test('slower previous validations are not awaited', () => {
      expect.assertions(2);

      const observation = jest.fn();
      let isValidatingSlowly = true;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        if (isValidatingSlowly) {
          isValidatingSlowly = false;

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => {
              observation();
            });
        }

        return Promise.resolve('error');
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(observation.mock.calls.length).toBe(0);
      });

      return promise;
    });

    test('older validation finishes earlier because of newer quicker validation', () => {
      expect.assertions(4);

      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      let isValidatingSlowly = true;
      const input = new Input();
      const validationFunc = validation.async(() => {
        if (isValidatingSlowly) {
          isValidatingSlowly = false;

          slowValidationObservation();

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve()).then(() => {
              finalSlowValidationObservation();
            });
        }

        return Promise.resolve('error');
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
      });

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });
    });

    test('older validation finishes earlier when value is changed and the new validation'
      + ' is ignored', () => {
      expect.assertions(4);

      let inputValue = 2;
      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        slowValidationObservation();

        return Promise
          .resolve()
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve()).then(() => {
            finalSlowValidationObservation();
          });
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe(null);
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });

      inputValue = 3;

      expect(validationFunc({input})).toBe(null);

      return promise;
    });

    test('ignored event doesn\'t finish pending validation earlier', () => {
      expect.assertions(4);

      let inputValue = 2;
      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        slowValidationObservation();

        return Promise
          .resolve()
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve()).then(() => {
            finalSlowValidationObservation();

            return 'err';
          });
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('err');
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(1);
      });

      expect(validationFunc({input})).toBe(null);

      return promise;
    });

    test('if value changes after the validation was initiated the error is ignored', () => {
      expect.assertions(1);

      let inputValue = 4;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      const promise = validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe(null);
      });

      inputValue = 5;

      return promise;
    });

    test('if the validation function returns a falsy value and the input value is different'
      + ' from the old value, the error is cleared', async () => {
      expect.assertions(2);

      let inputValue = 4;
      let skipAsyncValidation = false;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      const asyncValiationFunc = validation.async(
        (value) => skipAsyncValidation ? null : Promise.resolve(value === 3 ? null : 'error'),
        {events: ['blur']});

      await asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      }).then((err) => {
        expect(err).toBe('error');
      });

      skipAsyncValidation = true;
      inputValue = 5;

      expect(asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      })).toBe(null);
    });

    test('if the validation function returns a falsy value and the input value didn\'t change'
      + ' the error is preserved', async () => {
      expect.assertions(2);

      let inputValue = 4;
      let skipAsyncValidation = false;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      const asyncValiationFunc = validation.async(
        (value) => skipAsyncValidation ? null : Promise.resolve(value === 3 ? null : 'error'),
        {events: ['blur']});

      await asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      }).then((err) => {
        expect(err).toBe('error');
      });

      skipAsyncValidation = true;

      expect(asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      })).toBe('error');
    });

    test('if the validation function returns a falsy value and the input value is different'
      + ' from the old value, the pending validation is cancelled', async () => {
      expect.assertions(3);

      let inputValue = 4;
      let skipAsyncValidation = false;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      const asyncValiationFunc = validation.async(
        (value) => skipAsyncValidation ? null : Promise.resolve(value === 3 ? null : 'error'),
        {events: ['blur']});

      await asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      }).then((err) => {
        expect(err).toBe('error');
      });

      const promise = asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      }).then((err) => {
        expect(err).toBe(null);
      });

      skipAsyncValidation = true;
      inputValue = 5;

      expect(asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      })).toBe(null);

      return promise;
    });

    test('if the validation function returns a falsy value and the input value didn\'t change'
      + ' the pending validation is not cancelled', async () => {
      expect.assertions(3);

      let inputValue = 4;
      let skipAsyncValidation = false;
      let validationWithErrorsCount = 0;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      const asyncValiationFunc = validation.async(
        (value) => skipAsyncValidation
          ? null :
          Promise.resolve(value === 3
            ? null
            : ++validationWithErrorsCount === 1
              ? 'error'
              : 'error2'),
        {events: ['blur']});

      await asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      }).then((err) => {
        expect(err).toBe('error');
      });

      const promise = asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      }).then((err) => {
        expect(err).toBe('error2');
      });

      skipAsyncValidation = true;

      // the second async validation sets the error to null
      expect(asyncValiationFunc({
        input,
        target: input,
        event: 'blur'
      })).toBe(null);

      return promise;
    });
  });
});
