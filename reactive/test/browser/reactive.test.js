/* eslint-disable react/display-name */
import { createElement, render, Component } from 'preact';
import { component, signal, computed } from 'preact/reactive';
import { setupRerender } from 'preact/test-utils';
import { setupScratch, teardown } from '../../../test/_util/helpers';

/** @jsx createElement */

describe('Reactive', () => {
	/** @type {HTMLDivElement} */
	let scratch;

	/** @type {() => void} */
	let rerender;

	beforeEach(() => {
		scratch = setupScratch();
		rerender = setupRerender();
	});

	afterEach(() => {
		teardown(scratch);
	});

	describe('component', () => {
		it('should pass props', () => {
			let usedProps;
			const App = component(props => {
				usedProps = props;
				return () => <div />;
			});

			render(<App foo="foo" />, scratch);
			expect(usedProps).to.deep.equal({ foo: 'foo' });

			render(<App bar="bar" />, scratch);
			expect(usedProps).to.deep.equal({ bar: 'bar' });
		});

		it('should not call unsubscribed computed atoms', () => {
			let count = 0;
			const App = component(() => {
				computed(() => count++);
				return () => <div />;
			});

			render(<App />, scratch);
			expect(count).to.equal(0);

			render(<App foo="foo" />, scratch);
			expect(count).to.equal(0);
		});

		it('should unsubscribe from stale subscriptions', () => {
			let update;
			let updateFoo;

			let count = 0;
			const App = component(() => {
				const [num, setNum] = signal(0, 'num');
				const [foo, setFoo] = signal('foo', 'foo');
				const [bar] = signal('bar', 'bar');

				update = setNum;
				updateFoo = setFoo;

				return () => {
					count++;
					const v = num.value % 2 === 0 ? foo.value : bar.value;
					return <div>{v}</div>;
				};
			});

			render(<App />, scratch);
			expect(scratch.innerHTML).to.equal('<div>foo</div>');

			update(1);
			rerender();
			expect(count).to.equal(2);

			updateFoo('foo2');
			rerender();
			expect(count).to.equal(2);
			expect(scratch.innerHTML).to.equal('<div>bar</div>');
		});

		describe('displayName', () => {
			it('should set default if none specified', () => {
				const App = component(() => {
					return () => <div>foo</div>;
				});

				render(<App />, scratch);
				const atom =
					scratch._children._children[0]._component.__reactive._list[0];
				expect(atom.displayName).to.match(/^ReactiveComponent_\d+$/);
			});

			it('should use function name', () => {
				const App = component(function Foo() {
					return () => <div>foo</div>;
				});

				render(<App />, scratch);
				const atom =
					scratch._children._children[0]._component.__reactive._list[0];
				expect(atom.displayName).to.match(/^Foo_\d+$/);
			});

			it('should use component displayName', () => {
				const App = component(function Foo() {
					return () => <div>foo</div>;
				});
				App.displayName = 'App';

				render(<App />, scratch);
				const atom =
					scratch._children._children[0]._component.__reactive._list[0];
				expect(atom.displayName).to.match(/^Foo_\d+$/);
			});
		});
	});

	describe('signals', () => {
		it('should render signal value', () => {
			const App = component(() => {
				const [name] = signal('foo');
				return () => <div>{name.value}</div>;
			});

			render(<App />, scratch);
			expect(scratch.innerHTML).to.equal('<div>foo</div>');
		});

		describe('displayName', () => {
			it('should set default if none specified', () => {
				let atom;
				const App = component(() => {
					const [name] = signal('foo');
					atom = name;
					return () => <div>{name.value}</div>;
				});

				render(<App />, scratch);
				expect(atom.displayName).to.match(/^_\d+$/);
			});

			it('should use passed value', () => {
				let atom;
				const App = component(() => {
					const [name] = signal('foo', 'foo');
					atom = name;
					return () => <div>{name.value}</div>;
				});

				render(<App />, scratch);
				expect(atom.displayName).to.match(/^foo_\d+$/);
			});
		});

		describe('updater', () => {
			it('should update signal value', () => {
				let update;
				const App = component(() => {
					const [name, setName] = signal('foo');
					update = setName;
					return () => <div>{name.value}</div>;
				});

				render(<App />, scratch);
				update('bar');
				rerender();
				expect(scratch.innerHTML).to.equal('<div>bar</div>');
			});

			it('should update signal via updater function', () => {
				let update;
				const App = component(() => {
					const [name, setName] = signal('foo');
					update = setName;
					return () => <div>{name.value}</div>;
				});

				render(<App />, scratch);
				update(prev => prev + 'bar');
				rerender();
				expect(scratch.innerHTML).to.equal('<div>foobar</div>');
			});

			it('should abort signal update in updater function', () => {
				let update;
				const App = component(() => {
					const [name, setName] = signal('foo');
					update = setName;
					return () => <div>{name.value}</div>;
				});

				render(<App />, scratch);
				update(() => null);
				rerender();
				expect(scratch.innerHTML).to.equal('<div>foo</div>');
			});
		});
	});

	describe('computed', () => {
		describe('displayName', () => {
			it('should use default if not specified', () => {
				let atom;
				const App = component(() => {
					const [name] = signal('foo');
					const bar = computed(() => name.value);
					atom = bar;
					return () => <div>{bar.value}</div>;
				});

				render(<App />, scratch);
				expect(atom.displayName).to.match(/^_\d+$/);
			});

			it('should use passed name', () => {
				let atom;
				const App = component(() => {
					const [name] = signal('foo');
					const bar = computed(() => name.value, 'bar');
					atom = bar;
					return () => <div>{bar.value}</div>;
				});

				render(<App />, scratch);
				expect(atom.displayName).to.match(/^bar_\d+$/);
			});
		});
	});
});
