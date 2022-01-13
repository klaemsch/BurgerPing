
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop$3() { }
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
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
            update: noop$3,
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
            this.$destroy = noop$3;
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
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

    function create_fragment$j(ctx) {
    	const block = {
    		c: noop$3,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop$3,
    		p: noop$3,
    		i: noop$3,
    		o: noop$3,
    		d: noop$3
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props) {
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Style",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\components\typography\Text.svelte generated by Svelte v3.44.3 */

    const file$i = "src\\components\\typography\\Text.svelte";

    function create_fragment$i(ctx) {
    	let p;
    	let p_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", p_class_value = "font-sans " + (/*bold*/ ctx[0] ? "font-bold" : ""));
    			add_location(p, file$i, 4, 0, 53);
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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*bold*/ 1 && p_class_value !== (p_class_value = "font-sans " + (/*bold*/ ctx[0] ? "font-bold" : ""))) {
    				attr_dev(p, "class", p_class_value);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Text', slots, ['default']);
    	let { bold = false } = $$props;
    	const writable_props = ['bold'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Text> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('bold' in $$props) $$invalidate(0, bold = $$props.bold);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ bold });

    	$$self.$inject_state = $$props => {
    		if ('bold' in $$props) $$invalidate(0, bold = $$props.bold);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bold, $$scope, slots];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { bold: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get bold() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bold(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\TextInput.svelte generated by Svelte v3.44.3 */

    const file$h = "src\\components\\input\\TextInput.svelte";

    // (7:2) {#if label}
    function create_if_block$5(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(label_1, "for", /*label*/ ctx[2]);
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$h, 7, 4, 125);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);

    			if (dirty & /*label*/ 4) {
    				attr_dev(label_1, "for", /*label*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(7:2) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*label*/ ctx[2] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "input");
    			attr_dev(input, "id", /*label*/ ctx[2]);
    			attr_dev(input, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			add_location(input, file$h, 12, 4, 288);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$h, 11, 2, 234);
    			add_location(div1, file$h, 5, 0, 99);
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
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*label*/ 4) {
    				attr_dev(input, "id", /*label*/ ctx[2]);
    			}

    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TextInput', slots, []);
    	let { placeholder } = $$props;
    	let { label } = $$props;
    	let { value = "" } = $$props;
    	const writable_props = ['placeholder', 'label', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ placeholder, label, value });

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, placeholder, label, input_input_handler];
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { placeholder: 1, label: 2, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*placeholder*/ ctx[1] === undefined && !('placeholder' in props)) {
    			console.warn("<TextInput> was created without expected prop 'placeholder'");
    		}

    		if (/*label*/ ctx[2] === undefined && !('label' in props)) {
    			console.warn("<TextInput> was created without expected prop 'label'");
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

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\Select.svelte generated by Svelte v3.44.3 */

    const file$g = "src\\components\\input\\Select.svelte";

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
    			add_location(option, file$g, 13, 16, 501);
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

    function create_fragment$g(ctx) {
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
    			attr_dev(select, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-7 bg-transparent text-gray-500 text-sm border-gray-300 rounded-md cursor-pointer");
    			add_location(select, file$g, 7, 4, 216);
    			attr_dev(div, "class", "flex items-center");
    			add_location(div, file$g, 5, 0, 115);
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
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { options: 0, selected: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$g.name
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
    const file$f = "src\\components\\input\\TimePicker.svelte";

    // (37:4) {#if label}
    function create_if_block$4(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(label_1, "for", "s");
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$f, 37, 8, 594);
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(37:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let select0;
    	let t1;
    	let span;
    	let t3;
    	let select1;
    	let current;
    	let if_block = /*label*/ ctx[0] && create_if_block$4(ctx);

    	select0 = new Select({
    			props: {
    				options: /*hours*/ ctx[1].map(func$1),
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
    			add_location(span, file$f, 43, 8, 877);
    			attr_dev(div0, "class", "mt-1 flex justify-left");
    			attr_dev(div0, "id", "s");
    			add_location(div0, file$f, 41, 4, 713);
    			add_location(div1, file$f, 35, 0, 562);
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
    					if_block = create_if_block$4(ctx);
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$1 = hour => ({ text: hour, value: hour });
    const func_1 = minute => ({ text: minute, value: minute });

    function instance$f($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimePicker",
    			options,
    			id: create_fragment$f.name
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

    const file$e = "src\\components\\input\\DatePicker.svelte";

    // (6:4) {#if label}
    function create_if_block$3(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(label_1, "for", /*label*/ ctx[0]);
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$e, 6, 8, 165);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(6:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let if_block = /*label*/ ctx[0] && create_if_block$3(ctx);

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
    			attr_dev(input, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300 cursor-pointer");
    			add_location(input, file$e, 11, 8, 348);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$e, 10, 4, 290);
    			attr_dev(div1, "class", "flex flex-col");
    			add_location(div1, file$e, 4, 0, 111);
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
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DatePicker",
    			options,
    			id: create_fragment$e.name
    		});
    	}

    	get label() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\NumberInput.svelte generated by Svelte v3.44.3 */

    const file$d = "src\\components\\input\\NumberInput.svelte";

    // (9:4) {#if label}
    function create_if_block$2(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(label_1, "for", /*label*/ ctx[2]);
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$d, 9, 6, 176);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);

    			if (dirty & /*label*/ 4) {
    				attr_dev(label_1, "for", /*label*/ ctx[2]);
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
    		source: "(9:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*label*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "name", "input");
    			attr_dev(input, "min", /*min*/ ctx[3]);
    			attr_dev(input, "max", /*max*/ ctx[4]);
    			attr_dev(input, "id", /*label*/ ctx[2]);
    			attr_dev(input, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			add_location(input, file$d, 14, 6, 349);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$d, 13, 4, 293);
    			add_location(div1, file$d, 7, 2, 146);
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
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[5]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[2]) {
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

    			if (dirty & /*min*/ 8) {
    				attr_dev(input, "min", /*min*/ ctx[3]);
    			}

    			if (dirty & /*max*/ 16) {
    				attr_dev(input, "max", /*max*/ ctx[4]);
    			}

    			if (dirty & /*label*/ 4) {
    				attr_dev(input, "id", /*label*/ ctx[2]);
    			}

    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && to_number(input.value) !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NumberInput', slots, []);
    	let { placeholder } = $$props;
    	let { label } = $$props;
    	let { value } = $$props;
    	let { min = null } = $$props;
    	let { max = null } = $$props;
    	const writable_props = ['placeholder', 'label', 'value', 'min', 'max'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NumberInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(3, min = $$props.min);
    		if ('max' in $$props) $$invalidate(4, max = $$props.max);
    	};

    	$$self.$capture_state = () => ({ placeholder, label, value, min, max });

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(3, min = $$props.min);
    		if ('max' in $$props) $$invalidate(4, max = $$props.max);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, placeholder, label, min, max, input_input_handler];
    }

    class NumberInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			placeholder: 1,
    			label: 2,
    			value: 0,
    			min: 3,
    			max: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumberInput",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*placeholder*/ ctx[1] === undefined && !('placeholder' in props)) {
    			console.warn("<NumberInput> was created without expected prop 'placeholder'");
    		}

    		if (/*label*/ ctx[2] === undefined && !('label' in props)) {
    			console.warn("<NumberInput> was created without expected prop 'label'");
    		}

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<NumberInput> was created without expected prop 'value'");
    		}
    	}

    	get placeholder() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<NumberInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<NumberInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\EmailInput.svelte generated by Svelte v3.44.3 */

    const file$c = "src\\components\\input\\EmailInput.svelte";

    // (7:4) {#if label}
    function create_if_block$1(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(label_1, "for", /*label*/ ctx[2]);
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$c, 7, 6, 133);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);

    			if (dirty & /*label*/ 4) {
    				attr_dev(label_1, "for", /*label*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(7:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let mounted;
    	let dispose;
    	let if_block = /*label*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "name", "input");
    			attr_dev(input, "id", /*label*/ ctx[2]);
    			attr_dev(input, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			add_location(input, file$c, 12, 6, 306);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$c, 11, 4, 250);
    			add_location(div1, file$c, 5, 2, 103);
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
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*label*/ 4) {
    				attr_dev(input, "id", /*label*/ ctx[2]);
    			}

    			if (dirty & /*placeholder*/ 2) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[1]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('EmailInput', slots, []);
    	let { placeholder } = $$props;
    	let { label } = $$props;
    	let { value = "" } = $$props;
    	const writable_props = ['placeholder', 'label', 'value'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<EmailInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	$$self.$capture_state = () => ({ placeholder, label, value });

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(1, placeholder = $$props.placeholder);
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, placeholder, label, input_input_handler];
    }

    class EmailInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { placeholder: 1, label: 2, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmailInput",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*placeholder*/ ctx[1] === undefined && !('placeholder' in props)) {
    			console.warn("<EmailInput> was created without expected prop 'placeholder'");
    		}

    		if (/*label*/ ctx[2] === undefined && !('label' in props)) {
    			console.warn("<EmailInput> was created without expected prop 'label'");
    		}
    	}

    	get placeholder() {
    		throw new Error("<EmailInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<EmailInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<EmailInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<EmailInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<EmailInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<EmailInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\DishPicker.svelte generated by Svelte v3.44.3 */
    const file$b = "src\\components\\input\\DishPicker.svelte";

    // (8:4) {#if label}
    function create_if_block(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(label_1, "for", "s");
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$b, 8, 8, 200);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(8:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let select;
    	let updating_selected;
    	let current;
    	let if_block = /*label*/ ctx[0] && create_if_block(ctx);

    	function select_selected_binding(value) {
    		/*select_selected_binding*/ ctx[3](value);
    	}

    	let select_props = { options: /*dishes*/ ctx[2].map(func) };

    	if (/*dish*/ ctx[1] !== void 0) {
    		select_props.selected = /*dish*/ ctx[1];
    	}

    	select = new Select({ props: select_props, $$inline: true });
    	binding_callbacks.push(() => bind(select, 'selected', select_selected_binding));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			create_component(select.$$.fragment);
    			attr_dev(div0, "class", "mt-1 flex justify-left");
    			attr_dev(div0, "id", "s");
    			add_location(div0, file$b, 10, 4, 295);
    			add_location(div1, file$b, 6, 0, 168);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			mount_component(select, div0, null);
    			current = true;
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

    			const select_changes = {};

    			if (!updating_selected && dirty & /*dish*/ 2) {
    				updating_selected = true;
    				select_changes.selected = /*dish*/ ctx[1];
    				add_flush_callback(() => updating_selected = false);
    			}

    			select.$set(select_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_component(select);
    		}
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

    const func = dish => ({ text: dish, value: dish });

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DishPicker', slots, []);
    	let { label = null } = $$props;
    	const dishes = ['-', 'LANsagne', 'Cookies', 'RAMen'];
    	let dish = '-';
    	const writable_props = ['label'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DishPicker> was created with unknown prop '${key}'`);
    	});

    	function select_selected_binding(value) {
    		dish = value;
    		$$invalidate(1, dish);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({ Select, label, dishes, dish });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('dish' in $$props) $$invalidate(1, dish = $$props.dish);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, dish, dishes, select_selected_binding];
    }

    class DishPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DishPicker",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get label() {
    		throw new Error("<DishPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<DishPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\Button.svelte generated by Svelte v3.44.3 */

    const file$a = "src\\components\\input\\Button.svelte";

    function create_fragment$a(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[1]);
    			attr_dev(button, "class", "bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded h-10");
    			add_location(button, file$a, 4, 0, 71);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onclick*/ ctx[0])) /*onclick*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*label*/ 2) set_data_dev(t, /*label*/ ctx[1]);
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
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
    	validate_slots('Button', slots, []);
    	let { onclick } = $$props;
    	let { label } = $$props;
    	const writable_props = ['onclick', 'label'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('onclick' in $$props) $$invalidate(0, onclick = $$props.onclick);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({ onclick, label });

    	$$self.$inject_state = $$props => {
    		if ('onclick' in $$props) $$invalidate(0, onclick = $$props.onclick);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onclick, label];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { onclick: 0, label: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onclick*/ ctx[0] === undefined && !('onclick' in props)) {
    			console.warn("<Button> was created without expected prop 'onclick'");
    		}

    		if (/*label*/ ctx[1] === undefined && !('label' in props)) {
    			console.warn("<Button> was created without expected prop 'label'");
    		}
    	}

    	get onclick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onclick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\typography\Annotation.svelte generated by Svelte v3.44.3 */

    const file$9 = "src\\components\\typography\\Annotation.svelte";

    function create_fragment$9(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "block text-sm font-medium text-indigo-500");
    			add_location(p, file$9, 0, 0, 0);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Annotation', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Annotation> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Annotation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Annotation",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\Collapsable.svelte generated by Svelte v3.44.3 */
    const file$8 = "src\\components\\Collapsable.svelte";

    // (25:4) <Text bold>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*label*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(25:4) <Text bold>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div0;
    	let text_1;
    	let t0;
    	let div1;
    	let div1_style_value;
    	let t1;
    	let hr;
    	let current;
    	let mounted;
    	let dispose;

    	text_1 = new Text({
    			props: {
    				bold: true,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			create_component(text_1.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			hr = element("hr");
    			attr_dev(div0, "class", "block rounded-md placeholder-gray-300 cursor-pointer");
    			add_location(div0, file$8, 23, 0, 615);
    			attr_dev(div1, "class", "content svelte-1w0zuga");
    			attr_dev(div1, "style", div1_style_value = /*visible*/ ctx[1] ? /*test*/ ctx[3] : "display: none");
    			add_location(div1, file$8, 27, 0, 744);
    			add_location(hr, file$8, 31, 0, 857);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			mount_component(text_1, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			/*div1_binding*/ ctx[8](div1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*collapse*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const text_1_changes = {};

    			if (dirty & /*$$scope, label*/ 513) {
    				text_1_changes.$$scope = { dirty, ctx };
    			}

    			text_1.$set(text_1_changes);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*visible*/ 2 && div1_style_value !== (div1_style_value = /*visible*/ ctx[1] ? /*test*/ ctx[3] : "display: none")) {
    				attr_dev(div1, "style", div1_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_component(text_1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    			/*div1_binding*/ ctx[8](null);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			dispose();
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

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Collapsable', slots, ['default']);
    	let { label } = $$props;
    	let { visible = false } = $$props;
    	let { clickCallback } = $$props;
    	let { index = 0 } = $$props;
    	let content;
    	let test = "display: block";

    	function collapse() {
    		this.classList.toggle("active");

    		if (content.style.display === "block") {
    			$$invalidate(2, content.style.display = "none", content);
    		} else {
    			$$invalidate(2, content.style.display = "block", content);
    		}

    		clickCallback(index);
    	}

    	const writable_props = ['label', 'visible', 'clickCallback', 'index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Collapsable> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			content = $$value;
    			$$invalidate(2, content);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('visible' in $$props) $$invalidate(1, visible = $$props.visible);
    		if ('clickCallback' in $$props) $$invalidate(5, clickCallback = $$props.clickCallback);
    		if ('index' in $$props) $$invalidate(6, index = $$props.index);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Text,
    		label,
    		visible,
    		clickCallback,
    		index,
    		content,
    		test,
    		collapse
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('visible' in $$props) $$invalidate(1, visible = $$props.visible);
    		if ('clickCallback' in $$props) $$invalidate(5, clickCallback = $$props.clickCallback);
    		if ('index' in $$props) $$invalidate(6, index = $$props.index);
    		if ('content' in $$props) $$invalidate(2, content = $$props.content);
    		if ('test' in $$props) $$invalidate(3, test = $$props.test);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		label,
    		visible,
    		content,
    		test,
    		collapse,
    		clickCallback,
    		index,
    		slots,
    		div1_binding,
    		$$scope
    	];
    }

    class Collapsable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			label: 0,
    			visible: 1,
    			clickCallback: 5,
    			index: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Collapsable",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[0] === undefined && !('label' in props)) {
    			console.warn("<Collapsable> was created without expected prop 'label'");
    		}

    		if (/*clickCallback*/ ctx[5] === undefined && !('clickCallback' in props)) {
    			console.warn("<Collapsable> was created without expected prop 'clickCallback'");
    		}
    	}

    	get label() {
    		throw new Error("<Collapsable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Collapsable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Collapsable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Collapsable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get clickCallback() {
    		throw new Error("<Collapsable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clickCallback(value) {
    		throw new Error("<Collapsable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Collapsable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Collapsable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Panel.svelte generated by Svelte v3.44.3 */
    const file$7 = "src\\components\\Panel.svelte";

    // (40:8) <Annotation>
    function create_default_slot_4(ctx) {
    	let t0;
    	let t1;
    	let t2_value = Math.ceil(/*personCount*/ ctx[0] / 2) + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			t0 = text(/*selectionCount*/ ctx[2]);
    			t1 = text("/");
    			t2 = text(t2_value);
    			t3 = text(" Tische ausgewählt");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectionCount*/ 4) set_data_dev(t0, /*selectionCount*/ ctx[2]);
    			if (dirty & /*personCount*/ 1 && t2_value !== (t2_value = Math.ceil(/*personCount*/ ctx[0] / 2) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(40:8) <Annotation>",
    		ctx
    	});

    	return block;
    }

    // (25:4) <Collapsable          label="Datum+Uhrzeit+Personen"          visible={currentIndex === 1}          {clickCallback}          index={1}      >
    function create_default_slot_3(ctx) {
    	let datepicker;
    	let t0;
    	let timepicker;
    	let t1;
    	let numberinput;
    	let updating_value;
    	let t2;
    	let annotation;
    	let current;

    	datepicker = new DatePicker({
    			props: { label: "Datum" },
    			$$inline: true
    		});

    	timepicker = new TimePicker({
    			props: { label: "Uhrzeit" },
    			$$inline: true
    		});

    	function numberinput_value_binding(value) {
    		/*numberinput_value_binding*/ ctx[5](value);
    	}

    	let numberinput_props = {
    		label: "Personen",
    		min: 1,
    		max: 10,
    		placeholder: "1"
    	};

    	if (/*personCount*/ ctx[0] !== void 0) {
    		numberinput_props.value = /*personCount*/ ctx[0];
    	}

    	numberinput = new NumberInput({ props: numberinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(numberinput, 'value', numberinput_value_binding));

    	annotation = new Annotation({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(datepicker.$$.fragment);
    			t0 = space();
    			create_component(timepicker.$$.fragment);
    			t1 = space();
    			create_component(numberinput.$$.fragment);
    			t2 = space();
    			create_component(annotation.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datepicker, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(timepicker, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(numberinput, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(annotation, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const numberinput_changes = {};

    			if (!updating_value && dirty & /*personCount*/ 1) {
    				updating_value = true;
    				numberinput_changes.value = /*personCount*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			numberinput.$set(numberinput_changes);
    			const annotation_changes = {};

    			if (dirty & /*$$scope, personCount, selectionCount*/ 261) {
    				annotation_changes.$$scope = { dirty, ctx };
    			}

    			annotation.$set(annotation_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			transition_in(timepicker.$$.fragment, local);
    			transition_in(numberinput.$$.fragment, local);
    			transition_in(annotation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			transition_out(timepicker.$$.fragment, local);
    			transition_out(numberinput.$$.fragment, local);
    			transition_out(annotation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datepicker, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(timepicker, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(numberinput, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(annotation, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(25:4) <Collapsable          label=\\\"Datum+Uhrzeit+Personen\\\"          visible={currentIndex === 1}          {clickCallback}          index={1}      >",
    		ctx
    	});

    	return block;
    }

    // (49:8) <Text>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Essensauswahl (optional)");
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(49:8) <Text>",
    		ctx
    	});

    	return block;
    }

    // (43:4) <Collapsable          label="Essensauswahl"          visible={currentIndex === 2}          {clickCallback}          index={2}      >
    function create_default_slot_1(ctx) {
    	let text_1;
    	let t0;
    	let div;
    	let dishpicker;
    	let t1;
    	let numberinput;
    	let updating_value;
    	let current;

    	text_1 = new Text({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	dishpicker = new DishPicker({ props: { label: "Menü" }, $$inline: true });

    	function numberinput_value_binding_1(value) {
    		/*numberinput_value_binding_1*/ ctx[6](value);
    	}

    	let numberinput_props = {
    		label: "Anzahl",
    		min: 1,
    		max: 10,
    		placeholder: "1"
    	};

    	if (/*dishCount*/ ctx[1] !== void 0) {
    		numberinput_props.value = /*dishCount*/ ctx[1];
    	}

    	numberinput = new NumberInput({ props: numberinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(numberinput, 'value', numberinput_value_binding_1));

    	const block = {
    		c: function create() {
    			create_component(text_1.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(dishpicker.$$.fragment);
    			t1 = space();
    			create_component(numberinput.$$.fragment);
    			attr_dev(div, "class", "flex gap-5");
    			add_location(div, file$7, 49, 8, 1619);
    		},
    		m: function mount(target, anchor) {
    			mount_component(text_1, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(dishpicker, div, null);
    			append_dev(div, t1);
    			mount_component(numberinput, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const text_1_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				text_1_changes.$$scope = { dirty, ctx };
    			}

    			text_1.$set(text_1_changes);
    			const numberinput_changes = {};

    			if (!updating_value && dirty & /*dishCount*/ 2) {
    				updating_value = true;
    				numberinput_changes.value = /*dishCount*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			numberinput.$set(numberinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			transition_in(dishpicker.$$.fragment, local);
    			transition_in(numberinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			transition_out(dishpicker.$$.fragment, local);
    			transition_out(numberinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(text_1, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(dishpicker);
    			destroy_component(numberinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(43:4) <Collapsable          label=\\\"Essensauswahl\\\"          visible={currentIndex === 2}          {clickCallback}          index={2}      >",
    		ctx
    	});

    	return block;
    }

    // (62:4) <Collapsable          label="Persönliche Angaben"          visible={currentIndex === 3}          {clickCallback}          index={3}      >
    function create_default_slot(ctx) {
    	let textinput;
    	let t;
    	let emailinput;
    	let current;

    	textinput = new TextInput({
    			props: {
    				label: "Name",
    				placeholder: "Maximilian Erhardt"
    			},
    			$$inline: true
    		});

    	emailinput = new EmailInput({
    			props: {
    				label: "Email",
    				placeholder: "maximilian.erhardt@stud.uni-hannover.de"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textinput.$$.fragment);
    			t = space();
    			create_component(emailinput.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textinput, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(emailinput, target, anchor);
    			current = true;
    		},
    		p: noop$3,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput.$$.fragment, local);
    			transition_in(emailinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textinput.$$.fragment, local);
    			transition_out(emailinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textinput, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(emailinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(62:4) <Collapsable          label=\\\"Persönliche Angaben\\\"          visible={currentIndex === 3}          {clickCallback}          index={3}      >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let collapsable0;
    	let t0;
    	let collapsable1;
    	let t1;
    	let collapsable2;
    	let t2;
    	let button;
    	let current;

    	collapsable0 = new Collapsable({
    			props: {
    				label: "Datum+Uhrzeit+Personen",
    				visible: /*currentIndex*/ ctx[3] === 1,
    				clickCallback: /*clickCallback*/ ctx[4],
    				index: 1,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	collapsable1 = new Collapsable({
    			props: {
    				label: "Essensauswahl",
    				visible: /*currentIndex*/ ctx[3] === 2,
    				clickCallback: /*clickCallback*/ ctx[4],
    				index: 2,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	collapsable2 = new Collapsable({
    			props: {
    				label: "Persönliche Angaben",
    				visible: /*currentIndex*/ ctx[3] === 3,
    				clickCallback: /*clickCallback*/ ctx[4],
    				index: 3,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				label: "Bestätigen",
    				onclick: clickHandler
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(collapsable0.$$.fragment);
    			t0 = space();
    			create_component(collapsable1.$$.fragment);
    			t1 = space();
    			create_component(collapsable2.$$.fragment);
    			t2 = space();
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "flex flex-col p-10 gap-5 items-stretch border-l-2 border-gray-100");
    			set_style(div, "width", "600px");
    			add_location(div, file$7, 23, 0, 805);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(collapsable0, div, null);
    			append_dev(div, t0);
    			mount_component(collapsable1, div, null);
    			append_dev(div, t1);
    			mount_component(collapsable2, div, null);
    			append_dev(div, t2);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const collapsable0_changes = {};
    			if (dirty & /*currentIndex*/ 8) collapsable0_changes.visible = /*currentIndex*/ ctx[3] === 1;

    			if (dirty & /*$$scope, personCount, selectionCount*/ 261) {
    				collapsable0_changes.$$scope = { dirty, ctx };
    			}

    			collapsable0.$set(collapsable0_changes);
    			const collapsable1_changes = {};
    			if (dirty & /*currentIndex*/ 8) collapsable1_changes.visible = /*currentIndex*/ ctx[3] === 2;

    			if (dirty & /*$$scope, dishCount*/ 258) {
    				collapsable1_changes.$$scope = { dirty, ctx };
    			}

    			collapsable1.$set(collapsable1_changes);
    			const collapsable2_changes = {};
    			if (dirty & /*currentIndex*/ 8) collapsable2_changes.visible = /*currentIndex*/ ctx[3] === 3;

    			if (dirty & /*$$scope*/ 256) {
    				collapsable2_changes.$$scope = { dirty, ctx };
    			}

    			collapsable2.$set(collapsable2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapsable0.$$.fragment, local);
    			transition_in(collapsable1.$$.fragment, local);
    			transition_in(collapsable2.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapsable0.$$.fragment, local);
    			transition_out(collapsable1.$$.fragment, local);
    			transition_out(collapsable2.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(collapsable0);
    			destroy_component(collapsable1);
    			destroy_component(collapsable2);
    			destroy_component(button);
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

    function clickHandler() {
    	alert("Deine Reservation war erfolgreich!");
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Panel', slots, []);
    	let { personCount } = $$props;
    	let { dishCount } = $$props;
    	let { selectionCount } = $$props;
    	let dish = '';
    	let currentIndex = 1;

    	function clickCallback(index) {
    		$$invalidate(3, currentIndex = index);
    	}

    	const writable_props = ['personCount', 'dishCount', 'selectionCount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	function numberinput_value_binding(value) {
    		personCount = value;
    		$$invalidate(0, personCount);
    	}

    	function numberinput_value_binding_1(value) {
    		dishCount = value;
    		$$invalidate(1, dishCount);
    	}

    	$$self.$$set = $$props => {
    		if ('personCount' in $$props) $$invalidate(0, personCount = $$props.personCount);
    		if ('dishCount' in $$props) $$invalidate(1, dishCount = $$props.dishCount);
    		if ('selectionCount' in $$props) $$invalidate(2, selectionCount = $$props.selectionCount);
    	};

    	$$self.$capture_state = () => ({
    		Text,
    		TextInput,
    		TimePicker,
    		DatePicker,
    		NumberInput,
    		EmailInput,
    		DishPicker,
    		Button,
    		Annotation,
    		Collapsable,
    		personCount,
    		dishCount,
    		selectionCount,
    		dish,
    		clickHandler,
    		currentIndex,
    		clickCallback
    	});

    	$$self.$inject_state = $$props => {
    		if ('personCount' in $$props) $$invalidate(0, personCount = $$props.personCount);
    		if ('dishCount' in $$props) $$invalidate(1, dishCount = $$props.dishCount);
    		if ('selectionCount' in $$props) $$invalidate(2, selectionCount = $$props.selectionCount);
    		if ('dish' in $$props) dish = $$props.dish;
    		if ('currentIndex' in $$props) $$invalidate(3, currentIndex = $$props.currentIndex);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		personCount,
    		dishCount,
    		selectionCount,
    		currentIndex,
    		clickCallback,
    		numberinput_value_binding,
    		numberinput_value_binding_1
    	];
    }

    class Panel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			personCount: 0,
    			dishCount: 1,
    			selectionCount: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*personCount*/ ctx[0] === undefined && !('personCount' in props)) {
    			console.warn("<Panel> was created without expected prop 'personCount'");
    		}

    		if (/*dishCount*/ ctx[1] === undefined && !('dishCount' in props)) {
    			console.warn("<Panel> was created without expected prop 'dishCount'");
    		}

    		if (/*selectionCount*/ ctx[2] === undefined && !('selectionCount' in props)) {
    			console.warn("<Panel> was created without expected prop 'selectionCount'");
    		}
    	}

    	get personCount() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set personCount(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dishCount() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dishCount(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectionCount() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectionCount(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.44.3 */

    const file$6 = "src\\components\\Header.svelte";

    function create_fragment$6(ctx) {
    	let header;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			header = element("header");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "./burger.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "BurgerPing Logo");
    			attr_dev(img, "width", 50);
    			attr_dev(img, "class", "rounded");
    			add_location(img, file$6, 1, 4, 80);
    			attr_dev(header, "class", "flex flex-row items-center border-b-2 border-gray-100 p-4");
    			add_location(header, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, img);
    		},
    		p: noop$3,
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
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

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const TABLE_SIZE = 30;
    const CHAIR_HEIGHT = 10;
    const CHAIR_WIDTH = 20;

    /* src\components\furniture\Chair.svelte generated by Svelte v3.44.3 */
    const file$5 = "src\\components\\furniture\\Chair.svelte";

    function create_fragment$5(ctx) {
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
    			attr_dev(rect, "class", "fill-orange-400 cursor-pointer svelte-14y1ub7");
    			toggle_class(rect, "highlighted", /*highlighted*/ ctx[2]);
    			toggle_class(rect, "selected", /*selected*/ ctx[3]);
    			toggle_class(rect, "disabled", /*disabled*/ ctx[4]);
    			add_location(rect, file$5, 8, 0, 215);
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

    			if (dirty & /*highlighted*/ 4) {
    				toggle_class(rect, "highlighted", /*highlighted*/ ctx[2]);
    			}

    			if (dirty & /*selected*/ 8) {
    				toggle_class(rect, "selected", /*selected*/ ctx[3]);
    			}

    			if (dirty & /*disabled*/ 16) {
    				toggle_class(rect, "disabled", /*disabled*/ ctx[4]);
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(rect);
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
    	validate_slots('Chair', slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	let { highlighted = false } = $$props;
    	let { selected = false } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ['x', 'y', 'highlighted', 'selected', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chair> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('highlighted' in $$props) $$invalidate(2, highlighted = $$props.highlighted);
    		if ('selected' in $$props) $$invalidate(3, selected = $$props.selected);
    		if ('disabled' in $$props) $$invalidate(4, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		CHAIR_WIDTH,
    		CHAIR_HEIGHT,
    		x,
    		y,
    		highlighted,
    		selected,
    		disabled
    	});

    	$$self.$inject_state = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('highlighted' in $$props) $$invalidate(2, highlighted = $$props.highlighted);
    		if ('selected' in $$props) $$invalidate(3, selected = $$props.selected);
    		if ('disabled' in $$props) $$invalidate(4, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [x, y, highlighted, selected, disabled];
    }

    class Chair extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			x: 0,
    			y: 1,
    			highlighted: 2,
    			selected: 3,
    			disabled: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chair",
    			options,
    			id: create_fragment$5.name
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

    	get highlighted() {
    		throw new Error("<Chair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlighted(value) {
    		throw new Error("<Chair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Chair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Chair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Chair>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Chair>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\furniture\Table.svelte generated by Svelte v3.44.3 */
    const file$4 = "src\\components\\furniture\\Table.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let chair0;
    	let rect;
    	let chair1;
    	let current;

    	chair0 = new Chair({
    			props: {
    				x: 5,
    				y: 0,
    				highlighted: /*highlighted*/ ctx[0],
    				selected: /*selected*/ ctx[1],
    				disabled: /*disabled*/ ctx[2]
    			},
    			$$inline: true
    		});

    	chair1 = new Chair({
    			props: {
    				x: 5,
    				y: 40,
    				highlighted: /*highlighted*/ ctx[0],
    				selected: /*selected*/ ctx[1],
    				disabled: /*disabled*/ ctx[2]
    			},
    			$$inline: true
    		});

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
    			attr_dev(rect, "class", "fill-orange-300 cursor-pointer svelte-sulrse");
    			toggle_class(rect, "highlighted", /*highlighted*/ ctx[0]);
    			toggle_class(rect, "selected", /*selected*/ ctx[1]);
    			toggle_class(rect, "disabled", /*disabled*/ ctx[2]);
    			add_location(rect, file$4, 9, 4, 353);
    			attr_dev(svg, "width", TABLE_SIZE);
    			attr_dev(svg, "height", TABLE_SIZE + 2 * CHAIR_HEIGHT);
    			add_location(svg, file$4, 7, 0, 221);
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
    		p: function update(ctx, [dirty]) {
    			const chair0_changes = {};
    			if (dirty & /*highlighted*/ 1) chair0_changes.highlighted = /*highlighted*/ ctx[0];
    			if (dirty & /*selected*/ 2) chair0_changes.selected = /*selected*/ ctx[1];
    			if (dirty & /*disabled*/ 4) chair0_changes.disabled = /*disabled*/ ctx[2];
    			chair0.$set(chair0_changes);

    			if (dirty & /*highlighted*/ 1) {
    				toggle_class(rect, "highlighted", /*highlighted*/ ctx[0]);
    			}

    			if (dirty & /*selected*/ 2) {
    				toggle_class(rect, "selected", /*selected*/ ctx[1]);
    			}

    			if (dirty & /*disabled*/ 4) {
    				toggle_class(rect, "disabled", /*disabled*/ ctx[2]);
    			}

    			const chair1_changes = {};
    			if (dirty & /*highlighted*/ 1) chair1_changes.highlighted = /*highlighted*/ ctx[0];
    			if (dirty & /*selected*/ 2) chair1_changes.selected = /*selected*/ ctx[1];
    			if (dirty & /*disabled*/ 4) chair1_changes.disabled = /*disabled*/ ctx[2];
    			chair1.$set(chair1_changes);
    		},
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Table', slots, []);
    	let { highlighted = false } = $$props;
    	let { selected = false } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ['highlighted', 'selected', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('highlighted' in $$props) $$invalidate(0, highlighted = $$props.highlighted);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		TABLE_SIZE,
    		CHAIR_HEIGHT,
    		Chair,
    		highlighted,
    		selected,
    		disabled
    	});

    	$$self.$inject_state = $$props => {
    		if ('highlighted' in $$props) $$invalidate(0, highlighted = $$props.highlighted);
    		if ('selected' in $$props) $$invalidate(1, selected = $$props.selected);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [highlighted, selected, disabled];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { highlighted: 0, selected: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get highlighted() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlighted(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\furniture\Barstool.svelte generated by Svelte v3.44.3 */

    const file$3 = "src\\components\\furniture\\Barstool.svelte";

    function create_fragment$3(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", /*x*/ ctx[0]);
    			attr_dev(circle, "cy", /*y*/ ctx[1]);
    			attr_dev(circle, "r", 10);
    			attr_dev(circle, "class", "fill-orange-400");
    			add_location(circle, file$3, 4, 0, 61);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x*/ 1) {
    				attr_dev(circle, "cx", /*x*/ ctx[0]);
    			}

    			if (dirty & /*y*/ 2) {
    				attr_dev(circle, "cy", /*y*/ ctx[1]);
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
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
    	validate_slots('Barstool', slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	const writable_props = ['x', 'y'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Barstool> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    	};

    	$$self.$capture_state = () => ({ x, y });

    	$$self.$inject_state = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [x, y];
    }

    class Barstool extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { x: 0, y: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Barstool",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !('x' in props)) {
    			console.warn("<Barstool> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !('y' in props)) {
    			console.warn("<Barstool> was created without expected prop 'y'");
    		}
    	}

    	get x() {
    		throw new Error("<Barstool>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Barstool>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Barstool>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Barstool>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\furniture\Bar.svelte generated by Svelte v3.44.3 */
    const file$2 = "src\\components\\furniture\\Bar.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let barstool0;
    	let barstool1;
    	let barstool2;
    	let barstool3;
    	let barstool4;
    	let barstool5;
    	let rect0;
    	let rect1;
    	let current;
    	barstool0 = new Barstool({ props: { x: 10, y: 60 }, $$inline: true });
    	barstool1 = new Barstool({ props: { x: 40, y: 60 }, $$inline: true });
    	barstool2 = new Barstool({ props: { x: 70, y: 60 }, $$inline: true });
    	barstool3 = new Barstool({ props: { x: 100, y: 60 }, $$inline: true });
    	barstool4 = new Barstool({ props: { x: 130, y: 60 }, $$inline: true });
    	barstool5 = new Barstool({ props: { x: 160, y: 60 }, $$inline: true });

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			create_component(barstool0.$$.fragment);
    			create_component(barstool1.$$.fragment);
    			create_component(barstool2.$$.fragment);
    			create_component(barstool3.$$.fragment);
    			create_component(barstool4.$$.fragment);
    			create_component(barstool5.$$.fragment);
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			attr_dev(rect0, "x", 160);
    			attr_dev(rect0, "y", 0);
    			attr_dev(rect0, "width", 30);
    			attr_dev(rect0, "height", 60);
    			attr_dev(rect0, "class", "fill-orange-300");
    			add_location(rect0, file$2, 12, 4, 338);
    			attr_dev(rect1, "x", 0);
    			attr_dev(rect1, "y", 30);
    			attr_dev(rect1, "width", 190);
    			attr_dev(rect1, "height", 30);
    			attr_dev(rect1, "class", "fill-orange-300");
    			add_location(rect1, file$2, 13, 4, 413);
    			attr_dev(svg, "x", /*x*/ ctx[0]);
    			attr_dev(svg, "y", /*y*/ ctx[1]);
    			attr_dev(svg, "height", "70");
    			attr_dev(svg, "width", "190");
    			add_location(svg, file$2, 5, 0, 104);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			mount_component(barstool0, svg, null);
    			mount_component(barstool1, svg, null);
    			mount_component(barstool2, svg, null);
    			mount_component(barstool3, svg, null);
    			mount_component(barstool4, svg, null);
    			mount_component(barstool5, svg, null);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*x*/ 1) {
    				attr_dev(svg, "x", /*x*/ ctx[0]);
    			}

    			if (!current || dirty & /*y*/ 2) {
    				attr_dev(svg, "y", /*y*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(barstool0.$$.fragment, local);
    			transition_in(barstool1.$$.fragment, local);
    			transition_in(barstool2.$$.fragment, local);
    			transition_in(barstool3.$$.fragment, local);
    			transition_in(barstool4.$$.fragment, local);
    			transition_in(barstool5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(barstool0.$$.fragment, local);
    			transition_out(barstool1.$$.fragment, local);
    			transition_out(barstool2.$$.fragment, local);
    			transition_out(barstool3.$$.fragment, local);
    			transition_out(barstool4.$$.fragment, local);
    			transition_out(barstool5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_component(barstool0);
    			destroy_component(barstool1);
    			destroy_component(barstool2);
    			destroy_component(barstool3);
    			destroy_component(barstool4);
    			destroy_component(barstool5);
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
    	validate_slots('Bar', slots, []);
    	let { x } = $$props;
    	let { y } = $$props;
    	const writable_props = ['x', 'y'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Bar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    	};

    	$$self.$capture_state = () => ({ Barstool, x, y });

    	$$self.$inject_state = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [x, y];
    }

    class Bar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { x: 0, y: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bar",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !('x' in props)) {
    			console.warn("<Bar> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !('y' in props)) {
    			console.warn("<Bar> was created without expected prop 'y'");
    		}
    	}

    	get x() {
    		throw new Error("<Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * This module used to unify mouse wheel behavior between different browsers in 2014
     * Now it's just a wrapper around addEventListener('wheel');
     *
     * Usage:
     *  var addWheelListener = require('wheel').addWheelListener;
     *  var removeWheelListener = require('wheel').removeWheelListener;
     *  addWheelListener(domElement, function (e) {
     *    // mouse wheel event
     *  });
     *  removeWheelListener(domElement, function);
     */
    var wheel = addWheelListener;

    // But also expose "advanced" api with unsubscribe:
    var addWheelListener_1 = addWheelListener;
    var removeWheelListener_1 = removeWheelListener;


    function addWheelListener(element, listener, useCapture) {
      element.addEventListener('wheel', listener, useCapture);
    }

    function removeWheelListener( element, listener, useCapture ) {
      element.removeEventListener('wheel', listener, useCapture);
    }
    wheel.addWheelListener = addWheelListener_1;
    wheel.removeWheelListener = removeWheelListener_1;

    /**
     * https://github.com/gre/bezier-easing
     * BezierEasing - use bezier curve for transition easing function
     * by Gaëtan Renaudeau 2014 - 2015 – MIT License
     */
    // These values are established by empiricism with tests (tradeoff: performance VS precision)
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 0.001;
    var SUBDIVISION_PRECISION = 0.0000001;
    var SUBDIVISION_MAX_ITERATIONS = 10;

    var kSplineTableSize = 11;
    var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    var float32ArraySupported = typeof Float32Array === 'function';

    function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
    function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
    function C (aA1)      { return 3.0 * aA1; }

    // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
    function calcBezier (aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

    // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
    function getSlope (aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

    function binarySubdivide (aX, aA, aB, mX1, mX2) {
      var currentX, currentT, i = 0;
      do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
          aB = currentT;
        } else {
          aA = currentT;
        }
      } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
      return currentT;
    }

    function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
     for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
       var currentSlope = getSlope(aGuessT, mX1, mX2);
       if (currentSlope === 0.0) {
         return aGuessT;
       }
       var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
       aGuessT -= currentX / currentSlope;
     }
     return aGuessT;
    }

    function LinearEasing (x) {
      return x;
    }

    var src = function bezier (mX1, mY1, mX2, mY2) {
      if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
        throw new Error('bezier x values must be in [0, 1] range');
      }

      if (mX1 === mY1 && mX2 === mY2) {
        return LinearEasing;
      }

      // Precompute samples table
      var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
      for (var i = 0; i < kSplineTableSize; ++i) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
      }

      function getTForX (aX) {
        var intervalStart = 0.0;
        var currentSample = 1;
        var lastSample = kSplineTableSize - 1;

        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
          intervalStart += kSampleStepSize;
        }
        --currentSample;

        // Interpolate to provide an initial guess for t
        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;

        var initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
          return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0.0) {
          return guessForT;
        } else {
          return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
      }

      return function BezierEasing (x) {
        // Because JavaScript number are imprecise, we should guarantee the extremes are right.
        if (x === 0) {
          return 0;
        }
        if (x === 1) {
          return 1;
        }
        return calcBezier(getTForX(x), mY1, mY2);
      };
    };

    // Predefined set of animations. Similar to CSS easing functions
    var animations = {
      ease:  src(0.25, 0.1, 0.25, 1),
      easeIn: src(0.42, 0, 1, 1),
      easeOut: src(0, 0, 0.58, 1),
      easeInOut: src(0.42, 0, 0.58, 1),
      linear: src(0, 0, 1, 1)
    };


    var amator = animate;
    var makeAggregateRaf_1 = makeAggregateRaf;
    var sharedScheduler = makeAggregateRaf();


    function animate(source, target, options) {
      var start = Object.create(null);
      var diff = Object.create(null);
      options = options || {};
      // We let clients specify their own easing function
      var easing = (typeof options.easing === 'function') ? options.easing : animations[options.easing];

      // if nothing is specified, default to ease (similar to CSS animations)
      if (!easing) {
        if (options.easing) {
          console.warn('Unknown easing function in amator: ' + options.easing);
        }
        easing = animations.ease;
      }

      var step = typeof options.step === 'function' ? options.step : noop$2;
      var done = typeof options.done === 'function' ? options.done : noop$2;

      var scheduler = getScheduler(options.scheduler);

      var keys = Object.keys(target);
      keys.forEach(function(key) {
        start[key] = source[key];
        diff[key] = target[key] - source[key];
      });

      var durationInMs = typeof options.duration === 'number' ? options.duration : 400;
      var durationInFrames = Math.max(1, durationInMs * 0.06); // 0.06 because 60 frames pers 1,000 ms
      var previousAnimationId;
      var frame = 0;

      previousAnimationId = scheduler.next(loop);

      return {
        cancel: cancel
      }

      function cancel() {
        scheduler.cancel(previousAnimationId);
        previousAnimationId = 0;
      }

      function loop() {
        var t = easing(frame/durationInFrames);
        frame += 1;
        setValues(t);
        if (frame <= durationInFrames) {
          previousAnimationId = scheduler.next(loop);
          step(source);
        } else {
          previousAnimationId = 0;
          setTimeout(function() { done(source); }, 0);
        }
      }

      function setValues(t) {
        keys.forEach(function(key) {
          source[key] = diff[key] * t + start[key];
        });
      }
    }

    function noop$2() { }

    function getScheduler(scheduler) {
      if (!scheduler) {
        var canRaf = typeof window !== 'undefined' && window.requestAnimationFrame;
        return canRaf ? rafScheduler() : timeoutScheduler()
      }
      if (typeof scheduler.next !== 'function') throw new Error('Scheduler is supposed to have next(cb) function')
      if (typeof scheduler.cancel !== 'function') throw new Error('Scheduler is supposed to have cancel(handle) function')

      return scheduler
    }

    function rafScheduler() {
      return {
        next: window.requestAnimationFrame.bind(window),
        cancel: window.cancelAnimationFrame.bind(window)
      }
    }

    function timeoutScheduler() {
      return {
        next: function(cb) {
          return setTimeout(cb, 1000/60)
        },
        cancel: function (id) {
          return clearTimeout(id)
        }
      }
    }

    function makeAggregateRaf() {
      var frontBuffer = new Set();
      var backBuffer = new Set();
      var frameToken = 0;

      return {
        next: next,
        cancel: next,
        clearAll: clearAll
      }

      function clearAll() {
        frontBuffer.clear();
        backBuffer.clear();
        cancelAnimationFrame(frameToken);
        frameToken = 0;
      }

      function next(callback) {
        backBuffer.add(callback);
        renderNextFrame();
      }

      function renderNextFrame() {
        if (!frameToken) frameToken = requestAnimationFrame(renderFrame);
      }

      function renderFrame() {
        frameToken = 0;

        var t = backBuffer;
        backBuffer = frontBuffer;
        frontBuffer = t;

        frontBuffer.forEach(function(callback) {
          callback();
        });
        frontBuffer.clear();
      }
    }
    amator.makeAggregateRaf = makeAggregateRaf_1;
    amator.sharedScheduler = sharedScheduler;

    var ngraph_events = function eventify(subject) {
      validateSubject(subject);

      var eventsStorage = createEventsStorage(subject);
      subject.on = eventsStorage.on;
      subject.off = eventsStorage.off;
      subject.fire = eventsStorage.fire;
      return subject;
    };

    function createEventsStorage(subject) {
      // Store all event listeners to this hash. Key is event name, value is array
      // of callback records.
      //
      // A callback record consists of callback function and its optional context:
      // { 'eventName' => [{callback: function, ctx: object}] }
      var registeredEvents = Object.create(null);

      return {
        on: function (eventName, callback, ctx) {
          if (typeof callback !== 'function') {
            throw new Error('callback is expected to be a function');
          }
          var handlers = registeredEvents[eventName];
          if (!handlers) {
            handlers = registeredEvents[eventName] = [];
          }
          handlers.push({callback: callback, ctx: ctx});

          return subject;
        },

        off: function (eventName, callback) {
          var wantToRemoveAll = (typeof eventName === 'undefined');
          if (wantToRemoveAll) {
            // Killing old events storage should be enough in this case:
            registeredEvents = Object.create(null);
            return subject;
          }

          if (registeredEvents[eventName]) {
            var deleteAllCallbacksForEvent = (typeof callback !== 'function');
            if (deleteAllCallbacksForEvent) {
              delete registeredEvents[eventName];
            } else {
              var callbacks = registeredEvents[eventName];
              for (var i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].callback === callback) {
                  callbacks.splice(i, 1);
                }
              }
            }
          }

          return subject;
        },

        fire: function (eventName) {
          var callbacks = registeredEvents[eventName];
          if (!callbacks) {
            return subject;
          }

          var fireArguments;
          if (arguments.length > 1) {
            fireArguments = Array.prototype.splice.call(arguments, 1);
          }
          for(var i = 0; i < callbacks.length; ++i) {
            var callbackInfo = callbacks[i];
            callbackInfo.callback.apply(callbackInfo.ctx, fireArguments);
          }

          return subject;
        }
      };
    }

    function validateSubject(subject) {
      if (!subject) {
        throw new Error('Eventify cannot use falsy object as events subject');
      }
      var reservedWords = ['on', 'fire', 'off'];
      for (var i = 0; i < reservedWords.length; ++i) {
        if (subject.hasOwnProperty(reservedWords[i])) {
          throw new Error("Subject cannot be eventified, since it already has property '" + reservedWords[i] + "'");
        }
      }
    }

    /**
     * Allows smooth kinetic scrolling of the surface
     */
    var kinetic_1 = kinetic;

    function kinetic(getPoint, scroll, settings) {
      if (typeof settings !== 'object') {
        // setting could come as boolean, we should ignore it, and use an object.
        settings = {};
      }

      var minVelocity = typeof settings.minVelocity === 'number' ? settings.minVelocity : 5;
      var amplitude = typeof settings.amplitude === 'number' ? settings.amplitude : 0.25;
      var cancelAnimationFrame = typeof settings.cancelAnimationFrame === 'function' ? settings.cancelAnimationFrame : getCancelAnimationFrame();
      var requestAnimationFrame = typeof settings.requestAnimationFrame === 'function' ? settings.requestAnimationFrame : getRequestAnimationFrame();

      var lastPoint;
      var timestamp;
      var timeConstant = 342;

      var ticker;
      var vx, targetX, ax;
      var vy, targetY, ay;

      var raf;

      return {
        start: start,
        stop: stop,
        cancel: dispose
      };

      function dispose() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);
      }

      function start() {
        lastPoint = getPoint();

        ax = ay = vx = vy = 0;
        timestamp = new Date();

        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        // we start polling the point position to accumulate velocity
        // Once we stop(), we will use accumulated velocity to keep scrolling
        // an object.
        ticker = requestAnimationFrame(track);
      }

      function track() {
        var now = Date.now();
        var elapsed = now - timestamp;
        timestamp = now;

        var currentPoint = getPoint();

        var dx = currentPoint.x - lastPoint.x;
        var dy = currentPoint.y - lastPoint.y;

        lastPoint = currentPoint;

        var dt = 1000 / (1 + elapsed);

        // moving average
        vx = 0.8 * dx * dt + 0.2 * vx;
        vy = 0.8 * dy * dt + 0.2 * vy;

        ticker = requestAnimationFrame(track);
      }

      function stop() {
        cancelAnimationFrame(ticker);
        cancelAnimationFrame(raf);

        var currentPoint = getPoint();

        targetX = currentPoint.x;
        targetY = currentPoint.y;
        timestamp = Date.now();

        if (vx < -minVelocity || vx > minVelocity) {
          ax = amplitude * vx;
          targetX += ax;
        }

        if (vy < -minVelocity || vy > minVelocity) {
          ay = amplitude * vy;
          targetY += ay;
        }

        raf = requestAnimationFrame(autoScroll);
      }

      function autoScroll() {
        var elapsed = Date.now() - timestamp;

        var moving = false;
        var dx = 0;
        var dy = 0;

        if (ax) {
          dx = -ax * Math.exp(-elapsed / timeConstant);

          if (dx > 0.5 || dx < -0.5) moving = true;
          else dx = ax = 0;
        }

        if (ay) {
          dy = -ay * Math.exp(-elapsed / timeConstant);

          if (dy > 0.5 || dy < -0.5) moving = true;
          else dy = ay = 0;
        }

        if (moving) {
          scroll(targetX + dx, targetY + dy);
          raf = requestAnimationFrame(autoScroll);
        }
      }
    }

    function getCancelAnimationFrame() {
      if (typeof cancelAnimationFrame === 'function') return cancelAnimationFrame;
      return clearTimeout;
    }

    function getRequestAnimationFrame() {
      if (typeof requestAnimationFrame === 'function') return requestAnimationFrame;

      return function (handler) {
        return setTimeout(handler, 16);
      };
    }

    /**
     * Disallows selecting text.
     */
    var createTextSelectionInterceptor_1 = createTextSelectionInterceptor;

    function createTextSelectionInterceptor(useFake) {
      if (useFake) {
        return {
          capture: noop$1,
          release: noop$1
        };
      }

      var dragObject;
      var prevSelectStart;
      var prevDragStart;
      var wasCaptured = false;

      return {
        capture: capture,
        release: release
      };

      function capture(domObject) {
        wasCaptured = true;
        prevSelectStart = window.document.onselectstart;
        prevDragStart = window.document.ondragstart;

        window.document.onselectstart = disabled;

        dragObject = domObject;
        dragObject.ondragstart = disabled;
      }

      function release() {
        if (!wasCaptured) return;
        
        wasCaptured = false;
        window.document.onselectstart = prevSelectStart;
        if (dragObject) dragObject.ondragstart = prevDragStart;
      }
    }

    function disabled(e) {
      e.stopPropagation();
      return false;
    }

    function noop$1() {}

    var transform = Transform;

    function Transform() {
      this.x = 0;
      this.y = 0;
      this.scale = 1;
    }

    var svgController = makeSvgController;
    var canAttach$1 = isSVGElement;

    function makeSvgController(svgElement, options) {
      if (!isSVGElement(svgElement)) {
        throw new Error('svg element is required for svg.panzoom to work');
      }

      var owner = svgElement.ownerSVGElement;
      if (!owner) {
        throw new Error(
          'Do not apply panzoom to the root <svg> element. ' +
          'Use its child instead (e.g. <g></g>). ' +
          'As of March 2016 only FireFox supported transform on the root element');
      }

      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getScreenCTM: getScreenCTM,
        getOwner: getOwner,
        applyTransform: applyTransform,
        initTransform: initTransform
      };
      
      return api;

      function getOwner() {
        return owner;
      }

      function getBBox() {
        var bbox =  svgElement.getBBox();
        return {
          left: bbox.x,
          top: bbox.y,
          width: bbox.width,
          height: bbox.height,
        };
      }

      function getScreenCTM() {
        var ctm = owner.getCTM();
        if (!ctm) {
          // This is likely firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=873106
          // The code below is not entirely correct, but still better than nothing
          return owner.getScreenCTM();
        }
        return ctm;
      }

      function initTransform(transform) {
        var screenCTM = svgElement.getCTM();

        // The above line returns null on Firefox
        if (screenCTM === null) {
          screenCTM = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
        }

        transform.x = screenCTM.e;
        transform.y = screenCTM.f;
        transform.scale = screenCTM.a;
        owner.removeAttributeNS(null, 'viewBox');
      }

      function applyTransform(transform) {
        svgElement.setAttribute('transform', 'matrix(' +
          transform.scale + ' 0 0 ' +
          transform.scale + ' ' +
          transform.x + ' ' + transform.y + ')');
      }
    }

    function isSVGElement(element) {
      return element && element.ownerSVGElement && element.getCTM;
    }
    svgController.canAttach = canAttach$1;

    var domController = makeDomController;

    var canAttach = isDomElement;

    function makeDomController(domElement, options) {
      var elementValid = isDomElement(domElement); 
      if (!elementValid) {
        throw new Error('panzoom requires DOM element to be attached to the DOM tree');
      }

      var owner = domElement.parentElement;
      domElement.scrollTop = 0;
      
      if (!options.disableKeyboardInteraction) {
        owner.setAttribute('tabindex', 0);
      }

      var api = {
        getBBox: getBBox,
        getOwner: getOwner,
        applyTransform: applyTransform,
      };
      
      return api;

      function getOwner() {
        return owner;
      }

      function getBBox() {
        // TODO: We should probably cache this?
        return  {
          left: 0,
          top: 0,
          width: domElement.clientWidth,
          height: domElement.clientHeight
        };
      }

      function applyTransform(transform) {
        // TODO: Should we cache this?
        domElement.style.transformOrigin = '0 0 0';
        domElement.style.transform = 'matrix(' +
          transform.scale + ', 0, 0, ' +
          transform.scale + ', ' +
          transform.x + ', ' + transform.y + ')';
      }
    }

    function isDomElement(element) {
      return element && element.parentElement && element.style;
    }
    domController.canAttach = canAttach;

    /**
     * Allows to drag and zoom svg elements
     */





    var domTextSelectionInterceptor = createTextSelectionInterceptor_1();
    var fakeTextSelectorInterceptor = createTextSelectionInterceptor_1(true);




    var defaultZoomSpeed = 1;
    var defaultDoubleTapZoomSpeed = 1.75;
    var doubleTapSpeedInMS = 300;

    var panzoom = createPanZoom;

    /**
     * Creates a new instance of panzoom, so that an object can be panned and zoomed
     *
     * @param {DOMElement} domElement where panzoom should be attached.
     * @param {Object} options that configure behavior.
     */
    function createPanZoom(domElement, options) {
      options = options || {};

      var panController = options.controller;

      if (!panController) {
        if (svgController.canAttach(domElement)) {
          panController = svgController(domElement, options);
        } else if (domController.canAttach(domElement)) {
          panController = domController(domElement, options);
        }
      }

      if (!panController) {
        throw new Error(
          'Cannot create panzoom for the current type of dom element'
        );
      }
      var owner = panController.getOwner();
      // just to avoid GC pressure, every time we do intermediate transform
      // we return this object. For internal use only. Never give it back to the consumer of this library
      var storedCTMResult = { x: 0, y: 0 };

      var isDirty = false;
      var transform$1 = new transform();

      if (panController.initTransform) {
        panController.initTransform(transform$1);
      }

      var filterKey = typeof options.filterKey === 'function' ? options.filterKey : noop;
      // TODO: likely need to unite pinchSpeed with zoomSpeed
      var pinchSpeed = typeof options.pinchSpeed === 'number' ? options.pinchSpeed : 1;
      var bounds = options.bounds;
      var maxZoom = typeof options.maxZoom === 'number' ? options.maxZoom : Number.POSITIVE_INFINITY;
      var minZoom = typeof options.minZoom === 'number' ? options.minZoom : 0;

      var boundsPadding = typeof options.boundsPadding === 'number' ? options.boundsPadding : 0.05;
      var zoomDoubleClickSpeed = typeof options.zoomDoubleClickSpeed === 'number' ? options.zoomDoubleClickSpeed : defaultDoubleTapZoomSpeed;
      var beforeWheel = options.beforeWheel || noop;
      var beforeMouseDown = options.beforeMouseDown || noop;
      var speed = typeof options.zoomSpeed === 'number' ? options.zoomSpeed : defaultZoomSpeed;
      var transformOrigin = parseTransformOrigin(options.transformOrigin);
      var textSelection = options.enableTextSelection ? fakeTextSelectorInterceptor : domTextSelectionInterceptor;

      validateBounds(bounds);

      if (options.autocenter) {
        autocenter();
      }

      var frameAnimation;
      var lastTouchEndTime = 0;
      var lastSingleFingerOffset;
      var touchInProgress = false;

      // We only need to fire panstart when actual move happens
      var panstartFired = false;

      // cache mouse coordinates here
      var mouseX;
      var mouseY;

      var pinchZoomLength;

      var smoothScroll;
      if ('smoothScroll' in options && !options.smoothScroll) {
        // If user explicitly asked us not to use smooth scrolling, we obey
        smoothScroll = rigidScroll();
      } else {
        // otherwise we use forward smoothScroll settings to kinetic API
        // which makes scroll smoothing.
        smoothScroll = kinetic_1(getPoint, scroll, options.smoothScroll);
      }

      var moveByAnimation;
      var zoomToAnimation;

      var multiTouch;
      var paused = false;

      listenForEvents();

      var api = {
        dispose: dispose,
        moveBy: internalMoveBy,
        moveTo: moveTo,
        smoothMoveTo: smoothMoveTo, 
        centerOn: centerOn,
        zoomTo: publicZoomTo,
        zoomAbs: zoomAbs,
        smoothZoom: smoothZoom,
        smoothZoomAbs: smoothZoomAbs,
        showRectangle: showRectangle,

        pause: pause,
        resume: resume,
        isPaused: isPaused,

        getTransform: getTransformModel,

        getMinZoom: getMinZoom,
        setMinZoom: setMinZoom,

        getMaxZoom: getMaxZoom,
        setMaxZoom: setMaxZoom,

        getTransformOrigin: getTransformOrigin,
        setTransformOrigin: setTransformOrigin,

        getZoomSpeed: getZoomSpeed,
        setZoomSpeed: setZoomSpeed
      };

      ngraph_events(api);
      
      var initialX = typeof options.initialX === 'number' ? options.initialX : transform$1.x;
      var initialY = typeof options.initialY === 'number' ? options.initialY : transform$1.y;
      var initialZoom = typeof options.initialZoom === 'number' ? options.initialZoom : transform$1.scale;

      if(initialX != transform$1.x || initialY != transform$1.y || initialZoom != transform$1.scale){
        zoomAbs(initialX, initialY, initialZoom);
      }

      return api;

      function pause() {
        releaseEvents();
        paused = true;
      }

      function resume() {
        if (paused) {
          listenForEvents();
          paused = false;
        }
      }

      function isPaused() {
        return paused;
      }

      function showRectangle(rect) {
        // TODO: this duplicates autocenter. I think autocenter should go.
        var clientRect = owner.getBoundingClientRect();
        var size = transformToScreen(clientRect.width, clientRect.height);

        var rectWidth = rect.right - rect.left;
        var rectHeight = rect.bottom - rect.top;
        if (!Number.isFinite(rectWidth) || !Number.isFinite(rectHeight)) {
          throw new Error('Invalid rectangle');
        }

        var dw = size.x / rectWidth;
        var dh = size.y / rectHeight;
        var scale = Math.min(dw, dh);
        transform$1.x = -(rect.left + rectWidth / 2) * scale + size.x / 2;
        transform$1.y = -(rect.top + rectHeight / 2) * scale + size.y / 2;
        transform$1.scale = scale;
      }

      function transformToScreen(x, y) {
        if (panController.getScreenCTM) {
          var parentCTM = panController.getScreenCTM();
          var parentScaleX = parentCTM.a;
          var parentScaleY = parentCTM.d;
          var parentOffsetX = parentCTM.e;
          var parentOffsetY = parentCTM.f;
          storedCTMResult.x = x * parentScaleX - parentOffsetX;
          storedCTMResult.y = y * parentScaleY - parentOffsetY;
        } else {
          storedCTMResult.x = x;
          storedCTMResult.y = y;
        }

        return storedCTMResult;
      }

      function autocenter() {
        var w; // width of the parent
        var h; // height of the parent
        var left = 0;
        var top = 0;
        var sceneBoundingBox = getBoundingBox();
        if (sceneBoundingBox) {
          // If we have bounding box - use it.
          left = sceneBoundingBox.left;
          top = sceneBoundingBox.top;
          w = sceneBoundingBox.right - sceneBoundingBox.left;
          h = sceneBoundingBox.bottom - sceneBoundingBox.top;
        } else {
          // otherwise just use whatever space we have
          var ownerRect = owner.getBoundingClientRect();
          w = ownerRect.width;
          h = ownerRect.height;
        }
        var bbox = panController.getBBox();
        if (bbox.width === 0 || bbox.height === 0) {
          // we probably do not have any elements in the SVG
          // just bail out;
          return;
        }
        var dh = h / bbox.height;
        var dw = w / bbox.width;
        var scale = Math.min(dw, dh);
        transform$1.x = -(bbox.left + bbox.width / 2) * scale + w / 2 + left;
        transform$1.y = -(bbox.top + bbox.height / 2) * scale + h / 2 + top;
        transform$1.scale = scale;
      }

      function getTransformModel() {
        // TODO: should this be read only?
        return transform$1;
      }

      function getMinZoom() {
        return minZoom;
      }

      function setMinZoom(newMinZoom) {
        minZoom = newMinZoom;
      }

      function getMaxZoom() {
        return maxZoom;
      }

      function setMaxZoom(newMaxZoom) {
        maxZoom = newMaxZoom;
      }

      function getTransformOrigin() {
        return transformOrigin;
      }

      function setTransformOrigin(newTransformOrigin) {
        transformOrigin = parseTransformOrigin(newTransformOrigin);
      }

      function getZoomSpeed() {
        return speed;
      }

      function setZoomSpeed(newSpeed) {
        if (!Number.isFinite(newSpeed)) {
          throw new Error('Zoom speed should be a number');
        }
        speed = newSpeed;
      }

      function getPoint() {
        return {
          x: transform$1.x,
          y: transform$1.y
        };
      }

      function moveTo(x, y) {
        transform$1.x = x;
        transform$1.y = y;

        keepTransformInsideBounds();

        triggerEvent('pan');
        makeDirty();
      }

      function moveBy(dx, dy) {
        moveTo(transform$1.x + dx, transform$1.y + dy);
      }

      function keepTransformInsideBounds() {
        var boundingBox = getBoundingBox();
        if (!boundingBox) return;

        var adjusted = false;
        var clientRect = getClientRect();

        var diff = boundingBox.left - clientRect.right;
        if (diff > 0) {
          transform$1.x += diff;
          adjusted = true;
        }
        // check the other side:
        diff = boundingBox.right - clientRect.left;
        if (diff < 0) {
          transform$1.x += diff;
          adjusted = true;
        }

        // y axis:
        diff = boundingBox.top - clientRect.bottom;
        if (diff > 0) {
          // we adjust transform, so that it matches exactly our bounding box:
          // transform.y = boundingBox.top - (boundingBox.height + boundingBox.y) * transform.scale =>
          // transform.y = boundingBox.top - (clientRect.bottom - transform.y) =>
          // transform.y = diff + transform.y =>
          transform$1.y += diff;
          adjusted = true;
        }

        diff = boundingBox.bottom - clientRect.top;
        if (diff < 0) {
          transform$1.y += diff;
          adjusted = true;
        }
        return adjusted;
      }

      /**
       * Returns bounding box that should be used to restrict scene movement.
       */
      function getBoundingBox() {
        if (!bounds) return; // client does not want to restrict movement

        if (typeof bounds === 'boolean') {
          // for boolean type we use parent container bounds
          var ownerRect = owner.getBoundingClientRect();
          var sceneWidth = ownerRect.width;
          var sceneHeight = ownerRect.height;

          return {
            left: sceneWidth * boundsPadding,
            top: sceneHeight * boundsPadding,
            right: sceneWidth * (1 - boundsPadding),
            bottom: sceneHeight * (1 - boundsPadding)
          };
        }

        return bounds;
      }

      function getClientRect() {
        var bbox = panController.getBBox();
        var leftTop = client(bbox.left, bbox.top);

        return {
          left: leftTop.x,
          top: leftTop.y,
          right: bbox.width * transform$1.scale + leftTop.x,
          bottom: bbox.height * transform$1.scale + leftTop.y
        };
      }

      function client(x, y) {
        return {
          x: x * transform$1.scale + transform$1.x,
          y: y * transform$1.scale + transform$1.y
        };
      }

      function makeDirty() {
        isDirty = true;
        frameAnimation = window.requestAnimationFrame(frame);
      }

      function zoomByRatio(clientX, clientY, ratio) {
        if (isNaN(clientX) || isNaN(clientY) || isNaN(ratio)) {
          throw new Error('zoom requires valid numbers');
        }

        var newScale = transform$1.scale * ratio;

        if (newScale < minZoom) {
          if (transform$1.scale === minZoom) return;

          ratio = minZoom / transform$1.scale;
        }
        if (newScale > maxZoom) {
          if (transform$1.scale === maxZoom) return;

          ratio = maxZoom / transform$1.scale;
        }

        var size = transformToScreen(clientX, clientY);

        transform$1.x = size.x - ratio * (size.x - transform$1.x);
        transform$1.y = size.y - ratio * (size.y - transform$1.y);

        // TODO: https://github.com/anvaka/panzoom/issues/112
        if (bounds && boundsPadding === 1 && minZoom === 1) {
          transform$1.scale *= ratio;
          keepTransformInsideBounds();
        } else {
          var transformAdjusted = keepTransformInsideBounds();
          if (!transformAdjusted) transform$1.scale *= ratio;
        }

        triggerEvent('zoom');

        makeDirty();
      }

      function zoomAbs(clientX, clientY, zoomLevel) {
        var ratio = zoomLevel / transform$1.scale;
        zoomByRatio(clientX, clientY, ratio);
      }

      function centerOn(ui) {
        var parent = ui.ownerSVGElement;
        if (!parent)
          throw new Error('ui element is required to be within the scene');

        // TODO: should i use controller's screen CTM?
        var clientRect = ui.getBoundingClientRect();
        var cx = clientRect.left + clientRect.width / 2;
        var cy = clientRect.top + clientRect.height / 2;

        var container = parent.getBoundingClientRect();
        var dx = container.width / 2 - cx;
        var dy = container.height / 2 - cy;

        internalMoveBy(dx, dy, true);
      }

      function smoothMoveTo(x, y){
        internalMoveBy(x - transform$1.x, y - transform$1.y, true);
      }

      function internalMoveBy(dx, dy, smooth) {
        if (!smooth) {
          return moveBy(dx, dy);
        }

        if (moveByAnimation) moveByAnimation.cancel();

        var from = { x: 0, y: 0 };
        var to = { x: dx, y: dy };
        var lastX = 0;
        var lastY = 0;

        moveByAnimation = amator(from, to, {
          step: function (v) {
            moveBy(v.x - lastX, v.y - lastY);

            lastX = v.x;
            lastY = v.y;
          }
        });
      }

      function scroll(x, y) {
        cancelZoomAnimation();
        moveTo(x, y);
      }

      function dispose() {
        releaseEvents();
      }

      function listenForEvents() {
        owner.addEventListener('mousedown', onMouseDown, { passive: false });
        owner.addEventListener('dblclick', onDoubleClick, { passive: false });
        owner.addEventListener('touchstart', onTouch, { passive: false });
        owner.addEventListener('keydown', onKeyDown, { passive: false });

        // Need to listen on the owner container, so that we are not limited
        // by the size of the scrollable domElement
        wheel.addWheelListener(owner, onMouseWheel, { passive: false });

        makeDirty();
      }

      function releaseEvents() {
        wheel.removeWheelListener(owner, onMouseWheel);
        owner.removeEventListener('mousedown', onMouseDown);
        owner.removeEventListener('keydown', onKeyDown);
        owner.removeEventListener('dblclick', onDoubleClick);
        owner.removeEventListener('touchstart', onTouch);

        if (frameAnimation) {
          window.cancelAnimationFrame(frameAnimation);
          frameAnimation = 0;
        }

        smoothScroll.cancel();

        releaseDocumentMouse();
        releaseTouches();
        textSelection.release();

        triggerPanEnd();
      }

      function frame() {
        if (isDirty) applyTransform();
      }

      function applyTransform() {
        isDirty = false;

        // TODO: Should I allow to cancel this?
        panController.applyTransform(transform$1);

        triggerEvent('transform');
        frameAnimation = 0;
      }

      function onKeyDown(e) {
        var x = 0,
          y = 0,
          z = 0;
        if (e.keyCode === 38) {
          y = 1; // up
        } else if (e.keyCode === 40) {
          y = -1; // down
        } else if (e.keyCode === 37) {
          x = 1; // left
        } else if (e.keyCode === 39) {
          x = -1; // right
        } else if (e.keyCode === 189 || e.keyCode === 109) {
          // DASH or SUBTRACT
          z = 1; // `-` -  zoom out
        } else if (e.keyCode === 187 || e.keyCode === 107) {
          // EQUAL SIGN or ADD
          z = -1; // `=` - zoom in (equal sign on US layout is under `+`)
        }

        if (filterKey(e, x, y, z)) {
          // They don't want us to handle the key: https://github.com/anvaka/panzoom/issues/45
          return;
        }

        if (x || y) {
          e.preventDefault();
          e.stopPropagation();

          var clientRect = owner.getBoundingClientRect();
          // movement speed should be the same in both X and Y direction:
          var offset = Math.min(clientRect.width, clientRect.height);
          var moveSpeedRatio = 0.05;
          var dx = offset * moveSpeedRatio * x;
          var dy = offset * moveSpeedRatio * y;

          // TODO: currently we do not animate this. It could be better to have animation
          internalMoveBy(dx, dy);
        }

        if (z) {
          var scaleMultiplier = getScaleMultiplier(z * 100);
          var offset = transformOrigin ? getTransformOriginOffset() : midPoint();
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
        }
      }

      function midPoint() {
        var ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width / 2,
          y: ownerRect.height / 2
        };
      }

      function onTouch(e) {
        // let the override the touch behavior
        beforeTouch(e);

        if (e.touches.length === 1) {
          return handleSingleFingerTouch(e, e.touches[0]);
        } else if (e.touches.length === 2) {
          // handleTouchMove() will care about pinch zoom.
          pinchZoomLength = getPinchZoomLength(e.touches[0], e.touches[1]);
          multiTouch = true;
          startTouchListenerIfNeeded();
        }
      }

      function beforeTouch(e) {
        // TODO: Need to unify this filtering names. E.g. use `beforeTouch`
        if (options.onTouch && !options.onTouch(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/12
          return;
        }

        e.stopPropagation();
        e.preventDefault();
      }

      function beforeDoubleClick(e) {
        // TODO: Need to unify this filtering names. E.g. use `beforeDoubleClick``
        if (options.onDoubleClick && !options.onDoubleClick(e)) {
          // if they return `false` from onTouch, we don't want to stop
          // events propagation. Fixes https://github.com/anvaka/panzoom/issues/46
          return;
        }

        e.preventDefault();
        e.stopPropagation();
      }

      function handleSingleFingerTouch(e) {
        var touch = e.touches[0];
        var offset = getOffsetXY(touch);
        lastSingleFingerOffset = offset;
        var point = transformToScreen(offset.x, offset.y);
        mouseX = point.x;
        mouseY = point.y;

        smoothScroll.cancel();
        startTouchListenerIfNeeded();
      }

      function startTouchListenerIfNeeded() {
        if (touchInProgress) {
          // no need to do anything, as we already listen to events;
          return;
        }

        touchInProgress = true;
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
      }

      function handleTouchMove(e) {
        if (e.touches.length === 1) {
          e.stopPropagation();
          var touch = e.touches[0];

          var offset = getOffsetXY(touch);
          var point = transformToScreen(offset.x, offset.y);

          var dx = point.x - mouseX;
          var dy = point.y - mouseY;

          if (dx !== 0 && dy !== 0) {
            triggerPanStart();
          }
          mouseX = point.x;
          mouseY = point.y;
          internalMoveBy(dx, dy);
        } else if (e.touches.length === 2) {
          // it's a zoom, let's find direction
          multiTouch = true;
          var t1 = e.touches[0];
          var t2 = e.touches[1];
          var currentPinchLength = getPinchZoomLength(t1, t2);

          // since the zoom speed is always based on distance from 1, we need to apply
          // pinch speed only on that distance from 1:
          var scaleMultiplier =
            1 + (currentPinchLength / pinchZoomLength - 1) * pinchSpeed;

          var firstTouchPoint = getOffsetXY(t1);
          var secondTouchPoint = getOffsetXY(t2);
          mouseX = (firstTouchPoint.x + secondTouchPoint.x) / 2;
          mouseY = (firstTouchPoint.y + secondTouchPoint.y) / 2;
          if (transformOrigin) {
            var offset = getTransformOriginOffset();
            mouseX = offset.x;
            mouseY = offset.y;
          }

          publicZoomTo(mouseX, mouseY, scaleMultiplier);

          pinchZoomLength = currentPinchLength;
          e.stopPropagation();
          e.preventDefault();
        }
      }

      function handleTouchEnd(e) {
        if (e.touches.length > 0) {
          var offset = getOffsetXY(e.touches[0]);
          var point = transformToScreen(offset.x, offset.y);
          mouseX = point.x;
          mouseY = point.y;
        } else {
          var now = new Date();
          if (now - lastTouchEndTime < doubleTapSpeedInMS) {
            if (transformOrigin) {
              var offset = getTransformOriginOffset();
              smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);
            } else {
              // We want untransformed x/y here.
              smoothZoom(lastSingleFingerOffset.x, lastSingleFingerOffset.y, zoomDoubleClickSpeed);
            }
          }

          lastTouchEndTime = now;

          triggerPanEnd();
          releaseTouches();
        }
      }

      function getPinchZoomLength(finger1, finger2) {
        var dx = finger1.clientX - finger2.clientX;
        var dy = finger1.clientY - finger2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }

      function onDoubleClick(e) {
        beforeDoubleClick(e);
        var offset = getOffsetXY(e);
        if (transformOrigin) {
          // TODO: looks like this is duplicated in the file.
          // Need to refactor
          offset = getTransformOriginOffset();
        }
        smoothZoom(offset.x, offset.y, zoomDoubleClickSpeed);
      }

      function onMouseDown(e) {
        // if client does not want to handle this event - just ignore the call
        if (beforeMouseDown(e)) return;

        if (touchInProgress) {
          // modern browsers will fire mousedown for touch events too
          // we do not want this: touch is handled separately.
          e.stopPropagation();
          return false;
        }
        // for IE, left click == 1
        // for Firefox, left click == 0
        var isLeftButton =
          (e.button === 1 && window.event !== null) || e.button === 0;
        if (!isLeftButton) return;

        smoothScroll.cancel();

        var offset = getOffsetXY(e);
        var point = transformToScreen(offset.x, offset.y);
        mouseX = point.x;
        mouseY = point.y;

        // We need to listen on document itself, since mouse can go outside of the
        // window, and we will loose it
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        textSelection.capture(e.target || e.srcElement);

        return false;
      }

      function onMouseMove(e) {
        // no need to worry about mouse events when touch is happening
        if (touchInProgress) return;

        triggerPanStart();

        var offset = getOffsetXY(e);
        var point = transformToScreen(offset.x, offset.y);
        var dx = point.x - mouseX;
        var dy = point.y - mouseY;

        mouseX = point.x;
        mouseY = point.y;

        internalMoveBy(dx, dy);
      }

      function onMouseUp() {
        textSelection.release();
        triggerPanEnd();
        releaseDocumentMouse();
      }

      function releaseDocumentMouse() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        panstartFired = false;
      }

      function releaseTouches() {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchEnd);
        panstartFired = false;
        multiTouch = false;
        touchInProgress = false;
      }

      function onMouseWheel(e) {
        // if client does not want to handle this event - just ignore the call
        if (beforeWheel(e)) return;

        smoothScroll.cancel();

        var delta = e.deltaY;
        if (e.deltaMode > 0) delta *= 100;

        var scaleMultiplier = getScaleMultiplier(delta);

        if (scaleMultiplier !== 1) {
          var offset = transformOrigin
            ? getTransformOriginOffset()
            : getOffsetXY(e);
          publicZoomTo(offset.x, offset.y, scaleMultiplier);
          e.preventDefault();
        }
      }

      function getOffsetXY(e) {
        var offsetX, offsetY;
        // I tried using e.offsetX, but that gives wrong results for svg, when user clicks on a path.
        var ownerRect = owner.getBoundingClientRect();
        offsetX = e.clientX - ownerRect.left;
        offsetY = e.clientY - ownerRect.top;

        return { x: offsetX, y: offsetY };
      }

      function smoothZoom(clientX, clientY, scaleMultiplier) {
        var fromValue = transform$1.scale;
        var from = { scale: fromValue };
        var to = { scale: scaleMultiplier * fromValue };

        smoothScroll.cancel();
        cancelZoomAnimation();

        zoomToAnimation = amator(from, to, {
          step: function (v) {
            zoomAbs(clientX, clientY, v.scale);
          },
          done: triggerZoomEnd
        });
      }

      function smoothZoomAbs(clientX, clientY, toScaleValue) {
        var fromValue = transform$1.scale;
        var from = { scale: fromValue };
        var to = { scale: toScaleValue };

        smoothScroll.cancel();
        cancelZoomAnimation();

        zoomToAnimation = amator(from, to, {
          step: function (v) {
            zoomAbs(clientX, clientY, v.scale);
          }
        });
      }

      function getTransformOriginOffset() {
        var ownerRect = owner.getBoundingClientRect();
        return {
          x: ownerRect.width * transformOrigin.x,
          y: ownerRect.height * transformOrigin.y
        };
      }

      function publicZoomTo(clientX, clientY, scaleMultiplier) {
        smoothScroll.cancel();
        cancelZoomAnimation();
        return zoomByRatio(clientX, clientY, scaleMultiplier);
      }

      function cancelZoomAnimation() {
        if (zoomToAnimation) {
          zoomToAnimation.cancel();
          zoomToAnimation = null;
        }
      }

      function getScaleMultiplier(delta) {
        var sign = Math.sign(delta);
        var deltaAdjustedSpeed = Math.min(0.25, Math.abs(speed * delta / 128));
        return 1 - sign * deltaAdjustedSpeed;
      }

      function triggerPanStart() {
        if (!panstartFired) {
          triggerEvent('panstart');
          panstartFired = true;
          smoothScroll.start();
        }
      }

      function triggerPanEnd() {
        if (panstartFired) {
          // we should never run smooth scrolling if it was multiTouch (pinch zoom animation):
          if (!multiTouch) smoothScroll.stop();
          triggerEvent('panend');
        }
      }

      function triggerZoomEnd() {
        triggerEvent('zoomend');
      }

      function triggerEvent(name) {
        api.fire(name, api);
      }
    }

    function parseTransformOrigin(options) {
      if (!options) return;
      if (typeof options === 'object') {
        if (!isNumber(options.x) || !isNumber(options.y))
          failTransformOrigin(options);
        return options;
      }

      failTransformOrigin();
    }

    function failTransformOrigin(options) {
      console.error(options);
      throw new Error(
        [
          'Cannot parse transform origin.',
          'Some good examples:',
          '  "center center" can be achieved with {x: 0.5, y: 0.5}',
          '  "top center" can be achieved with {x: 0.5, y: 0}',
          '  "bottom right" can be achieved with {x: 1, y: 1}'
        ].join('\n')
      );
    }

    function noop() { }

    function validateBounds(bounds) {
      var boundsType = typeof bounds;
      if (boundsType === 'undefined' || boundsType === 'boolean') return; // this is okay
      // otherwise need to be more thorough:
      var validBounds =
        isNumber(bounds.left) &&
        isNumber(bounds.top) &&
        isNumber(bounds.bottom) &&
        isNumber(bounds.right);

      if (!validBounds)
        throw new Error(
          'Bounds object is not valid. It can be: ' +
          'undefined, boolean (true|false) or an object {left, top, right, bottom}'
        );
    }

    function isNumber(x) {
      return Number.isFinite(x);
    }

    // IE 11 does not support isNaN:
    function isNaN(value) {
      if (Number.isNaN) {
        return Number.isNaN(value);
      }

      return value !== value;
    }

    function rigidScroll() {
      return {
        start: noop,
        stop: noop,
        cancel: noop
      };
    }

    function autoRun() {
      if (typeof document === 'undefined') return;

      var scripts = document.getElementsByTagName('script');
      if (!scripts) return;
      var panzoomScript;

      for (var i = 0; i < scripts.length; ++i) {
        var x = scripts[i];
        if (x.src && x.src.match(/\bpanzoom(\.min)?\.js/)) {
          panzoomScript = x;
          break;
        }
      }

      if (!panzoomScript) return;

      var query = panzoomScript.getAttribute('query');
      if (!query) return;

      var globalName = panzoomScript.getAttribute('name') || 'pz';
      var started = Date.now();

      tryAttach();

      function tryAttach() {
        var el = document.querySelector(query);
        if (!el) {
          var now = Date.now();
          var elapsed = now - started;
          if (elapsed < 2000) {
            // Let's wait a bit
            setTimeout(tryAttach, 100);
            return;
          }
          // If we don't attach within 2 seconds to the target element, consider it a failure
          console.error('Cannot find the panzoom element', globalName);
          return;
        }
        var options = collectOptions(panzoomScript);
        console.log(options);
        window[globalName] = createPanZoom(el, options);
      }

      function collectOptions(script) {
        var attrs = script.attributes;
        var options = {};
        for (var j = 0; j < attrs.length; ++j) {
          var attr = attrs[j];
          var nameValue = getPanzoomAttributeNameValue(attr);
          if (nameValue) {
            options[nameValue.name] = nameValue.value;
          }
        }

        return options;
      }

      function getPanzoomAttributeNameValue(attr) {
        if (!attr.name) return;
        var isPanZoomAttribute =
          attr.name[0] === 'p' && attr.name[1] === 'z' && attr.name[2] === '-';

        if (!isPanZoomAttribute) return;

        var name = attr.name.substr(3);
        var value = JSON.parse(attr.value);
        return { name: name, value: value };
      }
    }

    autoRun();

    /* src\components\Seating.svelte generated by Svelte v3.44.3 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\Seating.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (189:4) {#each tables as table, i}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let tabledouble;
    	let t;
    	let current;
    	let mounted;
    	let dispose;

    	function func(...args) {
    		return /*func*/ ctx[10](/*i*/ ctx[23], ...args);
    	}

    	tabledouble = new Table({
    			props: {
    				highlighted: /*hoverIndex*/ ctx[1] === /*i*/ ctx[23],
    				selected: /*selected*/ ctx[0].findIndex(func) > -1,
    				disabled: /*table*/ ctx[21].disabled
    			},
    			$$inline: true
    		});

    	function click_handler() {
    		return /*click_handler*/ ctx[11](/*i*/ ctx[23]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(tabledouble.$$.fragment);
    			t = space();
    			attr_dev(div0, "class", "svelte-6ges1p");
    			toggle_class(div0, "rotated", /*table*/ ctx[21].rotate);
    			add_location(div0, file$1, 193, 12, 5863);
    			attr_dev(div1, "class", "flex justify-center");
    			attr_dev(div1, "style", /*computeGridProperties*/ ctx[5](/*table*/ ctx[21].start, /*table*/ ctx[21].span));
    			add_location(div1, file$1, 189, 8, 5725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(tabledouble, div0, null);
    			append_dev(div1, t);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "mouseenter", /*hover*/ ctx[6](/*i*/ ctx[23]), false, false, false),
    					listen_dev(div0, "mouseleave", /*unhover*/ ctx[7](/*i*/ ctx[23]), false, false, false),
    					listen_dev(div0, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const tabledouble_changes = {};
    			if (dirty & /*hoverIndex*/ 2) tabledouble_changes.highlighted = /*hoverIndex*/ ctx[1] === /*i*/ ctx[23];
    			if (dirty & /*selected*/ 1) tabledouble_changes.selected = /*selected*/ ctx[0].findIndex(func) > -1;
    			tabledouble.$set(tabledouble_changes);
    		},
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
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(189:4) {#each tables as table, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let div0;
    	let bar;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let current;
    	bar = new Bar({ props: { x: 0, y: 0 }, $$inline: true });
    	let each_value = /*tables*/ ctx[4];
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
    			div3 = element("div");
    			div0 = element("div");
    			create_component(bar.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "bar svelte-6ges1p");
    			add_location(div0, file$1, 181, 4, 5475);
    			attr_dev(div1, "class", "wall svelte-6ges1p");
    			set_style(div1, "grid-column", "1 / 32");
    			set_style(div1, "grid-row", "1 / 14");
    			add_location(div1, file$1, 185, 4, 5541);
    			attr_dev(div2, "class", "wall svelte-6ges1p");
    			set_style(div2, "grid-column", "1 / 13");
    			set_style(div2, "grid-row", "1 / 14");
    			add_location(div2, file$1, 186, 4, 5614);
    			attr_dev(div3, "class", "grid items-center p-3 svelte-6ges1p");
    			attr_dev(div3, "id", "grid-container");
    			set_style(div3, "--cell-size", TABLE_SIZE + "px");
    			add_location(div3, file$1, 175, 0, 5334);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(bar, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div3, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			/*div3_binding*/ ctx[12](div3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*computeGridProperties, tables, hover, unhover, handleSelection, hoverIndex, selected*/ 251) {
    				each_value = /*tables*/ ctx[4];
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
    						each_blocks[i].m(div3, null);
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
    			transition_in(bar.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bar.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(bar);
    			destroy_each(each_blocks, detaching);
    			/*div3_binding*/ ctx[12](null);
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
    	let tableCount;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Seating', slots, []);
    	let { selected } = $$props;
    	let { personCount } = $$props;

    	const handleSelection = index => {
    		const isDisabled = tableData[index][3] === true;
    		if (isDisabled) return;
    		const i = selected.findIndex(s => s === index);

    		if (i > -1) {
    			// Removes item from selected list if it has already been selected before
    			$$invalidate(0, selected = [...selected.slice(0, i), ...selected.slice(i + 1)]);

    			return;
    		}

    		$$invalidate(0, selected = [...selected, index]);
    	};

    	const randomlyDisable = () => Math.random() > 0.9;
    	var Direction;

    	(function (Direction) {
    		Direction[Direction["HORIZONTAL"] = 0] = "HORIZONTAL";
    		Direction[Direction["VERTICAL"] = 1] = "VERTICAL";
    	})(Direction || (Direction = {}));

    	const h = Direction.HORIZONTAL;
    	const v = Direction.VERTICAL;

    	// Creates vertical line of tables. The indivual tables are aligned based on `direction`.
    	// The upper-most table (marked as `Y` in drawing below) will be placed at the specified starting point
    	// If direction is vertical, one free space is added between each table
    	//
    	// (count: 4, direction: horitonal):
    	//  oYo
    	//  oXo
    	//  oXo
    	//  oXo
    	//
    	// (count: 2, direction: vertical):
    	//  o
    	//  Y
    	//  o
    	//
    	//  o
    	//  X
    	//  o
    	//
    	const lineV = (start, count, direction = h) => {
    		const factor = direction === v ? 3 : 1;
    		return Array(count).fill(0).map((_, i) => [start.x, start.y + i * factor, direction, randomlyDisable()]);
    	};

    	// Creates horizontal line of tables. The indivual tables are aligned based on `direction`
    	// The left-most table (marked as `Y` in drawing below) will be placed at the specified starting point
    	// If direction is horizontal, one free space is added between each table.
    	//
    	// (count: 4, direction: vertical):
    	//  o o o o
    	//  Y|X|X|X
    	//  o o o o
    	//
    	// (count: 4, direction: horizontal):
    	//  oYo | oXo | oXo | oXo
    	//
    	const lineH = (start, count, direction = v) => {
    		const factor = direction === v ? 1 : 3;
    		return Array(count).fill(0).map((_, i) => [start.x + i * factor, start.y, direction, randomlyDisable()]);
    	};

    	// Creates two double tables (á 2 spaces) with 2 free spaces in between (6x3 spaces total).
    	// The left-most table (marked as `Y` in drawing below) will be placed at the specified starting point
    	//
    	//  o o     o o  1
    	//  Y|X| | |X|X  2
    	//  o o     o o  3
    	//
    	//  1 2 3 4 5 6
    	//
    	// If direction is set to VERTICAL, the same description applies with x and y being flipped
    	// and the top-most table being placed at the starting point
    	//
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
    		...lineH({ x: 1, y: 1 }, 4, h),
    		// left
    		...lineV({ x: 1, y: 4 }, 3, v),
    		// middle top
    		...doubleWithSpace({ x: 6, y: 6 }, h),
    		...doubleWithSpace({ x: 12, y: 6 }, h),
    		// middle bottom
    		...doubleWithSpace({ x: 6, y: 9 }, h),
    		...doubleWithSpace({ x: 12, y: 9 }, h),
    		// bottom
    		...lineH({ x: 7, y: 12 }, 4, h),
    		// right
    		...doubleWithSpace({ x: 22, y: 6 }, h),
    		...doubleWithSpace({ x: 22, y: 9 }, h),
    		...lineH({ x: 23, y: 12 }, 2, h),
    		// === Outside ===
    		// left
    		...lineV({ x: 1, y: 16 }, 2, v),
    		...lineV({ x: 5, y: 16 }, 2, v),
    		// center
    		...doubleWithSpace({ x: 9, y: 15 }, v),
    		...doubleWithSpace({ x: 14, y: 15 }, v),
    		// right
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

    	let hoverIndex = null;

    	const hover = index => () => {
    		$$invalidate(1, hoverIndex = index);
    	};

    	const unhover = index => () => {
    		if (index === hoverIndex) {
    			$$invalidate(1, hoverIndex = null);
    		}
    	};

    	let container;

    	onMount(() => {
    		panzoom(container);
    	});

    	const writable_props = ['selected', 'personCount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Seating> was created with unknown prop '${key}'`);
    	});

    	const func = (i, s) => s === i;
    	const click_handler = i => handleSelection(i);

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			container = $$value;
    			$$invalidate(2, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('personCount' in $$props) $$invalidate(8, personCount = $$props.personCount);
    	};

    	$$self.$capture_state = () => ({
    		TABLE_SIZE,
    		TableDouble: Table,
    		Bar,
    		createPanZoom: panzoom,
    		onMount,
    		selected,
    		personCount,
    		handleSelection,
    		randomlyDisable,
    		SVG_IS_VERTICAL,
    		Direction,
    		h,
    		v,
    		lineV,
    		lineH,
    		doubleWithSpace,
    		tableData,
    		tables,
    		computeGridProperties,
    		hoverIndex,
    		hover,
    		unhover,
    		container,
    		tableCount
    	});

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('personCount' in $$props) $$invalidate(8, personCount = $$props.personCount);
    		if ('Direction' in $$props) Direction = $$props.Direction;
    		if ('hoverIndex' in $$props) $$invalidate(1, hoverIndex = $$props.hoverIndex);
    		if ('container' in $$props) $$invalidate(2, container = $$props.container);
    		if ('tableCount' in $$props) $$invalidate(9, tableCount = $$props.tableCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*personCount*/ 256) {
    			// number of tables the visitor is allowed to select based on person count
    			$$invalidate(9, tableCount = Math.ceil(personCount / 2));
    		}

    		if ($$self.$$.dirty & /*tableCount, selected*/ 513) {
    			{
    				console.log(`tableCount: ${tableCount}`);
    				$$invalidate(0, selected = selected.slice(-tableCount));
    				console.log(`Selection length: ${selected.length}`);
    			}
    		}
    	};

    	return [
    		selected,
    		hoverIndex,
    		container,
    		handleSelection,
    		tables,
    		computeGridProperties,
    		hover,
    		unhover,
    		personCount,
    		tableCount,
    		func,
    		click_handler,
    		div3_binding
    	];
    }

    class Seating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { selected: 0, personCount: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Seating",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selected*/ ctx[0] === undefined && !('selected' in props)) {
    			console_1.warn("<Seating> was created without expected prop 'selected'");
    		}

    		if (/*personCount*/ ctx[8] === undefined && !('personCount' in props)) {
    			console_1.warn("<Seating> was created without expected prop 'personCount'");
    		}
    	}

    	get selected() {
    		throw new Error("<Seating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Seating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get personCount() {
    		throw new Error("<Seating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set personCount(value) {
    		throw new Error("<Seating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    	let div1;
    	let div0;
    	let seatingplan;
    	let updating_selected;
    	let t2;
    	let panel;
    	let updating_personCount;
    	let updating_dishCount;
    	let current;
    	globalstyle = new Style({ $$inline: true });
    	header = new Header({ $$inline: true });

    	function seatingplan_selected_binding(value) {
    		/*seatingplan_selected_binding*/ ctx[3](value);
    	}

    	let seatingplan_props = { personCount: /*personCount*/ ctx[0] };

    	if (/*selected*/ ctx[2] !== void 0) {
    		seatingplan_props.selected = /*selected*/ ctx[2];
    	}

    	seatingplan = new Seating({ props: seatingplan_props, $$inline: true });
    	binding_callbacks.push(() => bind(seatingplan, 'selected', seatingplan_selected_binding));

    	function panel_personCount_binding(value) {
    		/*panel_personCount_binding*/ ctx[4](value);
    	}

    	function panel_dishCount_binding(value) {
    		/*panel_dishCount_binding*/ ctx[5](value);
    	}

    	let panel_props = {
    		selectionCount: /*selected*/ ctx[2].length
    	};

    	if (/*personCount*/ ctx[0] !== void 0) {
    		panel_props.personCount = /*personCount*/ ctx[0];
    	}

    	if (/*dishCount*/ ctx[1] !== void 0) {
    		panel_props.dishCount = /*dishCount*/ ctx[1];
    	}

    	panel = new Panel({ props: panel_props, $$inline: true });
    	binding_callbacks.push(() => bind(panel, 'personCount', panel_personCount_binding));
    	binding_callbacks.push(() => bind(panel, 'dishCount', panel_dishCount_binding));

    	const block = {
    		c: function create() {
    			create_component(globalstyle.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(seatingplan.$$.fragment);
    			t2 = space();
    			create_component(panel.$$.fragment);
    			attr_dev(div0, "class", "flex flex-1 bg-gray-50 overflow-hidden inner-shadow outline-none svelte-16hnasd");
    			add_location(div0, file, 13, 2, 398);
    			attr_dev(div1, "class", "flex flex-row flex-1");
    			add_location(div1, file, 12, 1, 360);
    			attr_dev(main, "class", "flex flex-col h-screen");
    			add_location(main, file, 10, 0, 307);
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
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			mount_component(seatingplan, div0, null);
    			append_dev(div1, t2);
    			mount_component(panel, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const seatingplan_changes = {};
    			if (dirty & /*personCount*/ 1) seatingplan_changes.personCount = /*personCount*/ ctx[0];

    			if (!updating_selected && dirty & /*selected*/ 4) {
    				updating_selected = true;
    				seatingplan_changes.selected = /*selected*/ ctx[2];
    				add_flush_callback(() => updating_selected = false);
    			}

    			seatingplan.$set(seatingplan_changes);
    			const panel_changes = {};
    			if (dirty & /*selected*/ 4) panel_changes.selectionCount = /*selected*/ ctx[2].length;

    			if (!updating_personCount && dirty & /*personCount*/ 1) {
    				updating_personCount = true;
    				panel_changes.personCount = /*personCount*/ ctx[0];
    				add_flush_callback(() => updating_personCount = false);
    			}

    			if (!updating_dishCount && dirty & /*dishCount*/ 2) {
    				updating_dishCount = true;
    				panel_changes.dishCount = /*dishCount*/ ctx[1];
    				add_flush_callback(() => updating_dishCount = false);
    			}

    			panel.$set(panel_changes);
    		},
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
    	let personCount = 1;
    	let dishCount = 1;
    	let selected = [];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function seatingplan_selected_binding(value) {
    		selected = value;
    		$$invalidate(2, selected);
    	}

    	function panel_personCount_binding(value) {
    		personCount = value;
    		$$invalidate(0, personCount);
    	}

    	function panel_dishCount_binding(value) {
    		dishCount = value;
    		$$invalidate(1, dishCount);
    	}

    	$$self.$capture_state = () => ({
    		GlobalStyle: Style,
    		Panel,
    		Header,
    		SeatingPlan: Seating,
    		personCount,
    		dishCount,
    		selected
    	});

    	$$self.$inject_state = $$props => {
    		if ('personCount' in $$props) $$invalidate(0, personCount = $$props.personCount);
    		if ('dishCount' in $$props) $$invalidate(1, dishCount = $$props.dishCount);
    		if ('selected' in $$props) $$invalidate(2, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		personCount,
    		dishCount,
    		selected,
    		seatingplan_selected_binding,
    		panel_personCount_binding,
    		panel_dishCount_binding
    	];
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
