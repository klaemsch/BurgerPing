
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Style.svelte generated by Svelte v3.44.3 */

    function create_fragment$b(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Style', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Style> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Style extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Style",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\components\input\TextInput.svelte generated by Svelte v3.44.3 */

    const file$a = "src\\components\\input\\TextInput.svelte";

    // (17:2) {#if label}
    function create_if_block$2(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[1]);
    			attr_dev(label_1, "for", /*label*/ ctx[1]);
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$a, 17, 4, 379);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 2) set_data_dev(t, /*label*/ ctx[1]);

    			if (dirty & /*label*/ 2) {
    				attr_dev(label_1, "for", /*label*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(17:2) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let input_type_value;
    	let if_block = /*label*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", input_type_value = /*number*/ ctx[2] ? "number" : "text");
    			attr_dev(input, "name", "input");
    			attr_dev(input, "id", /*label*/ ctx[1]);
    			attr_dev(input, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			add_location(input, file$a, 22, 4, 542);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$a, 21, 2, 488);
    			add_location(div1, file$a, 15, 0, 353);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*number*/ 4 && input_type_value !== (input_type_value = /*number*/ ctx[2] ? "number" : "text")) {
    				attr_dev(input, "type", input_type_value);
    			}

    			if (dirty & /*label*/ 2) {
    				attr_dev(input, "id", /*label*/ ctx[1]);
    			}

    			if (dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextInput', slots, []);
    	let { placeholder } = $$props;
    	let { label } = $$props;
    	let { number = false } = $$props;
    	let { value } = $$props;
    	const writable_props = ['placeholder', 'label', 'number', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('number' in $$props) $$invalidate(2, number = $$props.number);
    		if ('value' in $$props) $$invalidate(3, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ placeholder, label, number, value });

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('number' in $$props) $$invalidate(2, number = $$props.number);
    		if ('value' in $$props) $$invalidate(3, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeholder, label, number, value];
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			placeholder: 0,
    			label: 1,
    			number: 2,
    			value: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*placeholder*/ ctx[0] === undefined && !('placeholder' in props)) {
    			console.warn("<TextInput> was created without expected prop 'placeholder'");
    		}

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<TextInput> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[3] === undefined && !('value' in props)) {
    			console.warn("<TextInput> was created without expected prop 'value'");
    		}
    	}

    	get placeholder() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\Select.svelte generated by Svelte v3.44.3 */

    const file$9 = "src\\components\\input\\Select.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (13:8) {#each options as option}
    function create_each_block$1(ctx) {
    	let option;
    	let t0_value = /*option*/ ctx[2].text + "";
    	let t0;
    	let t1;
    	let option_value_value;
    	let option_selected_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*option*/ ctx[2].value;
    			option.value = option.__value;
    			option.selected = option_selected_value = /*option*/ ctx[2].value === /*selected*/ ctx[1];
    			add_location(option, file$9, 13, 16, 486);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 1 && t0_value !== (t0_value = /*option*/ ctx[2].text + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*options*/ 1 && option_value_value !== (option_value_value = /*option*/ ctx[2].value)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}

    			if (dirty & /*options, selected*/ 3 && option_selected_value !== (option_selected_value = /*option*/ ctx[2].value === /*selected*/ ctx[1])) {
    				prop_dev(option, "selected", option_selected_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(13:8) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let select;
    	let each_value = /*options*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "id", "select");
    			attr_dev(select, "name", "select");
    			attr_dev(select, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 bg-transparent text-gray-500 text-sm border-gray-300 rounded-md");
    			add_location(select, file$9, 7, 4, 216);
    			attr_dev(div, "class", "flex items-center");
    			add_location(div, file$9, 5, 0, 115);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*options, selected*/ 3) {
    				each_value = /*options*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Select', slots, []);
    	let { options = [] } = $$props;
    	let { selected } = $$props;
    	const writable_props = ['options', 'selected'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('options' in $$props) $$invalidate(0, options = $$props.options);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ options, selected });

    	$$self.$inject_state = $$props => {
    		if ('options' in $$props) $$invalidate(0, options = $$props.options);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [options, selected];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { options: 0, selected: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selected*/ ctx[1] === undefined && !('selected' in props)) {
    			console.warn("<Select> was created without expected prop 'selected'");
    		}
    	}

    	get options() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\TimePicker.svelte generated by Svelte v3.44.3 */
    const file$8 = "src\\components\\input\\TimePicker.svelte";

    // (37:4) {#if label}
    function create_if_block$1(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(label_1, "for", "s");
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$8, 37, 8, 594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(37:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let select0;
    	let t1;
    	let span;
    	let t3;
    	let select1;
    	let current;
    	let if_block = /*label*/ ctx[0] && create_if_block$1(ctx);

    	select0 = new Select({
    			props: {
    				options: /*hours*/ ctx[1].map(func),
    				selected: /*hours*/ ctx[1][/*currentHour*/ ctx[3]]
    			},
    			$$inline: true
    		});

    	select1 = new Select({
    			props: { options: /*minutes*/ ctx[2].map(func_1) },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			create_component(select0.$$.fragment);
    			t1 = space();
    			span = element("span");
    			span.textContent = ":";
    			t3 = space();
    			create_component(select1.$$.fragment);
    			attr_dev(span, "class", "m-2");
    			add_location(span, file$8, 43, 8, 877);
    			attr_dev(div0, "class", "mt-1 flex justify-left");
    			attr_dev(div0, "id", "s");
    			add_location(div0, file$8, 41, 4, 713);
    			add_location(div1, file$8, 35, 0, 562);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(select0, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(div0, t3);
    			mount_component(select1, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div1, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select0.$$.fragment, local);
    			transition_in(select1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select0.$$.fragment, local);
    			transition_out(select1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_component(select0);
    			destroy_component(select1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = hour => ({ text: hour, value: hour });
    const func_1 = minute => ({ text: minute, value: minute });

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TimePicker', slots, []);
    	let { label = null } = $$props;

    	const hours = [
    		"00",
    		"01",
    		"02",
    		"03",
    		"04",
    		"05",
    		"06",
    		"07",
    		"08",
    		"09",
    		"10",
    		"11",
    		"12",
    		"13",
    		"14",
    		"15",
    		"16",
    		"17",
    		"18",
    		"19",
    		"20",
    		"21",
    		"22",
    		"23",
    		"24"
    	];

    	const minutes = ["00", "15", "30", "45"];
    	const currentDate = new Date();
    	const currentHour = currentDate.getHours();
    	const currentMinute = currentDate.getMinutes();
    	const writable_props = ['label'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimePicker> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({
    		Select,
    		label,
    		hours,
    		minutes,
    		currentDate,
    		currentHour,
    		currentMinute
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, hours, minutes, currentHour];
    }

    class TimePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimePicker",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get label() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\DatePicker.svelte generated by Svelte v3.44.3 */

    const file$7 = "src\\components\\input\\DatePicker.svelte";

    // (6:4) {#if label}
    function create_if_block(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(label_1, "for", /*label*/ ctx[0]);
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$7, 6, 8, 165);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);

    			if (dirty & /*label*/ 1) {
    				attr_dev(label_1, "for", /*label*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(6:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let if_block = /*label*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "date");
    			input.value = /*today*/ ctx[1];
    			attr_dev(input, "id", "label");
    			attr_dev(input, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300");
    			add_location(input, file$7, 11, 8, 348);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$7, 10, 4, 290);
    			attr_dev(div1, "class", "flex flex-col");
    			add_location(div1, file$7, 4, 0, 111);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DatePicker', slots, []);
    	let { label = null } = $$props;
    	const today = new Date().toISOString().slice(0, 10);
    	const writable_props = ['label'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DatePicker> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({ label, today });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, today];
    }

    class DatePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DatePicker",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get label() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Panel.svelte generated by Svelte v3.44.3 */
    const file$6 = "src\\components\\Panel.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let datepicker;
    	let t0;
    	let timepicker;
    	let t1;
    	let textinput0;
    	let t2;
    	let textinput1;
    	let t3;
    	let textinput2;
    	let current;

    	datepicker = new DatePicker({
    			props: { label: "Datum" },
    			$$inline: true
    		});

    	timepicker = new TimePicker({
    			props: { label: "Uhrzeit" },
    			$$inline: true
    		});

    	textinput0 = new TextInput({
    			props: {
    				number: true,
    				label: "Personen",
    				value: "1",
    				placeholder: "1"
    			},
    			$$inline: true
    		});

    	textinput1 = new TextInput({
    			props: {
    				label: "Name",
    				placeholder: "Maximilian Erhardt"
    			},
    			$$inline: true
    		});

    	textinput2 = new TextInput({
    			props: {
    				label: "Email",
    				placeholder: "maximilian.erhardt@stud.uni-hannover.de"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(datepicker.$$.fragment);
    			t0 = space();
    			create_component(timepicker.$$.fragment);
    			t1 = space();
    			create_component(textinput0.$$.fragment);
    			t2 = space();
    			create_component(textinput1.$$.fragment);
    			t3 = space();
    			create_component(textinput2.$$.fragment);
    			attr_dev(div, "class", "flex flex-col px-20 py-10 gap-5");
    			add_location(div, file$6, 6, 0, 224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(datepicker, div, null);
    			append_dev(div, t0);
    			mount_component(timepicker, div, null);
    			append_dev(div, t1);
    			mount_component(textinput0, div, null);
    			append_dev(div, t2);
    			mount_component(textinput1, div, null);
    			append_dev(div, t3);
    			mount_component(textinput2, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			transition_in(timepicker.$$.fragment, local);
    			transition_in(textinput0.$$.fragment, local);
    			transition_in(textinput1.$$.fragment, local);
    			transition_in(textinput2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			transition_out(timepicker.$$.fragment, local);
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(textinput2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(datepicker);
    			destroy_component(timepicker);
    			destroy_component(textinput0);
    			destroy_component(textinput1);
    			destroy_component(textinput2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Panel', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ TextInput, TimePicker, DatePicker });
    	return [];
    }

    class Panel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\typography\Title.svelte generated by Svelte v3.44.3 */

    const file$5 = "src\\components\\typography\\Title.svelte";

    function create_fragment$5(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "font-sans font-bold text-xl");
    			add_location(p, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Title', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.44.3 */
    const file$4 = "src\\components\\Header.svelte";

    // (6:4) <Title>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("BurgerPing");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(6:4) <Title>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let header;
    	let img;
    	let img_src_value;
    	let t;
    	let title;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			img = element("img");
    			t = space();
    			create_component(title.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "./burger.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "BurgerPing Logo");
    			attr_dev(img, "width", 50);
    			attr_dev(img, "class", "rounded");
    			add_location(img, file$4, 4, 4, 160);
    			attr_dev(header, "class", "flex flex-row items-center border-b-2 border-gray-100 py-3");
    			add_location(header, file$4, 3, 0, 79);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, img);
    			append_dev(header, t);
    			mount_component(title, header, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(title);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Title });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const TABLE_SIZE = 30;
    const CHAIR_HEIGHT = 10;
    const CHAIR_WIDTH = 20;

    /* src\components\furniture\Chair.svelte generated by Svelte v3.44.3 */
    const file$3 = "src\\components\\furniture\\Chair.svelte";

    function create_fragment$3(ctx) {
    	let rect;

    	const block = {
    		c: function create() {
    			rect = svg_element("rect");
    			attr_dev(rect, "width", CHAIR_WIDTH);
    			attr_dev(rect, "height", CHAIR_HEIGHT);
    			attr_dev(rect, "x", /*x*/ ctx[0]);
    			attr_dev(rect, "y", /*y*/ ctx[1]);
    			attr_dev(rect, "rx", 2);
    			attr_dev(rect, "ry", 2);
    			attr_dev(rect, "class", "chair");
    			add_location(rect, file$3, 5, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, rect, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x*/ 1) {
    				attr_dev(rect, "x", /*x*/ ctx[0]);
    			}

    			if (dirty & /*y*/ 2) {
    				attr_dev(rect, "y", /*y*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chair', slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	const writable_props = ['x', 'y'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chair> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    	};

    	$$self.$capture_state = () => ({ CHAIR_WIDTH, CHAIR_HEIGHT, x, y });

    	$$self.$inject_state = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [x, y];
    }

    class Chair extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { x: 0, y: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chair",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !('x' in props)) {
    			console.warn("<Chair> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !('y' in props)) {
    			console.warn("<Chair> was created without expected prop 'y'");
    		}
    	}

    	get x() {
    		throw new Error("<Chair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Chair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Chair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Chair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\furniture\Table.svelte generated by Svelte v3.44.3 */
    const file$2 = "src\\components\\furniture\\Table.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let chair0;
    	let rect;
    	let chair1;
    	let current;
    	chair0 = new Chair({ props: { x: 5, y: 0 }, $$inline: true });
    	chair1 = new Chair({ props: { x: 5, y: 40 }, $$inline: true });

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			create_component(chair0.$$.fragment);
    			rect = svg_element("rect");
    			create_component(chair1.$$.fragment);
    			attr_dev(rect, "width", TABLE_SIZE);
    			attr_dev(rect, "height", TABLE_SIZE);
    			attr_dev(rect, "x", 0);
    			attr_dev(rect, "y", 10);
    			attr_dev(rect, "rx", 2);
    			attr_dev(rect, "ry", 2);
    			attr_dev(rect, "class", "table");
    			add_location(rect, file$2, 6, 4, 224);
    			attr_dev(svg, "width", TABLE_SIZE);
    			attr_dev(svg, "height", TABLE_SIZE + 2 * CHAIR_HEIGHT);
    			add_location(svg, file$2, 4, 0, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			mount_component(chair0, svg, null);
    			append_dev(svg, rect);
    			mount_component(chair1, svg, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chair0.$$.fragment, local);
    			transition_in(chair1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chair0.$$.fragment, local);
    			transition_out(chair1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_component(chair0);
    			destroy_component(chair1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Table', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ TABLE_SIZE, CHAIR_HEIGHT, Chair });
    	return [];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Seating.svelte generated by Svelte v3.44.3 */
    const file$1 = "src\\components\\Seating.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (79:4) {#each tables as table}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let tabledouble;
    	let t;
    	let current;
    	tabledouble = new Table({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(tabledouble.$$.fragment);
    			t = space();
    			attr_dev(div0, "class", "svelte-jfioeh");
    			toggle_class(div0, "rotated", /*table*/ ctx[9].rotate);
    			add_location(div0, file$1, 80, 12, 2966);
    			attr_dev(div1, "class", "flex justify-center");
    			attr_dev(div1, "style", /*computeGridProperties*/ ctx[1](/*table*/ ctx[9].start, /*table*/ ctx[9].span));
    			add_location(div1, file$1, 79, 8, 2864);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(tabledouble, div0, null);
    			append_dev(div1, t);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabledouble.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabledouble.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(tabledouble);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(79:4) {#each tables as table}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	let each_value = /*tables*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "flex-1 grid items-center p-3 svelte-jfioeh");
    			attr_dev(div, "id", "grid-container");
    			set_style(div, "--cell-size", TABLE_SIZE + "px");
    			add_location(div, file$1, 77, 0, 2727);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*computeGridProperties, tables*/ 3) {
    				each_value = /*tables*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const SVG_IS_VERTICAL = true;

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Seating', slots, []);
    	var Direction;

    	(function (Direction) {
    		Direction[Direction["HORIZONTAL"] = 0] = "HORIZONTAL";
    		Direction[Direction["VERTICAL"] = 1] = "VERTICAL";
    	})(Direction || (Direction = {}));

    	const h = Direction.HORIZONTAL;
    	const v = Direction.VERTICAL;

    	const lineV = (start, count, direction = h) => {
    		const factor = direction === v ? 3 : 1;
    		return Array(count).fill(0).map((_, i) => [start.x, start.y + i * factor, direction]);
    	};

    	const lineH = (start, count, direction = v) => {
    		const factor = direction === v ? 1 : 3;
    		return Array(count).fill(0).map((_, i) => [start.x + i * factor, start.y, direction]);
    	};

    	// Creates two vertically aligned double tables with spacing in between.
    	const doubleWithSpace = (start, direction) => {
    		const isVert = direction === v;
    		const line = isVert ? lineV : lineH;

    		return [
    			...line(start, 2),
    			...line(
    				{
    					x: start.x + (isVert ? 0 : 4),
    					y: start.y + (isVert ? 4 : 0)
    				},
    				2
    			)
    		];
    	};

    	const tableData = [
    		// === Inside ===
    		// top line
    		...lineH({ x: 2, y: 1 }, 4, h),
    		// left line
    		...lineV({ x: 1, y: 4 }, 3, v),
    		// middle top line
    		...doubleWithSpace({ x: 6, y: 6 }, h),
    		...doubleWithSpace({ x: 12, y: 6 }, h),
    		// middle bottom line
    		...doubleWithSpace({ x: 6, y: 9 }, h),
    		...doubleWithSpace({ x: 12, y: 9 }, h),
    		// bottom line
    		...lineH({ x: 7, y: 12 }, 4, h),
    		// left
    		...doubleWithSpace({ x: 22, y: 6 }, h),
    		...doubleWithSpace({ x: 22, y: 9 }, h),
    		...lineH({ x: 23, y: 12 }, 2, h),
    		// === Outside ===
    		// left line
    		...lineV({ x: 1, y: 16 }, 2, v),
    		...lineV({ x: 5, y: 16 }, 2, v),
    		...doubleWithSpace({ x: 9, y: 15 }, v),
    		...doubleWithSpace({ x: 14, y: 15 }, v),
    		...lineV({ x: 18, y: 16 }, 2, v),
    		...doubleWithSpace({ x: 24, y: 15 }, v)
    	];

    	const tables = tableData.map(([x, y, dir, disabled]) => {
    		const isVert = dir === Direction.VERTICAL;

    		return {
    			start: {
    				x: isVert ? x : x - 1,
    				y: isVert ? y - 1 : y
    			},
    			span: {
    				width: isVert ? 1 : 3,
    				height: isVert ? 3 : 1
    			},
    			rotate: SVG_IS_VERTICAL !== isVert,
    			disabled
    		};
    	});

    	const computeGridProperties = (start, span) => `
        grid-column: ${start.x + 1} / span ${span.width};
        grid-row: ${start.y + 1} / span ${span.height};
    `;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Seating> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		TABLE_SIZE,
    		TableDouble: Table,
    		SVG_IS_VERTICAL,
    		Direction,
    		h,
    		v,
    		lineV,
    		lineH,
    		doubleWithSpace,
    		tableData,
    		tables,
    		computeGridProperties
    	});

    	$$self.$inject_state = $$props => {
    		if ('Direction' in $$props) Direction = $$props.Direction;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tables, computeGridProperties];
    }

    class Seating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Seating",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.3 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let globalstyle;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let div2;
    	let div0;
    	let seatingplan;
    	let t2;
    	let div1;
    	let panel;
    	let current;
    	globalstyle = new Style({ $$inline: true });
    	header = new Header({ $$inline: true });
    	seatingplan = new Seating({ $$inline: true });
    	panel = new Panel({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(globalstyle.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(seatingplan.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			create_component(panel.$$.fragment);
    			attr_dev(div0, "class", "flex flex-1 bg-gray-100");
    			add_location(div0, file, 10, 2, 336);
    			attr_dev(div1, "class", "flex flex-1");
    			add_location(div1, file, 13, 2, 407);
    			attr_dev(div2, "class", "flex flex-row flex-1");
    			add_location(div2, file, 9, 1, 298);
    			attr_dev(main, "class", "flex flex-col h-screen");
    			add_location(main, file, 7, 0, 245);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(globalstyle, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			mount_component(seatingplan, div0, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			mount_component(panel, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(globalstyle.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(seatingplan.$$.fragment, local);
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(globalstyle.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(seatingplan.$$.fragment, local);
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(globalstyle, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(seatingplan);
    			destroy_component(panel);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ GlobalStyle: Style, Panel, Header, SeatingPlan: Seating });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world',
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
