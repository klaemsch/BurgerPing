
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
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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

    function create_fragment$p(ctx) {
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
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props) {
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
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Style",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\components\typography\Text.svelte generated by Svelte v3.44.3 */

    const file$o = "src\\components\\typography\\Text.svelte";

    function create_fragment$o(ctx) {
    	let p;
    	let p_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", p_class_value = "font-sans " + (/*bold*/ ctx[0] ? "font-bold" : "") + " " + /*extra*/ ctx[1]);
    			add_location(p, file$o, 4, 0, 81);
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
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*bold, extra*/ 3 && p_class_value !== (p_class_value = "font-sans " + (/*bold*/ ctx[0] ? "font-bold" : "") + " " + /*extra*/ ctx[1])) {
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Text', slots, ['default']);
    	let { bold = false } = $$props;
    	let { extra = "" } = $$props;
    	const writable_props = ['bold', 'extra'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Text> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('bold' in $$props) $$invalidate(0, bold = $$props.bold);
    		if ('extra' in $$props) $$invalidate(1, extra = $$props.extra);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ bold, extra });

    	$$self.$inject_state = $$props => {
    		if ('bold' in $$props) $$invalidate(0, bold = $$props.bold);
    		if ('extra' in $$props) $$invalidate(1, extra = $$props.extra);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bold, extra, $$scope, slots];
    }

    class Text extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, { bold: 0, extra: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Text",
    			options,
    			id: create_fragment$o.name
    		});
    	}

    	get bold() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bold(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get extra() {
    		throw new Error("<Text>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set extra(value) {
    		throw new Error("<Text>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\TextInput.svelte generated by Svelte v3.44.3 */

    const file$n = "src\\components\\input\\TextInput.svelte";

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
    			add_location(label_1, file$n, 7, 4, 125);
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

    function create_fragment$n(ctx) {
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
    			add_location(input, file$n, 12, 4, 288);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$n, 11, 2, 234);
    			add_location(div1, file$n, 5, 0, 99);
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
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { placeholder: 1, label: 2, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextInput",
    			options,
    			id: create_fragment$n.name
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

    const file$m = "src\\components\\input\\Select.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (13:8) {#each options as option}
    function create_each_block$2(ctx) {
    	let option;
    	let t0_value = /*option*/ ctx[3].text + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*option*/ ctx[3].value;
    			option.value = option.__value;
    			add_location(option, file$m, 13, 12, 499);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 2 && t0_value !== (t0_value = /*option*/ ctx[3].text + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*options*/ 2 && option_value_value !== (option_value_value = /*option*/ ctx[3].value)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(13:8) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let div;
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			if (/*selected*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[2].call(select));
    			add_location(select, file$m, 6, 4, 187);
    			attr_dev(div, "class", "flex items-center");
    			add_location(div, file$m, 4, 0, 86);
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

    			select_option(select, /*selected*/ ctx[0]);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*options*/ 2) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selected, options*/ 3) {
    				select_option(select, /*selected*/ ctx[0]);
    			}
    		},
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Select', slots, []);
    	let { options = [] } = $$props;
    	let { selected = null } = $$props;
    	const writable_props = ['options', 'selected'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate(0, selected);
    		$$invalidate(1, options);
    	}

    	$$self.$$set = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	$$self.$capture_state = () => ({ options, selected });

    	$$self.$inject_state = $$props => {
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, options, select_change_handler];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { options: 1, selected: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$m.name
    		});
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
    const file$l = "src\\components\\input\\TimePicker.svelte";

    // (38:4) {#if label}
    function create_if_block$4(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[2]);
    			attr_dev(label_1, "for", "s");
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700");
    			add_location(label_1, file$l, 38, 8, 634);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 4) set_data_dev(t, /*label*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(38:4) {#if label}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let select0;
    	let updating_selected;
    	let t1;
    	let span;
    	let t3;
    	let select1;
    	let updating_selected_1;
    	let current;
    	let if_block = /*label*/ ctx[2] && create_if_block$4(ctx);

    	function select0_selected_binding(value) {
    		/*select0_selected_binding*/ ctx[5](value);
    	}

    	let select0_props = { options: /*hours*/ ctx[3].map(func$1) };

    	if (/*selectedHour*/ ctx[0] !== void 0) {
    		select0_props.selected = /*selectedHour*/ ctx[0];
    	}

    	select0 = new Select({ props: select0_props, $$inline: true });
    	binding_callbacks.push(() => bind(select0, 'selected', select0_selected_binding));

    	function select1_selected_binding(value) {
    		/*select1_selected_binding*/ ctx[6](value);
    	}

    	let select1_props = { options: /*minutes*/ ctx[4].map(func_1) };

    	if (/*selectedMinutes*/ ctx[1] !== void 0) {
    		select1_props.selected = /*selectedMinutes*/ ctx[1];
    	}

    	select1 = new Select({ props: select1_props, $$inline: true });
    	binding_callbacks.push(() => bind(select1, 'selected', select1_selected_binding));

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
    			add_location(span, file$l, 44, 8, 916);
    			attr_dev(div0, "class", "mt-1 flex justify-left");
    			attr_dev(div0, "id", "s");
    			add_location(div0, file$l, 42, 4, 753);
    			add_location(div1, file$l, 36, 0, 602);
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
    			if (/*label*/ ctx[2]) {
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

    			const select0_changes = {};

    			if (!updating_selected && dirty & /*selectedHour*/ 1) {
    				updating_selected = true;
    				select0_changes.selected = /*selectedHour*/ ctx[0];
    				add_flush_callback(() => updating_selected = false);
    			}

    			select0.$set(select0_changes);
    			const select1_changes = {};

    			if (!updating_selected_1 && dirty & /*selectedMinutes*/ 2) {
    				updating_selected_1 = true;
    				select1_changes.selected = /*selectedMinutes*/ ctx[1];
    				add_flush_callback(() => updating_selected_1 = false);
    			}

    			select1.$set(select1_changes);
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$1 = hour => ({ text: hour, value: hour });
    const func_1 = minute => ({ text: minute, value: minute });

    function instance$l($$self, $$props, $$invalidate) {
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
    	let { selectedHour = hours[currentHour] } = $$props;
    	let { selectedMinutes = minutes[0] } = $$props;
    	const writable_props = ['label', 'selectedHour', 'selectedMinutes'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimePicker> was created with unknown prop '${key}'`);
    	});

    	function select0_selected_binding(value) {
    		selectedHour = value;
    		$$invalidate(0, selectedHour);
    	}

    	function select1_selected_binding(value) {
    		selectedMinutes = value;
    		$$invalidate(1, selectedMinutes);
    	}

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('selectedHour' in $$props) $$invalidate(0, selectedHour = $$props.selectedHour);
    		if ('selectedMinutes' in $$props) $$invalidate(1, selectedMinutes = $$props.selectedMinutes);
    	};

    	$$self.$capture_state = () => ({
    		Select,
    		label,
    		hours,
    		minutes,
    		currentDate,
    		currentHour,
    		selectedHour,
    		selectedMinutes
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(2, label = $$props.label);
    		if ('selectedHour' in $$props) $$invalidate(0, selectedHour = $$props.selectedHour);
    		if ('selectedMinutes' in $$props) $$invalidate(1, selectedMinutes = $$props.selectedMinutes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selectedHour,
    		selectedMinutes,
    		label,
    		hours,
    		minutes,
    		select0_selected_binding,
    		select1_selected_binding
    	];
    }

    class TimePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
    			label: 2,
    			selectedHour: 0,
    			selectedMinutes: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimePicker",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get label() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedHour() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedHour(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedMinutes() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedMinutes(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\DatePicker.svelte generated by Svelte v3.44.3 */

    const file$k = "src\\components\\input\\DatePicker.svelte";

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
    			add_location(label_1, file$k, 6, 8, 129);
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

    function create_fragment$k(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let input;
    	let input_value_value;
    	let if_block = /*label*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			input = element("input");
    			attr_dev(input, "type", "date");
    			input.value = input_value_value = /*date*/ ctx[1].toISOString().slice(0, 10);
    			attr_dev(input, "id", "label");
    			attr_dev(input, "class", "font-sans focus:ring-indigo-500 focus:border-indigo-500 block w-full text-sm border-gray-300 rounded-md placeholder-gray-300 cursor-pointer");
    			add_location(input, file$k, 11, 8, 312);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$k, 10, 4, 254);
    			attr_dev(div1, "class", "flex flex-col");
    			add_location(div1, file$k, 4, 0, 75);
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

    			if (dirty & /*date*/ 2 && input_value_value !== (input_value_value = /*date*/ ctx[1].toISOString().slice(0, 10))) {
    				prop_dev(input, "value", input_value_value);
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DatePicker', slots, []);
    	let { label = null } = $$props;
    	let { date } = $$props;
    	const writable_props = ['label', 'date'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DatePicker> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('date' in $$props) $$invalidate(1, date = $$props.date);
    	};

    	$$self.$capture_state = () => ({ label, date });

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('date' in $$props) $$invalidate(1, date = $$props.date);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, date];
    }

    class DatePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { label: 0, date: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DatePicker",
    			options,
    			id: create_fragment$k.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*date*/ ctx[1] === undefined && !('date' in props)) {
    			console.warn("<DatePicker> was created without expected prop 'date'");
    		}
    	}

    	get label() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\NumberInput.svelte generated by Svelte v3.44.3 */

    const file$j = "src\\components\\input\\NumberInput.svelte";

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
    			add_location(label_1, file$j, 9, 6, 176);
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

    function create_fragment$j(ctx) {
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
    			add_location(input, file$j, 14, 6, 349);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$j, 13, 4, 293);
    			add_location(div1, file$j, 7, 2, 146);
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {
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
    			id: create_fragment$j.name
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

    const file$i = "src\\components\\input\\EmailInput.svelte";

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
    			add_location(label_1, file$i, 7, 6, 133);
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

    function create_fragment$i(ctx) {
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
    			add_location(input, file$i, 12, 6, 306);
    			attr_dev(div0, "class", "mt-1 relative rounded-md shadow-sm");
    			add_location(div0, file$i, 11, 4, 250);
    			add_location(div1, file$i, 5, 2, 103);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { placeholder: 1, label: 2, value: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EmailInput",
    			options,
    			id: create_fragment$i.name
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
    const file$h = "src\\components\\input\\DishPicker.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[4] = list;
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (14:12) <Text>
    function create_default_slot$4(ctx) {
    	let t_value = /*dish*/ ctx[3] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(14:12) <Text>",
    		ctx
    	});

    	return block;
    }

    // (12:4) {#each dishes as dish}
    function create_each_block$1(ctx) {
    	let div;
    	let text_1;
    	let t0;
    	let numberinput;
    	let updating_value;
    	let t1;
    	let current;

    	text_1 = new Text({
    			props: {
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function numberinput_value_binding(value) {
    		/*numberinput_value_binding*/ ctx[2](value, /*dish*/ ctx[3]);
    	}

    	let numberinput_props = { label: "", min: 0, placeholder: "0" };

    	if (/*dishCount*/ ctx[0][/*dishes*/ ctx[1].indexOf(/*dish*/ ctx[3])] !== void 0) {
    		numberinput_props.value = /*dishCount*/ ctx[0][/*dishes*/ ctx[1].indexOf(/*dish*/ ctx[3])];
    	}

    	numberinput = new NumberInput({ props: numberinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(numberinput, 'value', numberinput_value_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(text_1.$$.fragment);
    			t0 = space();
    			create_component(numberinput.$$.fragment);
    			t1 = space();
    			attr_dev(div, "class", "flex justify-between w-full p-0 items-center");
    			add_location(div, file$h, 12, 8, 421);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(text_1, div, null);
    			append_dev(div, t0);
    			mount_component(numberinput, div, null);
    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const text_1_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				text_1_changes.$$scope = { dirty, ctx };
    			}

    			text_1.$set(text_1_changes);
    			const numberinput_changes = {};

    			if (!updating_value && dirty & /*dishCount, dishes*/ 3) {
    				updating_value = true;
    				numberinput_changes.value = /*dishCount*/ ctx[0][/*dishes*/ ctx[1].indexOf(/*dish*/ ctx[3])];
    				add_flush_callback(() => updating_value = false);
    			}

    			numberinput.$set(numberinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			transition_in(numberinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			transition_out(numberinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(text_1);
    			destroy_component(numberinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(12:4) {#each dishes as dish}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div;
    	let label_1;
    	let t0;
    	let t1;
    	let current;
    	let each_value = /*dishes*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(label);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(label_1, "for", label);
    			attr_dev(label_1, "class", "block text-sm font-medium text-gray-700 self-end");
    			add_location(label_1, file$h, 8, 4, 276);
    			attr_dev(div, "class", "flex flex-col gap-4");
    			add_location(div, file$h, 7, 0, 237);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			append_dev(label_1, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*dishCount, dishes*/ 3) {
    				each_value = /*dishes*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const label = "Anzahl";

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DishPicker', slots, []);
    	const dishes = ["LANsagne", "Cookies", "RAMen"];
    	let { dishCount = [0, 0, 0] } = $$props;
    	const writable_props = ['dishCount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DishPicker> was created with unknown prop '${key}'`);
    	});

    	function numberinput_value_binding(value, dish) {
    		if ($$self.$$.not_equal(dishCount[dishes.indexOf(dish)], value)) {
    			dishCount[dishes.indexOf(dish)] = value;
    			$$invalidate(0, dishCount);
    		}
    	}

    	$$self.$$set = $$props => {
    		if ('dishCount' in $$props) $$invalidate(0, dishCount = $$props.dishCount);
    	};

    	$$self.$capture_state = () => ({
    		NumberInput,
    		Text,
    		dishes,
    		dishCount,
    		label
    	});

    	$$self.$inject_state = $$props => {
    		if ('dishCount' in $$props) $$invalidate(0, dishCount = $$props.dishCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dishCount, dishes, numberinput_value_binding];
    }

    class DishPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { dishCount: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DishPicker",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get dishCount() {
    		throw new Error("<DishPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dishCount(value) {
    		throw new Error("<DishPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\input\Button.svelte generated by Svelte v3.44.3 */

    const file$g = "src\\components\\input\\Button.svelte";

    function create_fragment$g(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[1]);
    			button.disabled = /*disabled*/ ctx[2];
    			attr_dev(button, "class", "font-sans text-base bg-indigo-500 hover:bg-indigo-700 active:bg-indigo-900 text-white py-2 px-4 rounded-md h-10 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed");
    			add_location(button, file$g, 5, 0, 101);
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

    			if (dirty & /*disabled*/ 4) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[2]);
    			}
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, []);
    	let { onclick } = $$props;
    	let { label } = $$props;
    	let { disabled = false } = $$props;
    	const writable_props = ['onclick', 'label', 'disabled'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('onclick' in $$props) $$invalidate(0, onclick = $$props.onclick);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => ({ onclick, label, disabled });

    	$$self.$inject_state = $$props => {
    		if ('onclick' in $$props) $$invalidate(0, onclick = $$props.onclick);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('disabled' in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onclick, label, disabled];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { onclick: 0, label: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$g.name
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

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\typography\Annotation.svelte generated by Svelte v3.44.3 */

    const file$f = "src\\components\\typography\\Annotation.svelte";

    function create_fragment$f(ctx) {
    	let p;
    	let p_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", p_class_value = "block text-sm font-medium " + (/*colored*/ ctx[0] ? 'text-indigo-500' : 'text-black'));
    			add_location(p, file$f, 3, 0, 60);
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

    			if (!current || dirty & /*colored*/ 1 && p_class_value !== (p_class_value = "block text-sm font-medium " + (/*colored*/ ctx[0] ? 'text-indigo-500' : 'text-black'))) {
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Annotation', slots, ['default']);
    	let { colored = false } = $$props;
    	const writable_props = ['colored'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Annotation> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('colored' in $$props) $$invalidate(0, colored = $$props.colored);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ colored });

    	$$self.$inject_state = $$props => {
    		if ('colored' in $$props) $$invalidate(0, colored = $$props.colored);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [colored, $$scope, slots];
    }

    class Annotation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { colored: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Annotation",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get colored() {
    		throw new Error("<Annotation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colored(value) {
    		throw new Error("<Annotation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\typography\Label.svelte generated by Svelte v3.44.3 */

    const file$e = "src\\components\\typography\\Label.svelte";

    function create_fragment$e(ctx) {
    	let div;
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "font-sans font-bold uppercase tracking-wide text-indigo-500");
    			set_style(p, "font-size", "10px");
    			add_location(p, file$e, 1, 4, 43);
    			attr_dev(div, "class", "border-indigo-500 label svelte-1jsto3m");
    			add_location(div, file$e, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);

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
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots('Label', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Label> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\components\icons\Plus.svelte generated by Svelte v3.44.3 */

    const file$d = "src\\components\\icons\\Plus.svelte";

    function create_fragment$d(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill", "#6563ff");
    			attr_dev(path, "d", "M19,11H13V5a1,1,0,0,0-2,0v6H5a1,1,0,0,0,0,2h6v6a1,1,0,0,0,2,0V13h6a1,1,0,0,0,0-2Z");
    			add_location(path, file$d, 1, 4, 89);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			add_location(svg, file$d, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop$3,
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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

    function instance$d($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Plus', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Plus> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Plus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Plus",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\components\icons\Minus.svelte generated by Svelte v3.44.3 */

    const file$c = "src\\components\\icons\\Minus.svelte";

    function create_fragment$c(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill", "#6563ff");
    			attr_dev(path, "d", "M19,11H5a1,1,0,0,0,0,2H19a1,1,0,0,0,0-2Z");
    			add_location(path, file$c, 1, 4, 89);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			add_location(svg, file$c, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop$3,
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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

    function instance$c($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Minus', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Minus> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Minus extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Minus",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\components\Collapsable.svelte generated by Svelte v3.44.3 */
    const file$b = "src\\components\\Collapsable.svelte";

    // (24:8) <Text bold extra="hover:underline">
    function create_default_slot_1$1(ctx) {
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
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(24:8) <Text bold extra=\\\"hover:underline\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:8) {#if optional}
    function create_if_block_1(ctx) {
    	let label_1;
    	let current;

    	label_1 = new Label({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(27:8) {#if optional}",
    		ctx
    	});

    	return block;
    }

    // (28:12) <Label>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Optional");
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
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(28:12) <Label>",
    		ctx
    	});

    	return block;
    }

    // (33:4) {:else}
    function create_else_block(ctx) {
    	let minus;
    	let current;
    	minus = new Minus({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(minus.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(minus, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(minus.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(minus.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(minus, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(33:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (31:4) {#if !visible}
    function create_if_block(ctx) {
    	let plus;
    	let current;
    	plus = new Plus({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(plus.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(plus, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(plus.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(plus.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(plus, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(31:4) {#if !visible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div1;
    	let div0;
    	let text_1;
    	let t0;
    	let t1;
    	let current_block_type_index;
    	let if_block1;
    	let t2;
    	let div2;
    	let div2_style_value;
    	let t3;
    	let hr;
    	let current;
    	let mounted;
    	let dispose;

    	text_1 = new Text({
    			props: {
    				bold: true,
    				extra: "hover:underline",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block0 = /*optional*/ ctx[1] && create_if_block_1(ctx);
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*visible*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(text_1.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if_block1.c();
    			t2 = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			t3 = space();
    			hr = element("hr");
    			attr_dev(div0, "class", "flex flex-row gap-3 items-center");
    			add_location(div0, file$b, 22, 4, 686);
    			attr_dev(div1, "class", "flex flex-row rounded-md placeholder-gray-300 cursor-pointer justify-between items-center px-5");
    			add_location(div1, file$b, 18, 0, 540);
    			attr_dev(div2, "class", "px-8 py-2");
    			attr_dev(div2, "style", div2_style_value = /*visible*/ ctx[2] ? "display: block" : "display: none");
    			add_location(div2, file$b, 37, 0, 996);
    			add_location(hr, file$b, 41, 0, 1098);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(text_1, div0, null);
    			append_dev(div0, t0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div1, t1);
    			if_blocks[current_block_type_index].m(div1, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*collapse*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const text_1_changes = {};

    			if (dirty & /*$$scope, label*/ 129) {
    				text_1_changes.$$scope = { dirty, ctx };
    			}

    			text_1.$set(text_1_changes);

    			if (/*optional*/ ctx[1]) {
    				if (if_block0) {
    					if (dirty & /*optional*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(div1, null);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*visible*/ 4 && div2_style_value !== (div2_style_value = /*visible*/ ctx[2] ? "display: block" : "display: none")) {
    				attr_dev(div2, "style", div2_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(text_1.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(text_1.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(text_1);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			dispose();
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

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Collapsable', slots, ['default']);
    	let { label } = $$props;
    	let { optional = false } = $$props;
    	let { visible = false } = $$props;
    	let { clickCallback } = $$props;
    	let { index = 0 } = $$props;

    	function collapse() {
    		clickCallback(index);
    	}

    	const writable_props = ['label', 'optional', 'visible', 'clickCallback', 'index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Collapsable> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('optional' in $$props) $$invalidate(1, optional = $$props.optional);
    		if ('visible' in $$props) $$invalidate(2, visible = $$props.visible);
    		if ('clickCallback' in $$props) $$invalidate(4, clickCallback = $$props.clickCallback);
    		if ('index' in $$props) $$invalidate(5, index = $$props.index);
    		if ('$$scope' in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Text,
    		Label,
    		Plus,
    		Minus,
    		label,
    		optional,
    		visible,
    		clickCallback,
    		index,
    		collapse
    	});

    	$$self.$inject_state = $$props => {
    		if ('label' in $$props) $$invalidate(0, label = $$props.label);
    		if ('optional' in $$props) $$invalidate(1, optional = $$props.optional);
    		if ('visible' in $$props) $$invalidate(2, visible = $$props.visible);
    		if ('clickCallback' in $$props) $$invalidate(4, clickCallback = $$props.clickCallback);
    		if ('index' in $$props) $$invalidate(5, index = $$props.index);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label, optional, visible, collapse, clickCallback, index, slots, $$scope];
    }

    class Collapsable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			label: 0,
    			optional: 1,
    			visible: 2,
    			clickCallback: 4,
    			index: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Collapsable",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[0] === undefined && !('label' in props)) {
    			console.warn("<Collapsable> was created without expected prop 'label'");
    		}

    		if (/*clickCallback*/ ctx[4] === undefined && !('clickCallback' in props)) {
    			console.warn("<Collapsable> was created without expected prop 'clickCallback'");
    		}
    	}

    	get label() {
    		throw new Error("<Collapsable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Collapsable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get optional() {
    		throw new Error("<Collapsable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set optional(value) {
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

    /* src\components\typography\Contact.svelte generated by Svelte v3.44.3 */

    const file$a = "src\\components\\typography\\Contact.svelte";

    function create_fragment$a(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "font-sans text-l");
    			add_location(p, file$a, 0, 0, 0);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Contact', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\Panel.svelte generated by Svelte v3.44.3 */
    const file$9 = "src\\components\\Panel.svelte";

    // (63:16) <Annotation colored                      >
    function create_default_slot_5(ctx) {
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
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(63:16) <Annotation colored                      >",
    		ctx
    	});

    	return block;
    }

    // (43:8) <Collapsable              label="Termin"              visible={currentIndex === 1}              {clickCallback}              index={1}          >
    function create_default_slot_4(ctx) {
    	let div;
    	let datepicker;
    	let updating_date;
    	let t0;
    	let timepicker;
    	let updating_selectedHour;
    	let updating_selectedMinutes;
    	let t1;
    	let numberinput;
    	let updating_value;
    	let t2;
    	let annotation;
    	let current;

    	function datepicker_date_binding(value) {
    		/*datepicker_date_binding*/ ctx[12](value);
    	}

    	let datepicker_props = { label: "Datum" };

    	if (/*date*/ ctx[3] !== void 0) {
    		datepicker_props.date = /*date*/ ctx[3];
    	}

    	datepicker = new DatePicker({ props: datepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(datepicker, 'date', datepicker_date_binding));

    	function timepicker_selectedHour_binding(value) {
    		/*timepicker_selectedHour_binding*/ ctx[13](value);
    	}

    	function timepicker_selectedMinutes_binding(value) {
    		/*timepicker_selectedMinutes_binding*/ ctx[14](value);
    	}

    	let timepicker_props = { label: "Uhrzeit" };

    	if (/*hour*/ ctx[4] !== void 0) {
    		timepicker_props.selectedHour = /*hour*/ ctx[4];
    	}

    	if (/*minutes*/ ctx[5] !== void 0) {
    		timepicker_props.selectedMinutes = /*minutes*/ ctx[5];
    	}

    	timepicker = new TimePicker({ props: timepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(timepicker, 'selectedHour', timepicker_selectedHour_binding));
    	binding_callbacks.push(() => bind(timepicker, 'selectedMinutes', timepicker_selectedMinutes_binding));

    	function numberinput_value_binding(value) {
    		/*numberinput_value_binding*/ ctx[15](value);
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
    				colored: true,
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
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
    			create_component(numberinput.$$.fragment);
    			t2 = space();
    			create_component(annotation.$$.fragment);
    			attr_dev(div, "class", "flex flex-col gap-4");
    			add_location(div, file$9, 48, 12, 1526);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(datepicker, div, null);
    			append_dev(div, t0);
    			mount_component(timepicker, div, null);
    			append_dev(div, t1);
    			mount_component(numberinput, div, null);
    			append_dev(div, t2);
    			mount_component(annotation, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const datepicker_changes = {};

    			if (!updating_date && dirty & /*date*/ 8) {
    				updating_date = true;
    				datepicker_changes.date = /*date*/ ctx[3];
    				add_flush_callback(() => updating_date = false);
    			}

    			datepicker.$set(datepicker_changes);
    			const timepicker_changes = {};

    			if (!updating_selectedHour && dirty & /*hour*/ 16) {
    				updating_selectedHour = true;
    				timepicker_changes.selectedHour = /*hour*/ ctx[4];
    				add_flush_callback(() => updating_selectedHour = false);
    			}

    			if (!updating_selectedMinutes && dirty & /*minutes*/ 32) {
    				updating_selectedMinutes = true;
    				timepicker_changes.selectedMinutes = /*minutes*/ ctx[5];
    				add_flush_callback(() => updating_selectedMinutes = false);
    			}

    			timepicker.$set(timepicker_changes);
    			const numberinput_changes = {};

    			if (!updating_value && dirty & /*personCount*/ 1) {
    				updating_value = true;
    				numberinput_changes.value = /*personCount*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			numberinput.$set(numberinput_changes);
    			const annotation_changes = {};

    			if (dirty & /*$$scope, personCount, selectionCount*/ 524293) {
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
    			if (detaching) detach_dev(div);
    			destroy_component(datepicker);
    			destroy_component(timepicker);
    			destroy_component(numberinput);
    			destroy_component(annotation);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(43:8) <Collapsable              label=\\\"Termin\\\"              visible={currentIndex === 1}              {clickCallback}              index={1}          >",
    		ctx
    	});

    	return block;
    }

    // (69:8) <Collapsable              label="Essensauswahl"              optional              visible={currentIndex === 2}              {clickCallback}              index={2}          >
    function create_default_slot_3(ctx) {
    	let dishpicker;
    	let updating_dishCount;
    	let current;

    	function dishpicker_dishCount_binding(value) {
    		/*dishpicker_dishCount_binding*/ ctx[16](value);
    	}

    	let dishpicker_props = {};

    	if (/*dishCount*/ ctx[1] !== void 0) {
    		dishpicker_props.dishCount = /*dishCount*/ ctx[1];
    	}

    	dishpicker = new DishPicker({ props: dishpicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(dishpicker, 'dishCount', dishpicker_dishCount_binding));

    	const block = {
    		c: function create() {
    			create_component(dishpicker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dishpicker, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const dishpicker_changes = {};

    			if (!updating_dishCount && dirty & /*dishCount*/ 2) {
    				updating_dishCount = true;
    				dishpicker_changes.dishCount = /*dishCount*/ ctx[1];
    				add_flush_callback(() => updating_dishCount = false);
    			}

    			dishpicker.$set(dishpicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dishpicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dishpicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dishpicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(69:8) <Collapsable              label=\\\"Essensauswahl\\\"              optional              visible={currentIndex === 2}              {clickCallback}              index={2}          >",
    		ctx
    	});

    	return block;
    }

    // (79:8) <Collapsable              label="Kontakt"              visible={currentIndex === 3}              {clickCallback}              index={3}          >
    function create_default_slot_2(ctx) {
    	let div;
    	let textinput;
    	let updating_value;
    	let t;
    	let emailinput;
    	let updating_value_1;
    	let current;

    	function textinput_value_binding(value) {
    		/*textinput_value_binding*/ ctx[17](value);
    	}

    	let textinput_props = {
    		label: "Name",
    		placeholder: "Maximilian Erhardt"
    	};

    	if (/*name*/ ctx[6] !== void 0) {
    		textinput_props.value = /*name*/ ctx[6];
    	}

    	textinput = new TextInput({ props: textinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(textinput, 'value', textinput_value_binding));

    	function emailinput_value_binding(value) {
    		/*emailinput_value_binding*/ ctx[18](value);
    	}

    	let emailinput_props = {
    		label: "Email",
    		placeholder: "maximilian.erhardt@stud.uni-hannover.de"
    	};

    	if (/*email*/ ctx[7] !== void 0) {
    		emailinput_props.value = /*email*/ ctx[7];
    	}

    	emailinput = new EmailInput({ props: emailinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(emailinput, 'value', emailinput_value_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(textinput.$$.fragment);
    			t = space();
    			create_component(emailinput.$$.fragment);
    			attr_dev(div, "class", "flex flex-col gap-4");
    			add_location(div, file$9, 84, 12, 2652);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(textinput, div, null);
    			append_dev(div, t);
    			mount_component(emailinput, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const textinput_changes = {};

    			if (!updating_value && dirty & /*name*/ 64) {
    				updating_value = true;
    				textinput_changes.value = /*name*/ ctx[6];
    				add_flush_callback(() => updating_value = false);
    			}

    			textinput.$set(textinput_changes);
    			const emailinput_changes = {};

    			if (!updating_value_1 && dirty & /*email*/ 128) {
    				updating_value_1 = true;
    				emailinput_changes.value = /*email*/ ctx[7];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			emailinput.$set(emailinput_changes);
    		},
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
    			if (detaching) detach_dev(div);
    			destroy_component(textinput);
    			destroy_component(emailinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(79:8) <Collapsable              label=\\\"Kontakt\\\"              visible={currentIndex === 3}              {clickCallback}              index={3}          >",
    		ctx
    	});

    	return block;
    }

    // (106:12) <Annotation                  >
    function create_default_slot_1(ctx) {
    	let t0_value = (/*isValid*/ ctx[9]
    	? `${/*name*/ ctx[6]}(${/*email*/ ctx[7]}), ${/*date*/ ctx[3].toLocaleDateString()}@${/*hour*/ ctx[4]}:${/*minutes*/ ctx[5]}, ${/*personCount*/ ctx[0]} persons`
    	: '') + "";

    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(" ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*isValid, name, email, date, hour, minutes, personCount*/ 761 && t0_value !== (t0_value = (/*isValid*/ ctx[9]
    			? `${/*name*/ ctx[6]}(${/*email*/ ctx[7]}), ${/*date*/ ctx[3].toLocaleDateString()}@${/*hour*/ ctx[4]}:${/*minutes*/ ctx[5]}, ${/*personCount*/ ctx[0]} persons`
    			: '') + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(106:12) <Annotation                  >",
    		ctx
    	});

    	return block;
    }

    // (113:2) <Contact label="Contact">
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Bei Fragen: burgerpingreservation@stud.uni-hannover.de");
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
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(113:2) <Contact label=\\\"Contact\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div4;
    	let div0;
    	let collapsable0;
    	let t0;
    	let collapsable1;
    	let t1;
    	let collapsable2;
    	let t2;
    	let div2;
    	let button;
    	let t3;
    	let div1;
    	let annotation;
    	let t4;
    	let div3;
    	let contact;
    	let current;

    	collapsable0 = new Collapsable({
    			props: {
    				label: "Termin",
    				visible: /*currentIndex*/ ctx[8] === 1,
    				clickCallback: /*clickCallback*/ ctx[11],
    				index: 1,
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	collapsable1 = new Collapsable({
    			props: {
    				label: "Essensauswahl",
    				optional: true,
    				visible: /*currentIndex*/ ctx[8] === 2,
    				clickCallback: /*clickCallback*/ ctx[11],
    				index: 2,
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	collapsable2 = new Collapsable({
    			props: {
    				label: "Kontakt",
    				visible: /*currentIndex*/ ctx[8] === 3,
    				clickCallback: /*clickCallback*/ ctx[11],
    				index: 3,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				label: "Bestätigen",
    				onclick: /*showConfirmation*/ ctx[10],
    				disabled: !/*isValid*/ ctx[9]
    			},
    			$$inline: true
    		});

    	annotation = new Annotation({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	contact = new Contact({
    			props: {
    				label: "Contact",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			create_component(collapsable0.$$.fragment);
    			t0 = space();
    			create_component(collapsable1.$$.fragment);
    			t1 = space();
    			create_component(collapsable2.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(button.$$.fragment);
    			t3 = space();
    			div1 = element("div");
    			create_component(annotation.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			create_component(contact.$$.fragment);
    			attr_dev(div0, "class", "flex flex-col gap-5 items-stretch");
    			set_style(div0, "width", "600px");
    			add_location(div0, file$9, 41, 4, 1289);
    			attr_dev(div1, "class", "flex flex-col items-center");
    			add_location(div1, file$9, 104, 8, 3298);
    			attr_dev(div2, "class", "flex flex-col gap-3");
    			add_location(div2, file$9, 98, 4, 3121);
    			add_location(div3, file$9, 111, 1, 3557);
    			attr_dev(div4, "class", "flex flex-col justify-between p-10 border-l-2 border-gray-100");
    			add_location(div4, file$9, 40, 0, 1208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(collapsable0, div0, null);
    			append_dev(div0, t0);
    			mount_component(collapsable1, div0, null);
    			append_dev(div0, t1);
    			mount_component(collapsable2, div0, null);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			mount_component(button, div2, null);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			mount_component(annotation, div1, null);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			mount_component(contact, div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const collapsable0_changes = {};
    			if (dirty & /*currentIndex*/ 256) collapsable0_changes.visible = /*currentIndex*/ ctx[8] === 1;

    			if (dirty & /*$$scope, personCount, selectionCount, hour, minutes, date*/ 524349) {
    				collapsable0_changes.$$scope = { dirty, ctx };
    			}

    			collapsable0.$set(collapsable0_changes);
    			const collapsable1_changes = {};
    			if (dirty & /*currentIndex*/ 256) collapsable1_changes.visible = /*currentIndex*/ ctx[8] === 2;

    			if (dirty & /*$$scope, dishCount*/ 524290) {
    				collapsable1_changes.$$scope = { dirty, ctx };
    			}

    			collapsable1.$set(collapsable1_changes);
    			const collapsable2_changes = {};
    			if (dirty & /*currentIndex*/ 256) collapsable2_changes.visible = /*currentIndex*/ ctx[8] === 3;

    			if (dirty & /*$$scope, email, name*/ 524480) {
    				collapsable2_changes.$$scope = { dirty, ctx };
    			}

    			collapsable2.$set(collapsable2_changes);
    			const button_changes = {};
    			if (dirty & /*isValid*/ 512) button_changes.disabled = !/*isValid*/ ctx[9];
    			button.$set(button_changes);
    			const annotation_changes = {};

    			if (dirty & /*$$scope, isValid, name, email, date, hour, minutes, personCount*/ 525049) {
    				annotation_changes.$$scope = { dirty, ctx };
    			}

    			annotation.$set(annotation_changes);
    			const contact_changes = {};

    			if (dirty & /*$$scope*/ 524288) {
    				contact_changes.$$scope = { dirty, ctx };
    			}

    			contact.$set(contact_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(collapsable0.$$.fragment, local);
    			transition_in(collapsable1.$$.fragment, local);
    			transition_in(collapsable2.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(annotation.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(collapsable0.$$.fragment, local);
    			transition_out(collapsable1.$$.fragment, local);
    			transition_out(collapsable2.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(annotation.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			destroy_component(collapsable0);
    			destroy_component(collapsable1);
    			destroy_component(collapsable2);
    			destroy_component(button);
    			destroy_component(annotation);
    			destroy_component(contact);
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
    	let isValid;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Panel', slots, []);
    	let { personCount } = $$props;
    	let { dishCount = [0, 0, 0] } = $$props;
    	let { selectionCount } = $$props;
    	let date = new Date();
    	let hour;
    	let minutes;
    	let name;
    	let email;

    	const showConfirmation = () => {
    		alert("Deine Reservation war erfolgreich!");
    	};

    	let currentIndex = 1;

    	const clickCallback = index => {
    		if (currentIndex === index) {
    			$$invalidate(8, currentIndex = 0);
    			return;
    		}

    		$$invalidate(8, currentIndex = index);
    	};

    	const writable_props = ['personCount', 'dishCount', 'selectionCount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	function datepicker_date_binding(value) {
    		date = value;
    		$$invalidate(3, date);
    	}

    	function timepicker_selectedHour_binding(value) {
    		hour = value;
    		$$invalidate(4, hour);
    	}

    	function timepicker_selectedMinutes_binding(value) {
    		minutes = value;
    		$$invalidate(5, minutes);
    	}

    	function numberinput_value_binding(value) {
    		personCount = value;
    		$$invalidate(0, personCount);
    	}

    	function dishpicker_dishCount_binding(value) {
    		dishCount = value;
    		$$invalidate(1, dishCount);
    	}

    	function textinput_value_binding(value) {
    		name = value;
    		$$invalidate(6, name);
    	}

    	function emailinput_value_binding(value) {
    		email = value;
    		$$invalidate(7, email);
    	}

    	$$self.$$set = $$props => {
    		if ('personCount' in $$props) $$invalidate(0, personCount = $$props.personCount);
    		if ('dishCount' in $$props) $$invalidate(1, dishCount = $$props.dishCount);
    		if ('selectionCount' in $$props) $$invalidate(2, selectionCount = $$props.selectionCount);
    	};

    	$$self.$capture_state = () => ({
    		TextInput,
    		TimePicker,
    		DatePicker,
    		NumberInput,
    		EmailInput,
    		DishPicker,
    		Button,
    		Annotation,
    		Collapsable,
    		Contact,
    		personCount,
    		dishCount,
    		selectionCount,
    		date,
    		hour,
    		minutes,
    		name,
    		email,
    		showConfirmation,
    		currentIndex,
    		clickCallback,
    		isValid
    	});

    	$$self.$inject_state = $$props => {
    		if ('personCount' in $$props) $$invalidate(0, personCount = $$props.personCount);
    		if ('dishCount' in $$props) $$invalidate(1, dishCount = $$props.dishCount);
    		if ('selectionCount' in $$props) $$invalidate(2, selectionCount = $$props.selectionCount);
    		if ('date' in $$props) $$invalidate(3, date = $$props.date);
    		if ('hour' in $$props) $$invalidate(4, hour = $$props.hour);
    		if ('minutes' in $$props) $$invalidate(5, minutes = $$props.minutes);
    		if ('name' in $$props) $$invalidate(6, name = $$props.name);
    		if ('email' in $$props) $$invalidate(7, email = $$props.email);
    		if ('currentIndex' in $$props) $$invalidate(8, currentIndex = $$props.currentIndex);
    		if ('isValid' in $$props) $$invalidate(9, isValid = $$props.isValid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*date, hour, minutes, personCount, name, email*/ 249) {
    			$$invalidate(9, isValid = date !== null && hour !== null && minutes !== null && personCount > 0 && personCount < 11 && name !== "" && email !== "");
    		}
    	};

    	return [
    		personCount,
    		dishCount,
    		selectionCount,
    		date,
    		hour,
    		minutes,
    		name,
    		email,
    		currentIndex,
    		isValid,
    		showConfirmation,
    		clickCallback,
    		datepicker_date_binding,
    		timepicker_selectedHour_binding,
    		timepicker_selectedMinutes_binding,
    		numberinput_value_binding,
    		dishpicker_dishCount_binding,
    		textinput_value_binding,
    		emailinput_value_binding
    	];
    }

    class Panel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			personCount: 0,
    			dishCount: 1,
    			selectionCount: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*personCount*/ ctx[0] === undefined && !('personCount' in props)) {
    			console.warn("<Panel> was created without expected prop 'personCount'");
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

    /* src\components\typography\Title.svelte generated by Svelte v3.44.3 */

    const file$8 = "src\\components\\typography\\Title.svelte";

    function create_fragment$8(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "font-sans font-bold text-xl");
    			add_location(p, file$8, 0, 0, 0);
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.44.3 */
    const file$7 = "src\\components\\Header.svelte";

    // (9:4) <Title>
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Reservierung");
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(9:4) <Title>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let header;
    	let img;
    	let img_src_value;
    	let t0;
    	let title;
    	let t1;
    	let button;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: { label: "Login", onclick: func },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
    			img = element("img");
    			t0 = space();
    			create_component(title.$$.fragment);
    			t1 = space();
    			create_component(button.$$.fragment);
    			if (!src_url_equal(img.src, img_src_value = "./burger.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "BurgerPing Logo");
    			attr_dev(img, "width", 50);
    			attr_dev(img, "class", "rounded");
    			add_location(img, file$7, 7, 4, 233);
    			attr_dev(header, "class", "flex flex-row gap-3 items-center border-b-2 border-gray-100 p-4 justify-between");
    			add_location(header, file$7, 4, 0, 124);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, img);
    			append_dev(header, t0);
    			mount_component(title, header, null);
    			append_dev(header, t1);
    			mount_component(button, header, null);
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
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(title);
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

    const func = () => {
    	
    };

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Button, Title });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$7.name
    		});
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

    const TABLE_SIZE = 30;
    const CHAIR_HEIGHT = 10;
    const CHAIR_WIDTH = 20;

    /* src\components\furniture\Chair.svelte generated by Svelte v3.44.3 */
    const file$6 = "src\\components\\furniture\\Chair.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(rect, file$6, 8, 0, 215);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
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
    			id: create_fragment$6.name
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
    const file$5 = "src\\components\\furniture\\Table.svelte";

    function create_fragment$5(ctx) {
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
    			add_location(rect, file$5, 9, 4, 353);
    			attr_dev(svg, "width", TABLE_SIZE);
    			attr_dev(svg, "height", TABLE_SIZE + 2 * CHAIR_HEIGHT);
    			add_location(svg, file$5, 7, 0, 221);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { highlighted: 0, selected: 1, disabled: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$5.name
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

    const file$4 = "src\\components\\furniture\\Barstool.svelte";

    function create_fragment$4(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "cx", /*x*/ ctx[0]);
    			attr_dev(circle, "cy", /*y*/ ctx[1]);
    			attr_dev(circle, "r", 10);
    			attr_dev(circle, "class", "fill-orange-400");
    			add_location(circle, file$4, 4, 0, 61);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { x: 0, y: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Barstool",
    			options,
    			id: create_fragment$4.name
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
    const file$3 = "src\\components\\furniture\\Bar.svelte";

    function create_fragment$3(ctx) {
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
    			add_location(rect0, file$3, 12, 4, 338);
    			attr_dev(rect1, "x", 0);
    			attr_dev(rect1, "y", 30);
    			attr_dev(rect1, "width", 190);
    			attr_dev(rect1, "height", 30);
    			attr_dev(rect1, "class", "fill-orange-300");
    			add_location(rect1, file$3, 13, 4, 413);
    			attr_dev(svg, "x", /*x*/ ctx[0]);
    			attr_dev(svg, "y", /*y*/ ctx[1]);
    			attr_dev(svg, "height", "70");
    			attr_dev(svg, "width", "190");
    			add_location(svg, file$3, 5, 0, 104);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { x: 0, y: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bar",
    			options,
    			id: create_fragment$3.name
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

    /* src\components\icons\Move.svelte generated by Svelte v3.44.3 */

    const file$2 = "src\\components\\icons\\Move.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill", "#6563ff");
    			attr_dev(path, "d", "M9.29,13.29,4,18.59V17a1,1,0,0,0-2,0v4a1,1,0,0,0,.08.38,1,1,0,0,0,.54.54A1,1,0,0,0,3,22H7a1,1,0,0,0,0-2H5.41l5.3-5.29a1,1,0,0,0-1.42-1.42ZM5.41,4H7A1,1,0,0,0,7,2H3a1,1,0,0,0-.38.08,1,1,0,0,0-.54.54A1,1,0,0,0,2,3V7A1,1,0,0,0,4,7V5.41l5.29,5.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42ZM21,16a1,1,0,0,0-1,1v1.59l-5.29-5.3a1,1,0,0,0-1.42,1.42L18.59,20H17a1,1,0,0,0,0,2h4a1,1,0,0,0,.38-.08,1,1,0,0,0,.54-.54A1,1,0,0,0,22,21V17A1,1,0,0,0,21,16Zm.92-13.38a1,1,0,0,0-.54-.54A1,1,0,0,0,21,2H17a1,1,0,0,0,0,2h1.59l-5.3,5.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L20,5.41V7a1,1,0,0,0,2,0V3A1,1,0,0,0,21.92,2.62Z");
    			add_location(path, file$2, 1, 5, 89);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			add_location(svg, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop$3,
    		i: noop$3,
    		o: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
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

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Move', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Move> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Move extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Move",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Seating.svelte generated by Svelte v3.44.3 */

    const { console: console_1 } = globals;
    const file$1 = "src\\components\\Seating.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[27] = i;
    	return child_ctx;
    }

    // (202:8) {#each cells as _, i}
    function create_each_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "border-l-2 border-t-2 border-indigo-50 self-stretch pointer-events-none");

    			attr_dev(div, "style", /*computeGridProperties*/ ctx[5](
    				{
    					x: /*i*/ ctx[27] % 31,
    					y: Math.floor(/*i*/ ctx[27] / 31)
    				},
    				{ width: 1, height: 1 }
    			));

    			add_location(div, file$1, 202, 12, 6162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop$3,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(202:8) {#each cells as _, i}",
    		ctx
    	});

    	return block;
    }

    // (228:8) {#each tables as table, i}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let tabledouble;
    	let t;
    	let current;
    	let mounted;
    	let dispose;

    	function func(...args) {
    		return /*func*/ ctx[13](/*i*/ ctx[27], ...args);
    	}

    	tabledouble = new Table({
    			props: {
    				highlighted: /*hoverIndex*/ ctx[1] === /*i*/ ctx[27],
    				selected: /*selected*/ ctx[0].findIndex(func) > -1,
    				disabled: /*table*/ ctx[25].disabled
    			},
    			$$inline: true
    		});

    	function click_handler() {
    		return /*click_handler*/ ctx[14](/*i*/ ctx[27]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(tabledouble.$$.fragment);
    			t = space();
    			attr_dev(div0, "class", "svelte-a0gxwq");
    			toggle_class(div0, "rotated", /*table*/ ctx[25].rotate);
    			add_location(div0, file$1, 232, 16, 7271);
    			attr_dev(div1, "class", "flex justify-center");
    			attr_dev(div1, "style", /*computeGridProperties*/ ctx[5](/*table*/ ctx[25].start, /*table*/ ctx[25].span));
    			add_location(div1, file$1, 228, 12, 7117);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(tabledouble, div0, null);
    			append_dev(div1, t);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "mouseenter", /*hover*/ ctx[6](/*i*/ ctx[27]), false, false, false),
    					listen_dev(div0, "mouseleave", /*unhover*/ ctx[7](/*i*/ ctx[27]), false, false, false),
    					listen_dev(div0, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const tabledouble_changes = {};
    			if (dirty & /*hoverIndex*/ 2) tabledouble_changes.highlighted = /*hoverIndex*/ ctx[1] === /*i*/ ctx[27];
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
    		source: "(228:8) {#each tables as table, i}",
    		ctx
    	});

    	return block;
    }

    // (251:12) <Annotation>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Editieren");
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
    		source: "(251:12) <Annotation>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div12;
    	let div6;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let bar;
    	let t3;
    	let div3;
    	let t4;
    	let div4;
    	let t5;
    	let div5;
    	let t6;
    	let t7;
    	let div11;
    	let div7;
    	let move;
    	let t8;
    	let annotation;
    	let t9;
    	let div10;
    	let div8;
    	let plus;
    	let t10;
    	let div9;
    	let minus;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*cells*/ ctx[8];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

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

    	move = new Move({ $$inline: true });

    	annotation = new Annotation({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	plus = new Plus({ $$inline: true });
    	minus = new Minus({ $$inline: true });

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div6 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			create_component(bar.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			t4 = space();
    			div4 = element("div");
    			t5 = space();
    			div5 = element("div");
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div11 = element("div");
    			div7 = element("div");
    			create_component(move.$$.fragment);
    			t8 = space();
    			create_component(annotation.$$.fragment);
    			t9 = space();
    			div10 = element("div");
    			div8 = element("div");
    			create_component(plus.$$.fragment);
    			t10 = space();
    			div9 = element("div");
    			create_component(minus.$$.fragment);
    			attr_dev(div0, "class", "wall svelte-a0gxwq");
    			set_style(div0, "grid-column", "1 / 32");
    			set_style(div0, "grid-row", "1 / 14");
    			add_location(div0, file$1, 210, 8, 6477);
    			attr_dev(div1, "class", "wall svelte-a0gxwq");
    			set_style(div1, "grid-column", "1 / 13");
    			set_style(div1, "grid-row", "1 / 14");
    			add_location(div1, file$1, 211, 8, 6554);
    			attr_dev(div2, "class", "bar svelte-a0gxwq");
    			add_location(div2, file$1, 212, 8, 6631);
    			attr_dev(div3, "class", "door-v svelte-a0gxwq");
    			set_style(div3, "grid-column", "12 / span 2");
    			set_style(div3, "grid-row", "4 / span 2");
    			add_location(div3, file$1, 215, 8, 6707);
    			attr_dev(div4, "class", "door-h svelte-a0gxwq");
    			set_style(div4, "grid-column", "4 / span 2");
    			set_style(div4, "grid-row", "13 / span 2");
    			add_location(div4, file$1, 219, 8, 6830);
    			attr_dev(div5, "class", "door-h svelte-a0gxwq");
    			set_style(div5, "grid-column", "20 / span 2");
    			set_style(div5, "grid-row", "13 / span 2");
    			add_location(div5, file$1, 223, 8, 6953);
    			attr_dev(div6, "class", "grid items-center p-3 w-full svelte-a0gxwq");
    			attr_dev(div6, "id", "grid-container");
    			set_style(div6, "--cell-size", TABLE_SIZE + "px");
    			add_location(div6, file$1, 195, 4, 5955);
    			attr_dev(div7, "class", "flex flex-row gap-3 p-2 bg-white border-2 border-l-0 border-gray-100 rounded-r-md items-center cursor-pointer");
    			add_location(div7, file$1, 248, 8, 7884);
    			attr_dev(div8, "class", "p-2 bg-white border-2 border-gray-100 rounded-l-md");
    			add_location(div8, file$1, 253, 12, 8200);
    			attr_dev(div9, "class", "p-2 bg-white border-2 border-l-0 border-gray-100 rounded-r-md");
    			add_location(div9, file$1, 256, 12, 8342);
    			attr_dev(div10, "class", "flex flex-row rounded-md shadow-sm cursor-pointer");
    			add_location(div10, file$1, 252, 8, 8123);
    			attr_dev(div11, "class", "flex flex-row gap-5 absolute bottom-5 right-5");
    			add_location(div11, file$1, 247, 4, 7815);
    			attr_dev(div12, "class", "flex flex-1 bg-gray-50 overflow-hidden inner-shadow outline-none relative svelte-a0gxwq");
    			add_location(div12, file$1, 194, 0, 5862);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div6, null);
    			}

    			append_dev(div6, t0);
    			append_dev(div6, div0);
    			append_dev(div6, t1);
    			append_dev(div6, div1);
    			append_dev(div6, t2);
    			append_dev(div6, div2);
    			mount_component(bar, div2, null);
    			append_dev(div6, t3);
    			append_dev(div6, div3);
    			append_dev(div6, t4);
    			append_dev(div6, div4);
    			append_dev(div6, t5);
    			append_dev(div6, div5);
    			append_dev(div6, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			/*div6_binding*/ ctx[15](div6);
    			append_dev(div12, t7);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			mount_component(move, div7, null);
    			append_dev(div7, t8);
    			mount_component(annotation, div7, null);
    			append_dev(div11, t9);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			mount_component(plus, div8, null);
    			append_dev(div10, t10);
    			append_dev(div10, div9);
    			mount_component(minus, div9, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div7, "click", click_handler_1, false, false, false),
    					listen_dev(div8, "click", /*zoomIn*/ ctx[9], false, false, false),
    					listen_dev(div9, "click", /*zoomOut*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*computeGridProperties, Math*/ 32) {
    				each_value_1 = /*cells*/ ctx[8];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div6, t0);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

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
    						each_blocks[i].m(div6, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const annotation_changes = {};

    			if (dirty & /*$$scope*/ 1073741824) {
    				annotation_changes.$$scope = { dirty, ctx };
    			}

    			annotation.$set(annotation_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bar.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(move.$$.fragment, local);
    			transition_in(annotation.$$.fragment, local);
    			transition_in(plus.$$.fragment, local);
    			transition_in(minus.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bar.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(move.$$.fragment, local);
    			transition_out(annotation.$$.fragment, local);
    			transition_out(plus.$$.fragment, local);
    			transition_out(minus.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			destroy_each(each_blocks_1, detaching);
    			destroy_component(bar);
    			destroy_each(each_blocks, detaching);
    			/*div6_binding*/ ctx[15](null);
    			destroy_component(move);
    			destroy_component(annotation);
    			destroy_component(plus);
    			destroy_component(minus);
    			mounted = false;
    			run_all(dispose);
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

    const click_handler_1 = () => {
    	
    };

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

    	const cells = Array(31 * 22).fill(0);
    	let container;
    	let handle;

    	onMount(() => {
    		handle = panzoom(container, {
    			minZoom: 0.5,
    			maxZoom: 2,
    			bounds: true,
    			zoomDoubleClickSpeed: 1,
    			zoomSpeed: 0.5
    		});
    	});

    	const zoomIn = () => {
    		handle.zoomTo(400, 200, 1.2);
    	};

    	const zoomOut = () => {
    		handle.zoomTo(400, 200, 0.8);
    	};

    	const writable_props = ['selected', 'personCount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Seating> was created with unknown prop '${key}'`);
    	});

    	const func = (i, s) => s === i;
    	const click_handler = i => handleSelection(i);

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			container = $$value;
    			$$invalidate(2, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('personCount' in $$props) $$invalidate(11, personCount = $$props.personCount);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createPanZoom: panzoom,
    		TABLE_SIZE,
    		TableDouble: Table,
    		Bar,
    		Plus,
    		Minus,
    		Move,
    		Annotation,
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
    		cells,
    		container,
    		handle,
    		zoomIn,
    		zoomOut,
    		tableCount
    	});

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('personCount' in $$props) $$invalidate(11, personCount = $$props.personCount);
    		if ('Direction' in $$props) Direction = $$props.Direction;
    		if ('hoverIndex' in $$props) $$invalidate(1, hoverIndex = $$props.hoverIndex);
    		if ('container' in $$props) $$invalidate(2, container = $$props.container);
    		if ('handle' in $$props) handle = $$props.handle;
    		if ('tableCount' in $$props) $$invalidate(12, tableCount = $$props.tableCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*personCount*/ 2048) {
    			// number of tables the visitor is allowed to select based on person count
    			$$invalidate(12, tableCount = Math.ceil(personCount / 2));
    		}

    		if ($$self.$$.dirty & /*tableCount, selected*/ 4097) {
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
    		cells,
    		zoomIn,
    		zoomOut,
    		personCount,
    		tableCount,
    		func,
    		click_handler,
    		div6_binding
    	];
    }

    class Seating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { selected: 0, personCount: 11 });

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

    		if (/*personCount*/ ctx[11] === undefined && !('personCount' in props)) {
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
    	let div;
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
    			div = element("div");
    			create_component(seatingplan.$$.fragment);
    			t2 = space();
    			create_component(panel.$$.fragment);
    			attr_dev(div, "class", "flex flex-row flex-1");
    			add_location(div, file, 12, 1, 368);
    			attr_dev(main, "class", "flex flex-col h-screen");
    			add_location(main, file, 10, 0, 315);
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
    			append_dev(main, div);
    			mount_component(seatingplan, div, null);
    			append_dev(div, t2);
    			mount_component(panel, div, null);
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
    	let dishCount = [0, 0, 0];
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
