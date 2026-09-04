window.__ModuleLoader__.load({
	id: "dsh-web-agent",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		//#endregion
		//#region node_modules/.pnpm/react@18.2.0/node_modules/react/cjs/react.production.min.js
		/**
		* @license React
		* react.production.min.js
		*
		* Copyright (c) Facebook, Inc. and its affiliates.
		*
		* This source code is licensed under the MIT license found in the
		* LICENSE file in the root directory of this source tree.
		*/
		var require_react_production_min = /* @__PURE__ */ __commonJSMin(((exports) => {
			var l = Symbol.for("react.element");
			var B = {
				isMounted: function() {
					return !1;
				},
				enqueueForceUpdate: function() {},
				enqueueReplaceState: function() {},
				enqueueSetState: function() {}
			};
			var C = Object.assign;
			var D = {};
			function E(a, b, e) {
				this.props = a;
				this.context = b;
				this.refs = D;
				this.updater = e || B;
			}
			E.prototype.isReactComponent = {};
			E.prototype.setState = function(a, b) {
				if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
				this.updater.enqueueSetState(this, a, b, "setState");
			};
			E.prototype.forceUpdate = function(a) {
				this.updater.enqueueForceUpdate(this, a, "forceUpdate");
			};
			function F() {}
			F.prototype = E.prototype;
			function G(a, b, e) {
				this.props = a;
				this.context = b;
				this.refs = D;
				this.updater = e || B;
			}
			var H = G.prototype = new F();
			H.constructor = G;
			C(H, E.prototype);
			H.isPureReactComponent = !0;
			Array.isArray;
			var J = Object.prototype.hasOwnProperty;
			var K = { current: null };
			var L = {
				key: !0,
				ref: !0,
				__self: !0,
				__source: !0
			};
			function M(a, b, e) {
				var d, c = {}, k = null, h = null;
				if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
				var g = arguments.length - 2;
				if (1 === g) c.children = e;
				else if (1 < g) {
					for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
					c.children = f;
				}
				if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
				return {
					$$typeof: l,
					type: a,
					key: k,
					ref: h,
					props: c,
					_owner: K.current
				};
			}
			exports.createElement = M;
		}));
		//#endregion
		//#region src/client.tsx
		var import_react = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = require_react_production_min();
		})))();
		const inject = ["betterSidebar"];
		function WebAgentPanel() {
			return (0, import_react.createElement)("div", { style: {
				height: "100%",
				boxSizing: "border-box",
				padding: "16px",
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				fontFamily: "system-ui, sans-serif"
			} }, (0, import_react.createElement)("div", { style: {
				fontSize: "18px",
				fontWeight: 700
			} }, "🤖 Web-Agent"), (0, import_react.createElement)("div", { style: {
				opacity: .72,
				lineHeight: 1.5
			} }, "真实 DeepSeek Web Agent"), (0, import_react.createElement)("div", { style: {
				padding: "12px",
				borderRadius: "10px",
				background: "var(--dsh-bg-elevated, rgba(127,127,127,.10))",
				lineHeight: 1.6
			} }, (0, import_react.createElement)("div", { style: {
				fontWeight: 600,
				marginBottom: "6px"
			} }, "浏览器入口"), (0, import_react.createElement)("div", { style: {
				opacity: .75,
				fontSize: "13px"
			} }, "点击此侧边栏标签即可进入 Web-Agent 控制面板。Agent 会通过真实浏览器打开 chat.deepseek.com，不使用 iframe，也不使用 DeepSeek API。")), (0, import_react.createElement)("div", { style: {
				marginTop: "auto",
				fontSize: "12px",
				opacity: .55
			} }, "下一步：连接真实浏览器视图与 DeepSeek Web Adapter。"));
		}
		function apply(ctx) {
			ctx.effect(() => {
				const sidebar = ctx.get("betterSidebar");
				if (!sidebar) return;
				return sidebar.registerTab({
					id: "web-agent:deepseek",
					title: "Web-Agent",
					order: 40,
					single: true,
					component: () => (0, import_react.createElement)(WebAgentPanel)
				});
			}, "web-agent: sidebar tab");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map