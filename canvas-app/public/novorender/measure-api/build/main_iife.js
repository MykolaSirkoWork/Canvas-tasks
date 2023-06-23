"use strict";
var NovoMeasure = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    FillDrawInfo2D: () => FillDrawInfo2D,
    MeasureAPI: () => MeasureAPI,
    MeasureError: () => MeasureError,
    MeasureObject: () => MeasureObject,
    MeasureScene: () => MeasureScene,
    createMeasureAPI: () => createMeasureAPI,
    cylinderOptions: () => cylinderOptions,
    equalMeasureEntity: () => equalMeasureEntity,
    equalMeasureEntityIndex: () => equalMeasureEntityIndex,
    getPathMatrices: () => getPathMatrices,
    loadScene: () => loadScene,
    renderMeasureEntity: () => renderMeasureEntity,
    toPathPointsFromMatrices: () => toPathPointsFromMatrices,
    toScreen: () => toScreen
  });

  // node_modules/comlink/dist/esm/comlink.mjs
  var proxyMarker = Symbol("Comlink.proxy");
  var createEndpoint = Symbol("Comlink.endpoint");
  var releaseProxy = Symbol("Comlink.releaseProxy");
  var throwMarker = Symbol("Comlink.thrown");
  var isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
  var proxyTransferHandler = {
    canHandle: (val) => isObject(val) && val[proxyMarker],
    serialize(obj) {
      const { port1, port2 } = new MessageChannel();
      expose(obj, port1);
      return [port2, [port2]];
    },
    deserialize(port) {
      port.start();
      return wrap(port);
    }
  };
  var throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
      let serialized;
      if (value instanceof Error) {
        serialized = {
          isError: true,
          value: {
            message: value.message,
            name: value.name,
            stack: value.stack
          }
        };
      } else {
        serialized = { isError: false, value };
      }
      return [serialized, []];
    },
    deserialize(serialized) {
      if (serialized.isError) {
        throw Object.assign(new Error(serialized.value.message), serialized.value);
      }
      throw serialized.value;
    }
  };
  var transferHandlers = /* @__PURE__ */ new Map([
    ["proxy", proxyTransferHandler],
    ["throw", throwTransferHandler]
  ]);
  function expose(obj, ep = self) {
    ep.addEventListener("message", function callback(ev) {
      if (!ev || !ev.data) {
        return;
      }
      const { id, type, path } = Object.assign({ path: [] }, ev.data);
      const argumentList = (ev.data.argumentList || []).map(fromWireValue);
      let returnValue;
      try {
        const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
        const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
        switch (type) {
          case "GET":
            {
              returnValue = rawValue;
            }
            break;
          case "SET":
            {
              parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
              returnValue = true;
            }
            break;
          case "APPLY":
            {
              returnValue = rawValue.apply(parent, argumentList);
            }
            break;
          case "CONSTRUCT":
            {
              const value = new rawValue(...argumentList);
              returnValue = proxy(value);
            }
            break;
          case "ENDPOINT":
            {
              const { port1, port2 } = new MessageChannel();
              expose(obj, port2);
              returnValue = transfer(port1, [port1]);
            }
            break;
          case "RELEASE":
            {
              returnValue = void 0;
            }
            break;
          default:
            return;
        }
      } catch (value) {
        returnValue = { value, [throwMarker]: 0 };
      }
      Promise.resolve(returnValue).catch((value) => {
        return { value, [throwMarker]: 0 };
      }).then((returnValue2) => {
        const [wireValue, transferables] = toWireValue(returnValue2);
        ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
        if (type === "RELEASE") {
          ep.removeEventListener("message", callback);
          closeEndPoint(ep);
        }
      });
    });
    if (ep.start) {
      ep.start();
    }
  }
  function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
  }
  function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
      endpoint.close();
  }
  function wrap(ep, target) {
    return createProxy(ep, [], target);
  }
  function throwIfProxyReleased(isReleased) {
    if (isReleased) {
      throw new Error("Proxy has been released and is not useable");
    }
  }
  function createProxy(ep, path = [], target = function() {
  }) {
    let isProxyReleased = false;
    const proxy2 = new Proxy(target, {
      get(_target, prop) {
        throwIfProxyReleased(isProxyReleased);
        if (prop === releaseProxy) {
          return () => {
            return requestResponseMessage(ep, {
              type: "RELEASE",
              path: path.map((p) => p.toString())
            }).then(() => {
              closeEndPoint(ep);
              isProxyReleased = true;
            });
          };
        }
        if (prop === "then") {
          if (path.length === 0) {
            return { then: () => proxy2 };
          }
          const r = requestResponseMessage(ep, {
            type: "GET",
            path: path.map((p) => p.toString())
          }).then(fromWireValue);
          return r.then.bind(r);
        }
        return createProxy(ep, [...path, prop]);
      },
      set(_target, prop, rawValue) {
        throwIfProxyReleased(isProxyReleased);
        const [value, transferables] = toWireValue(rawValue);
        return requestResponseMessage(ep, {
          type: "SET",
          path: [...path, prop].map((p) => p.toString()),
          value
        }, transferables).then(fromWireValue);
      },
      apply(_target, _thisArg, rawArgumentList) {
        throwIfProxyReleased(isProxyReleased);
        const last = path[path.length - 1];
        if (last === createEndpoint) {
          return requestResponseMessage(ep, {
            type: "ENDPOINT"
          }).then(fromWireValue);
        }
        if (last === "bind") {
          return createProxy(ep, path.slice(0, -1));
        }
        const [argumentList, transferables] = processArguments(rawArgumentList);
        return requestResponseMessage(ep, {
          type: "APPLY",
          path: path.map((p) => p.toString()),
          argumentList
        }, transferables).then(fromWireValue);
      },
      construct(_target, rawArgumentList) {
        throwIfProxyReleased(isProxyReleased);
        const [argumentList, transferables] = processArguments(rawArgumentList);
        return requestResponseMessage(ep, {
          type: "CONSTRUCT",
          path: path.map((p) => p.toString()),
          argumentList
        }, transferables).then(fromWireValue);
      }
    });
    return proxy2;
  }
  function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
  }
  function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
  }
  var transferCache = /* @__PURE__ */ new WeakMap();
  function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
  }
  function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
  }
  function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
      if (handler.canHandle(value)) {
        const [serializedValue, transferables] = handler.serialize(value);
        return [
          {
            type: "HANDLER",
            name,
            value: serializedValue
          },
          transferables
        ];
      }
    }
    return [
      {
        type: "RAW",
        value
      },
      transferCache.get(value) || []
    ];
  }
  function fromWireValue(value) {
    switch (value.type) {
      case "HANDLER":
        return transferHandlers.get(value.name).deserialize(value.value);
      case "RAW":
        return value.value;
    }
  }
  function requestResponseMessage(ep, msg, transfers) {
    return new Promise((resolve) => {
      const id = generateUUID();
      ep.addEventListener("message", function l(ev) {
        if (!ev.data || !ev.data.id || ev.data.id !== id) {
          return;
        }
        ep.removeEventListener("message", l);
        resolve(ev.data);
      });
      if (ep.start) {
        ep.start();
      }
      ep.postMessage(Object.assign({ id }, msg), transfers);
    });
  }
  function generateUUID() {
    return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
  }

  // node_modules/gl-matrix/esm/common.js
  var common_exports = {};
  __export(common_exports, {
    ARRAY_TYPE: () => ARRAY_TYPE,
    EPSILON: () => EPSILON,
    RANDOM: () => RANDOM,
    equals: () => equals,
    setMatrixArrayType: () => setMatrixArrayType,
    toRadian: () => toRadian
  });
  var EPSILON = 1e-6;
  var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
  var RANDOM = Math.random;
  function setMatrixArrayType(type) {
    ARRAY_TYPE = type;
  }
  var degree = Math.PI / 180;
  function toRadian(a) {
    return a * degree;
  }
  function equals(a, b) {
    return Math.abs(a - b) <= EPSILON * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (!Math.hypot)
    Math.hypot = function() {
      var y = 0, i = arguments.length;
      while (i--) {
        y += arguments[i] * arguments[i];
      }
      return Math.sqrt(y);
    };

  // node_modules/gl-matrix/esm/mat4.js
  var mat4_exports = {};
  __export(mat4_exports, {
    add: () => add,
    adjoint: () => adjoint,
    clone: () => clone,
    copy: () => copy,
    create: () => create,
    determinant: () => determinant,
    equals: () => equals2,
    exactEquals: () => exactEquals,
    frob: () => frob,
    fromQuat: () => fromQuat,
    fromQuat2: () => fromQuat2,
    fromRotation: () => fromRotation,
    fromRotationTranslation: () => fromRotationTranslation,
    fromRotationTranslationScale: () => fromRotationTranslationScale,
    fromRotationTranslationScaleOrigin: () => fromRotationTranslationScaleOrigin,
    fromScaling: () => fromScaling,
    fromTranslation: () => fromTranslation,
    fromValues: () => fromValues,
    fromXRotation: () => fromXRotation,
    fromYRotation: () => fromYRotation,
    fromZRotation: () => fromZRotation,
    frustum: () => frustum,
    getRotation: () => getRotation,
    getScaling: () => getScaling,
    getTranslation: () => getTranslation,
    identity: () => identity,
    invert: () => invert,
    lookAt: () => lookAt,
    mul: () => mul,
    multiply: () => multiply,
    multiplyScalar: () => multiplyScalar,
    multiplyScalarAndAdd: () => multiplyScalarAndAdd,
    ortho: () => ortho,
    orthoNO: () => orthoNO,
    orthoZO: () => orthoZO,
    perspective: () => perspective,
    perspectiveFromFieldOfView: () => perspectiveFromFieldOfView,
    perspectiveNO: () => perspectiveNO,
    perspectiveZO: () => perspectiveZO,
    rotate: () => rotate,
    rotateX: () => rotateX,
    rotateY: () => rotateY,
    rotateZ: () => rotateZ,
    scale: () => scale,
    set: () => set,
    str: () => str,
    sub: () => sub,
    subtract: () => subtract,
    targetTo: () => targetTo,
    translate: () => translate,
    transpose: () => transpose
  });
  function create() {
    var out = new ARRAY_TYPE(16);
    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
    }
    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  function clone(a) {
    var out = new ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    var out = new ARRAY_TYPE(16);
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    out[0] = m00;
    out[1] = m01;
    out[2] = m02;
    out[3] = m03;
    out[4] = m10;
    out[5] = m11;
    out[6] = m12;
    out[7] = m13;
    out[8] = m20;
    out[9] = m21;
    out[10] = m22;
    out[11] = m23;
    out[12] = m30;
    out[13] = m31;
    out[14] = m32;
    out[15] = m33;
    return out;
  }
  function identity(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function transpose(out, a) {
    if (out === a) {
      var a01 = a[1], a02 = a[2], a03 = a[3];
      var a12 = a[6], a13 = a[7];
      var a23 = a[11];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a01;
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a02;
      out[9] = a12;
      out[11] = a[14];
      out[12] = a03;
      out[13] = a13;
      out[14] = a23;
    } else {
      out[0] = a[0];
      out[1] = a[4];
      out[2] = a[8];
      out[3] = a[12];
      out[4] = a[1];
      out[5] = a[5];
      out[6] = a[9];
      out[7] = a[13];
      out[8] = a[2];
      out[9] = a[6];
      out[10] = a[10];
      out[11] = a[14];
      out[12] = a[3];
      out[13] = a[7];
      out[14] = a[11];
      out[15] = a[15];
    }
    return out;
  }
  function invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!det) {
      return null;
    }
    det = 1 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  function adjoint(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
    out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
    out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
    out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
    out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
    out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
    return out;
  }
  function determinant(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  }
  function multiply(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  function translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    return out;
  }
  function scale(out, a, v) {
    var x = v[0], y = v[1], z = v[2];
    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
  }
  function rotate(out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len4 = Math.hypot(x, y, z);
    var s, c, t;
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;
    var b00, b01, b02;
    var b10, b11, b12;
    var b20, b21, b22;
    if (len4 < EPSILON) {
      return null;
    }
    len4 = 1 / len4;
    x *= len4;
    y *= len4;
    z *= len4;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    b00 = x * x * t + c;
    b01 = y * x * t + z * s;
    b02 = z * x * t - y * s;
    b10 = x * y * t - z * s;
    b11 = y * y * t + c;
    b12 = z * y * t + x * s;
    b20 = x * z * t + y * s;
    b21 = y * z * t - x * s;
    b22 = z * z * t + c;
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;
    if (a !== out) {
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    return out;
  }
  function rotateX(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[0] = a[0];
      out[1] = a[1];
      out[2] = a[2];
      out[3] = a[3];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
  }
  function rotateY(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a20 = a[8];
    var a21 = a[9];
    var a22 = a[10];
    var a23 = a[11];
    if (a !== out) {
      out[4] = a[4];
      out[5] = a[5];
      out[6] = a[6];
      out[7] = a[7];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
  }
  function rotateZ(out, a, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a10 = a[4];
    var a11 = a[5];
    var a12 = a[6];
    var a13 = a[7];
    if (a !== out) {
      out[8] = a[8];
      out[9] = a[9];
      out[10] = a[10];
      out[11] = a[11];
      out[12] = a[12];
      out[13] = a[13];
      out[14] = a[14];
      out[15] = a[15];
    }
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
  }
  function fromTranslation(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromScaling(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = v[1];
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = v[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotation(out, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2];
    var len4 = Math.hypot(x, y, z);
    var s, c, t;
    if (len4 < EPSILON) {
      return null;
    }
    len4 = 1 / len4;
    x *= len4;
    y *= len4;
    z *= len4;
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    out[0] = x * x * t + c;
    out[1] = y * x * t + z * s;
    out[2] = z * x * t - y * s;
    out[3] = 0;
    out[4] = x * y * t - z * s;
    out[5] = y * y * t + c;
    out[6] = z * y * t + x * s;
    out[7] = 0;
    out[8] = x * z * t + y * s;
    out[9] = y * z * t - x * s;
    out[10] = z * z * t + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromXRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = s;
    out[7] = 0;
    out[8] = 0;
    out[9] = -s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromYRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = 0;
    out[2] = -s;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromZRotation(out, rad) {
    var s = Math.sin(rad);
    var c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = 0;
    out[3] = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function fromRotationTranslation(out, q, v) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromQuat2(out, a) {
    var translation = new ARRAY_TYPE(3);
    var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
    var magnitude = bx * bx + by * by + bz * bz + bw * bw;
    if (magnitude > 0) {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
    } else {
      translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
      translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
      translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
    }
    fromRotationTranslation(out, a, translation);
    return out;
  }
  function getTranslation(out, mat) {
    out[0] = mat[12];
    out[1] = mat[13];
    out[2] = mat[14];
    return out;
  }
  function getScaling(out, mat) {
    var m11 = mat[0];
    var m12 = mat[1];
    var m13 = mat[2];
    var m21 = mat[4];
    var m22 = mat[5];
    var m23 = mat[6];
    var m31 = mat[8];
    var m32 = mat[9];
    var m33 = mat[10];
    out[0] = Math.hypot(m11, m12, m13);
    out[1] = Math.hypot(m21, m22, m23);
    out[2] = Math.hypot(m31, m32, m33);
    return out;
  }
  function getRotation(out, mat) {
    var scaling = new ARRAY_TYPE(3);
    getScaling(scaling, mat);
    var is1 = 1 / scaling[0];
    var is2 = 1 / scaling[1];
    var is3 = 1 / scaling[2];
    var sm11 = mat[0] * is1;
    var sm12 = mat[1] * is2;
    var sm13 = mat[2] * is3;
    var sm21 = mat[4] * is1;
    var sm22 = mat[5] * is2;
    var sm23 = mat[6] * is3;
    var sm31 = mat[8] * is1;
    var sm32 = mat[9] * is2;
    var sm33 = mat[10] * is3;
    var trace = sm11 + sm22 + sm33;
    var S = 0;
    if (trace > 0) {
      S = Math.sqrt(trace + 1) * 2;
      out[3] = 0.25 * S;
      out[0] = (sm23 - sm32) / S;
      out[1] = (sm31 - sm13) / S;
      out[2] = (sm12 - sm21) / S;
    } else if (sm11 > sm22 && sm11 > sm33) {
      S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
      out[3] = (sm23 - sm32) / S;
      out[0] = 0.25 * S;
      out[1] = (sm12 + sm21) / S;
      out[2] = (sm31 + sm13) / S;
    } else if (sm22 > sm33) {
      S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
      out[3] = (sm31 - sm13) / S;
      out[0] = (sm12 + sm21) / S;
      out[1] = 0.25 * S;
      out[2] = (sm23 + sm32) / S;
    } else {
      S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
      out[3] = (sm12 - sm21) / S;
      out[0] = (sm31 + sm13) / S;
      out[1] = (sm23 + sm32) / S;
      out[2] = 0.25 * S;
    }
    return out;
  }
  function fromRotationTranslationScale(out, q, v, s) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    var ox = o[0];
    var oy = o[1];
    var oz = o[2];
    var out0 = (1 - (yy + zz)) * sx;
    var out1 = (xy + wz) * sx;
    var out2 = (xz - wy) * sx;
    var out4 = (xy - wz) * sy;
    var out5 = (1 - (xx + zz)) * sy;
    var out6 = (yz + wx) * sy;
    var out8 = (xz + wy) * sz;
    var out9 = (yz - wx) * sz;
    var out10 = (1 - (xx + yy)) * sz;
    out[0] = out0;
    out[1] = out1;
    out[2] = out2;
    out[3] = 0;
    out[4] = out4;
    out[5] = out5;
    out[6] = out6;
    out[7] = 0;
    out[8] = out8;
    out[9] = out9;
    out[10] = out10;
    out[11] = 0;
    out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
    out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
    out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
    out[15] = 1;
    return out;
  }
  function fromQuat(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  function frustum(out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left);
    var tb = 1 / (top - bottom);
    var nf = 1 / (near - far);
    out[0] = near * 2 * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = near * 2 * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near * 2 * nf;
    out[15] = 0;
    return out;
  }
  function perspectiveNO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf;
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = 2 * far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }
    return out;
  }
  var perspective = perspectiveNO;
  function perspectiveZO(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf;
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;
    if (far != null && far !== Infinity) {
      nf = 1 / (near - far);
      out[10] = far * nf;
      out[14] = far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -near;
    }
    return out;
  }
  function perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI / 180);
    var downTan = Math.tan(fov.downDegrees * Math.PI / 180);
    var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
    var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
    var xScale = 2 / (leftTan + rightTan);
    var yScale = 2 / (upTan + downTan);
    out[0] = xScale;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = yScale;
    out[6] = 0;
    out[7] = 0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = (upTan - downTan) * yScale * 0.5;
    out[10] = far / (near - far);
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = far * near / (near - far);
    out[15] = 0;
    return out;
  }
  function orthoNO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
  }
  var ortho = orthoNO;
  function orthoZO(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right);
    var bt = 1 / (bottom - top);
    var nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = near * nf;
    out[15] = 1;
    return out;
  }
  function lookAt(out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len4;
    var eyex = eye[0];
    var eyey = eye[1];
    var eyez = eye[2];
    var upx = up[0];
    var upy = up[1];
    var upz = up[2];
    var centerx = center[0];
    var centery = center[1];
    var centerz = center[2];
    if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
      return identity(out);
    }
    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len4 = 1 / Math.hypot(z0, z1, z2);
    z0 *= len4;
    z1 *= len4;
    z2 *= len4;
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len4 = Math.hypot(x0, x1, x2);
    if (!len4) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      len4 = 1 / len4;
      x0 *= len4;
      x1 *= len4;
      x2 *= len4;
    }
    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len4 = Math.hypot(y0, y1, y2);
    if (!len4) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len4 = 1 / len4;
      y0 *= len4;
      y1 *= len4;
      y2 *= len4;
    }
    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  }
  function targetTo(out, eye, target, up) {
    var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
    var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
    var len4 = z0 * z0 + z1 * z1 + z2 * z2;
    if (len4 > 0) {
      len4 = 1 / Math.sqrt(len4);
      z0 *= len4;
      z1 *= len4;
      z2 *= len4;
    }
    var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
    len4 = x0 * x0 + x1 * x1 + x2 * x2;
    if (len4 > 0) {
      len4 = 1 / Math.sqrt(len4);
      x0 *= len4;
      x1 *= len4;
      x2 *= len4;
    }
    out[0] = x0;
    out[1] = x1;
    out[2] = x2;
    out[3] = 0;
    out[4] = z1 * x2 - z2 * x1;
    out[5] = z2 * x0 - z0 * x2;
    out[6] = z0 * x1 - z1 * x0;
    out[7] = 0;
    out[8] = z0;
    out[9] = z1;
    out[10] = z2;
    out[11] = 0;
    out[12] = eyex;
    out[13] = eyey;
    out[14] = eyez;
    out[15] = 1;
    return out;
  }
  function str(a) {
    return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
  }
  function frob(a) {
    return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
  }
  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    out[4] = a[4] + b[4];
    out[5] = a[5] + b[5];
    out[6] = a[6] + b[6];
    out[7] = a[7] + b[7];
    out[8] = a[8] + b[8];
    out[9] = a[9] + b[9];
    out[10] = a[10] + b[10];
    out[11] = a[11] + b[11];
    out[12] = a[12] + b[12];
    out[13] = a[13] + b[13];
    out[14] = a[14] + b[14];
    out[15] = a[15] + b[15];
    return out;
  }
  function subtract(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    out[4] = a[4] - b[4];
    out[5] = a[5] - b[5];
    out[6] = a[6] - b[6];
    out[7] = a[7] - b[7];
    out[8] = a[8] - b[8];
    out[9] = a[9] - b[9];
    out[10] = a[10] - b[10];
    out[11] = a[11] - b[11];
    out[12] = a[12] - b[12];
    out[13] = a[13] - b[13];
    out[14] = a[14] - b[14];
    out[15] = a[15] - b[15];
    return out;
  }
  function multiplyScalar(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    out[4] = a[4] * b;
    out[5] = a[5] * b;
    out[6] = a[6] * b;
    out[7] = a[7] * b;
    out[8] = a[8] * b;
    out[9] = a[9] * b;
    out[10] = a[10] * b;
    out[11] = a[11] * b;
    out[12] = a[12] * b;
    out[13] = a[13] * b;
    out[14] = a[14] * b;
    out[15] = a[15] * b;
    return out;
  }
  function multiplyScalarAndAdd(out, a, b, scale5) {
    out[0] = a[0] + b[0] * scale5;
    out[1] = a[1] + b[1] * scale5;
    out[2] = a[2] + b[2] * scale5;
    out[3] = a[3] + b[3] * scale5;
    out[4] = a[4] + b[4] * scale5;
    out[5] = a[5] + b[5] * scale5;
    out[6] = a[6] + b[6] * scale5;
    out[7] = a[7] + b[7] * scale5;
    out[8] = a[8] + b[8] * scale5;
    out[9] = a[9] + b[9] * scale5;
    out[10] = a[10] + b[10] * scale5;
    out[11] = a[11] + b[11] * scale5;
    out[12] = a[12] + b[12] * scale5;
    out[13] = a[13] + b[13] * scale5;
    out[14] = a[14] + b[14] * scale5;
    out[15] = a[15] + b[15] * scale5;
    return out;
  }
  function exactEquals(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
  }
  function equals2(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
    var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
    var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
    var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
    var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON * Math.max(1, Math.abs(a15), Math.abs(b15));
  }
  var mul = multiply;
  var sub = subtract;

  // node_modules/gl-matrix/esm/vec3.js
  var vec3_exports = {};
  __export(vec3_exports, {
    add: () => add2,
    angle: () => angle,
    bezier: () => bezier,
    ceil: () => ceil,
    clone: () => clone2,
    copy: () => copy2,
    create: () => create2,
    cross: () => cross,
    dist: () => dist,
    distance: () => distance,
    div: () => div,
    divide: () => divide,
    dot: () => dot,
    equals: () => equals3,
    exactEquals: () => exactEquals2,
    floor: () => floor,
    forEach: () => forEach,
    fromValues: () => fromValues2,
    hermite: () => hermite,
    inverse: () => inverse,
    len: () => len,
    length: () => length,
    lerp: () => lerp,
    max: () => max,
    min: () => min,
    mul: () => mul2,
    multiply: () => multiply2,
    negate: () => negate,
    normalize: () => normalize,
    random: () => random,
    rotateX: () => rotateX2,
    rotateY: () => rotateY2,
    rotateZ: () => rotateZ2,
    round: () => round,
    scale: () => scale2,
    scaleAndAdd: () => scaleAndAdd,
    set: () => set2,
    sqrDist: () => sqrDist,
    sqrLen: () => sqrLen,
    squaredDistance: () => squaredDistance,
    squaredLength: () => squaredLength,
    str: () => str2,
    sub: () => sub2,
    subtract: () => subtract2,
    transformMat3: () => transformMat3,
    transformMat4: () => transformMat4,
    transformQuat: () => transformQuat,
    zero: () => zero
  });
  function create2() {
    var out = new ARRAY_TYPE(3);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    return out;
  }
  function clone2(a) {
    var out = new ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function length(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.hypot(x, y, z);
  }
  function fromValues2(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function copy2(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  function set2(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  function add2(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  function subtract2(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }
  function multiply2(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
  }
  function divide(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
  }
  function ceil(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    return out;
  }
  function floor(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    return out;
  }
  function min(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
  }
  function max(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
  }
  function round(out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    out[2] = Math.round(a[2]);
    return out;
  }
  function scale2(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
  }
  function scaleAndAdd(out, a, b, scale5) {
    out[0] = a[0] + b[0] * scale5;
    out[1] = a[1] + b[1] * scale5;
    out[2] = a[2] + b[2] * scale5;
    return out;
  }
  function distance(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return Math.hypot(x, y, z);
  }
  function squaredDistance(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return x * x + y * y + z * z;
  }
  function squaredLength(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return x * x + y * y + z * z;
  }
  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }
  function inverse(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    return out;
  }
  function normalize(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len4 = x * x + y * y + z * z;
    if (len4 > 0) {
      len4 = 1 / Math.sqrt(len4);
    }
    out[0] = a[0] * len4;
    out[1] = a[1] * len4;
    out[2] = a[2] * len4;
    return out;
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2];
    var bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  function lerp(out, a, b, t) {
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
  }
  function hermite(out, a, b, c, d, t) {
    var factorTimes2 = t * t;
    var factor1 = factorTimes2 * (2 * t - 3) + 1;
    var factor2 = factorTimes2 * (t - 2) + t;
    var factor3 = factorTimes2 * (t - 1);
    var factor4 = factorTimes2 * (3 - 2 * t);
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }
  function bezier(out, a, b, c, d, t) {
    var inverseFactor = 1 - t;
    var inverseFactorTimesTwo = inverseFactor * inverseFactor;
    var factorTimes2 = t * t;
    var factor1 = inverseFactorTimesTwo * inverseFactor;
    var factor2 = 3 * t * inverseFactorTimesTwo;
    var factor3 = 3 * factorTimes2 * inverseFactor;
    var factor4 = factorTimes2 * t;
    out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
    out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
    out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
    return out;
  }
  function random(out, scale5) {
    scale5 = scale5 || 1;
    var r = RANDOM() * 2 * Math.PI;
    var z = RANDOM() * 2 - 1;
    var zScale = Math.sqrt(1 - z * z) * scale5;
    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale5;
    return out;
  }
  function transformMat4(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    var w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }
  function transformMat3(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
  }
  function transformQuat(out, a, q) {
    var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    var x = a[0], y = a[1], z = a[2];
    var uvx = qy * z - qz * y, uvy = qz * x - qx * z, uvz = qx * y - qy * x;
    var uuvx = qy * uvz - qz * uvy, uuvy = qz * uvx - qx * uvz, uuvz = qx * uvy - qy * uvx;
    var w2 = qw * 2;
    uvx *= w2;
    uvy *= w2;
    uvz *= w2;
    uuvx *= 2;
    uuvy *= 2;
    uuvz *= 2;
    out[0] = x + uvx + uuvx;
    out[1] = y + uvy + uuvy;
    out[2] = z + uvz + uuvz;
    return out;
  }
  function rotateX2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0];
    r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
    r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function rotateY2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
    r[1] = p[1];
    r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function rotateZ2(out, a, b, rad) {
    var p = [], r = [];
    p[0] = a[0] - b[0];
    p[1] = a[1] - b[1];
    p[2] = a[2] - b[2];
    r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
    r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
    r[2] = p[2];
    out[0] = r[0] + b[0];
    out[1] = r[1] + b[1];
    out[2] = r[2] + b[2];
    return out;
  }
  function angle(a, b) {
    var ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2], mag1 = Math.sqrt(ax * ax + ay * ay + az * az), mag2 = Math.sqrt(bx * bx + by * by + bz * bz), mag = mag1 * mag2, cosine = mag && dot(a, b) / mag;
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
  }
  function zero(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
  }
  function str2(a) {
    return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
  }
  function exactEquals2(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }
  function equals3(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2];
    var b0 = b[0], b1 = b[1], b2 = b[2];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2));
  }
  var sub2 = subtract2;
  var mul2 = multiply2;
  var div = divide;
  var dist = distance;
  var sqrDist = squaredDistance;
  var len = length;
  var sqrLen = squaredLength;
  var forEach = function() {
    var vec = create2();
    return function(a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 3;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
      }
      return a;
    };
  }();

  // node_modules/gl-matrix/esm/vec4.js
  var vec4_exports = {};
  __export(vec4_exports, {
    add: () => add3,
    ceil: () => ceil2,
    clone: () => clone3,
    copy: () => copy3,
    create: () => create3,
    cross: () => cross2,
    dist: () => dist2,
    distance: () => distance2,
    div: () => div2,
    divide: () => divide2,
    dot: () => dot2,
    equals: () => equals4,
    exactEquals: () => exactEquals3,
    floor: () => floor2,
    forEach: () => forEach2,
    fromValues: () => fromValues3,
    inverse: () => inverse2,
    len: () => len2,
    length: () => length2,
    lerp: () => lerp2,
    max: () => max2,
    min: () => min2,
    mul: () => mul3,
    multiply: () => multiply3,
    negate: () => negate2,
    normalize: () => normalize2,
    random: () => random2,
    round: () => round2,
    scale: () => scale3,
    scaleAndAdd: () => scaleAndAdd2,
    set: () => set3,
    sqrDist: () => sqrDist2,
    sqrLen: () => sqrLen2,
    squaredDistance: () => squaredDistance2,
    squaredLength: () => squaredLength2,
    str: () => str3,
    sub: () => sub3,
    subtract: () => subtract3,
    transformMat4: () => transformMat42,
    transformQuat: () => transformQuat2,
    zero: () => zero2
  });
  function create3() {
    var out = new ARRAY_TYPE(4);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    }
    return out;
  }
  function clone3(a) {
    var out = new ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function fromValues3(x, y, z, w) {
    var out = new ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }
  function copy3(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
  }
  function set3(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }
  function add3(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
  }
  function subtract3(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
  }
  function multiply3(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
  }
  function divide2(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
  }
  function ceil2(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);
    out[3] = Math.ceil(a[3]);
    return out;
  }
  function floor2(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);
    out[3] = Math.floor(a[3]);
    return out;
  }
  function min2(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
  }
  function max2(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
  }
  function round2(out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    out[2] = Math.round(a[2]);
    out[3] = Math.round(a[3]);
    return out;
  }
  function scale3(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
  }
  function scaleAndAdd2(out, a, b, scale5) {
    out[0] = a[0] + b[0] * scale5;
    out[1] = a[1] + b[1] * scale5;
    out[2] = a[2] + b[2] * scale5;
    out[3] = a[3] + b[3] * scale5;
    return out;
  }
  function distance2(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    var w = b[3] - a[3];
    return Math.hypot(x, y, z, w);
  }
  function squaredDistance2(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    var w = b[3] - a[3];
    return x * x + y * y + z * z + w * w;
  }
  function length2(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    return Math.hypot(x, y, z, w);
  }
  function squaredLength2(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    return x * x + y * y + z * z + w * w;
  }
  function negate2(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
  }
  function inverse2(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    out[2] = 1 / a[2];
    out[3] = 1 / a[3];
    return out;
  }
  function normalize2(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len4 = x * x + y * y + z * z + w * w;
    if (len4 > 0) {
      len4 = 1 / Math.sqrt(len4);
    }
    out[0] = x * len4;
    out[1] = y * len4;
    out[2] = z * len4;
    out[3] = w * len4;
    return out;
  }
  function dot2(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  function cross2(out, u, v, w) {
    var A = v[0] * w[1] - v[1] * w[0], B = v[0] * w[2] - v[2] * w[0], C = v[0] * w[3] - v[3] * w[0], D = v[1] * w[2] - v[2] * w[1], E = v[1] * w[3] - v[3] * w[1], F = v[2] * w[3] - v[3] * w[2];
    var G = u[0];
    var H = u[1];
    var I = u[2];
    var J = u[3];
    out[0] = H * F - I * E + J * D;
    out[1] = -(G * F) + I * C - J * B;
    out[2] = G * E - H * C + J * A;
    out[3] = -(G * D) + H * B - I * A;
    return out;
  }
  function lerp2(out, a, b, t) {
    var ax = a[0];
    var ay = a[1];
    var az = a[2];
    var aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
  }
  function random2(out, scale5) {
    scale5 = scale5 || 1;
    var v1, v2, v3, v4;
    var s1, s2;
    do {
      v1 = RANDOM() * 2 - 1;
      v2 = RANDOM() * 2 - 1;
      s1 = v1 * v1 + v2 * v2;
    } while (s1 >= 1);
    do {
      v3 = RANDOM() * 2 - 1;
      v4 = RANDOM() * 2 - 1;
      s2 = v3 * v3 + v4 * v4;
    } while (s2 >= 1);
    var d = Math.sqrt((1 - s1) / s2);
    out[0] = scale5 * v1;
    out[1] = scale5 * v2;
    out[2] = scale5 * v3 * d;
    out[3] = scale5 * v4 * d;
    return out;
  }
  function transformMat42(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
  }
  function transformQuat2(out, a, q) {
    var x = a[0], y = a[1], z = a[2];
    var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    var ix = qw * x + qy * z - qz * y;
    var iy = qw * y + qz * x - qx * z;
    var iz = qw * z + qx * y - qy * x;
    var iw = -qx * x - qy * y - qz * z;
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    out[3] = a[3];
    return out;
  }
  function zero2(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
  }
  function str3(a) {
    return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
  }
  function exactEquals3(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
  }
  function equals4(a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON * Math.max(1, Math.abs(a3), Math.abs(b3));
  }
  var sub3 = subtract3;
  var mul3 = multiply3;
  var div2 = divide2;
  var dist2 = distance2;
  var sqrDist2 = squaredDistance2;
  var len2 = length2;
  var sqrLen2 = squaredLength2;
  var forEach2 = function() {
    var vec = create3();
    return function(a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 4;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        vec[3] = a[i + 3];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
        a[i + 3] = vec[3];
      }
      return a;
    };
  }();

  // node_modules/gl-matrix/esm/vec2.js
  var vec2_exports = {};
  __export(vec2_exports, {
    add: () => add4,
    angle: () => angle2,
    ceil: () => ceil3,
    clone: () => clone4,
    copy: () => copy4,
    create: () => create4,
    cross: () => cross3,
    dist: () => dist3,
    distance: () => distance3,
    div: () => div3,
    divide: () => divide3,
    dot: () => dot3,
    equals: () => equals5,
    exactEquals: () => exactEquals4,
    floor: () => floor3,
    forEach: () => forEach3,
    fromValues: () => fromValues4,
    inverse: () => inverse3,
    len: () => len3,
    length: () => length3,
    lerp: () => lerp3,
    max: () => max3,
    min: () => min3,
    mul: () => mul4,
    multiply: () => multiply4,
    negate: () => negate3,
    normalize: () => normalize3,
    random: () => random3,
    rotate: () => rotate2,
    round: () => round3,
    scale: () => scale4,
    scaleAndAdd: () => scaleAndAdd3,
    set: () => set4,
    sqrDist: () => sqrDist3,
    sqrLen: () => sqrLen3,
    squaredDistance: () => squaredDistance3,
    squaredLength: () => squaredLength3,
    str: () => str4,
    sub: () => sub4,
    subtract: () => subtract4,
    transformMat2: () => transformMat2,
    transformMat2d: () => transformMat2d,
    transformMat3: () => transformMat32,
    transformMat4: () => transformMat43,
    zero: () => zero3
  });
  function create4() {
    var out = new ARRAY_TYPE(2);
    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
    }
    return out;
  }
  function clone4(a) {
    var out = new ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
  }
  function fromValues4(x, y) {
    var out = new ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
  }
  function copy4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
  }
  function set4(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
  }
  function add4(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
  }
  function subtract4(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
  }
  function multiply4(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
  }
  function divide3(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
  }
  function ceil3(out, a) {
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    return out;
  }
  function floor3(out, a) {
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    return out;
  }
  function min3(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
  }
  function max3(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
  }
  function round3(out, a) {
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    return out;
  }
  function scale4(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
  }
  function scaleAndAdd3(out, a, b, scale5) {
    out[0] = a[0] + b[0] * scale5;
    out[1] = a[1] + b[1] * scale5;
    return out;
  }
  function distance3(a, b) {
    var x = b[0] - a[0], y = b[1] - a[1];
    return Math.hypot(x, y);
  }
  function squaredDistance3(a, b) {
    var x = b[0] - a[0], y = b[1] - a[1];
    return x * x + y * y;
  }
  function length3(a) {
    var x = a[0], y = a[1];
    return Math.hypot(x, y);
  }
  function squaredLength3(a) {
    var x = a[0], y = a[1];
    return x * x + y * y;
  }
  function negate3(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
  }
  function inverse3(out, a) {
    out[0] = 1 / a[0];
    out[1] = 1 / a[1];
    return out;
  }
  function normalize3(out, a) {
    var x = a[0], y = a[1];
    var len4 = x * x + y * y;
    if (len4 > 0) {
      len4 = 1 / Math.sqrt(len4);
    }
    out[0] = a[0] * len4;
    out[1] = a[1] * len4;
    return out;
  }
  function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function cross3(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
  }
  function lerp3(out, a, b, t) {
    var ax = a[0], ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
  }
  function random3(out, scale5) {
    scale5 = scale5 || 1;
    var r = RANDOM() * 2 * Math.PI;
    out[0] = Math.cos(r) * scale5;
    out[1] = Math.sin(r) * scale5;
    return out;
  }
  function transformMat2(out, a, m) {
    var x = a[0], y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
  }
  function transformMat2d(out, a, m) {
    var x = a[0], y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
  }
  function transformMat32(out, a, m) {
    var x = a[0], y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
  }
  function transformMat43(out, a, m) {
    var x = a[0];
    var y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
  }
  function rotate2(out, a, b, rad) {
    var p0 = a[0] - b[0], p1 = a[1] - b[1], sinC = Math.sin(rad), cosC = Math.cos(rad);
    out[0] = p0 * cosC - p1 * sinC + b[0];
    out[1] = p0 * sinC + p1 * cosC + b[1];
    return out;
  }
  function angle2(a, b) {
    var x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1], mag = Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2), cosine = mag && (x1 * x2 + y1 * y2) / mag;
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
  }
  function zero3(out) {
    out[0] = 0;
    out[1] = 0;
    return out;
  }
  function str4(a) {
    return "vec2(" + a[0] + ", " + a[1] + ")";
  }
  function exactEquals4(a, b) {
    return a[0] === b[0] && a[1] === b[1];
  }
  function equals5(a, b) {
    var a0 = a[0], a1 = a[1];
    var b0 = b[0], b1 = b[1];
    return Math.abs(a0 - b0) <= EPSILON * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON * Math.max(1, Math.abs(a1), Math.abs(b1));
  }
  var len3 = length3;
  var sub4 = subtract4;
  var mul4 = multiply4;
  var div3 = divide3;
  var dist3 = distance3;
  var sqrDist3 = squaredDistance3;
  var sqrLen3 = squaredLength3;
  var forEach3 = function() {
    var vec = create4();
    return function(a, stride, offset, count, fn, arg) {
      var i, l;
      if (!stride) {
        stride = 2;
      }
      if (!offset) {
        offset = 0;
      }
      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }
      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
      }
      return a;
    };
  }();

  // src/measureError.ts
  var MeasureError = class extends Error {
    constructor(type, message) {
      super(message);
      this.type = type;
    }
  };

  // src/measureScene.ts
  common_exports.setMatrixArrayType(Array);
  var MeasureScene = class {
    constructor(assetUrl, measureService) {
      this.assetUrl = assetUrl;
      this.measureService = measureService;
      this.workerScene = this.measureService.createMeasureTool(
        assetUrl.toString()
      );
    }
    workerScene;
    async measurePair(a, b, settingA, settingB) {
      if (a.drawKind == "vertex") {
        if (b.drawKind == "vertex") {
          return this.pointToPoint(a.parameter, b.parameter);
        }
        return this.measureToPoint(b, a.parameter, settingB);
      }
      if (b.drawKind == "vertex") {
        return this.measureToPoint(a, b.parameter, settingA);
      }
      const workerScene = await this.workerScene;
      const entities = [
        { object: a, settings: settingA },
        { object: b, settings: settingB }
      ];
      entities.sort((a2, b2) => a2.object.drawKind.localeCompare(b2.object.drawKind));
      const [A, B] = entities;
      const kindCombo = `${A.object.drawKind}_${B.object.drawKind}`;
      switch (kindCombo) {
        case "curveSegment_curveSegment":
          return await workerScene.segmentToSegmentMeasure(
            A.object.ObjectId,
            A.object.pathIndex,
            A.object.instanceIndex,
            B.object.ObjectId,
            B.object.pathIndex,
            B.object.instanceIndex
          );
        case "curveSegment_edge":
          return await workerScene.segmentToEdgeMeasure(
            A.object.ObjectId,
            A.object.pathIndex,
            A.object.instanceIndex,
            B.object.ObjectId,
            B.object.pathIndex,
            B.object.instanceIndex
          );
        case "curveSegment_face":
          return await workerScene.segmentToFaceMeasure(
            A.object.ObjectId,
            A.object.pathIndex,
            A.object.instanceIndex,
            B.object.ObjectId,
            B.object.pathIndex,
            B.object.instanceIndex,
            B.settings
          );
        case "edge_edge":
          return await workerScene.edgeToEdgeMeasure(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            b.ObjectId,
            b.pathIndex,
            b.instanceIndex
          );
        case "edge_face":
          return await workerScene.edgeToFaceMeasure(
            A.object.ObjectId,
            A.object.pathIndex,
            A.object.instanceIndex,
            B.object.ObjectId,
            B.object.pathIndex,
            B.object.instanceIndex,
            B.settings
          );
        case "face_face":
          return await workerScene.faceToFaceMeasure(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            b.ObjectId,
            b.pathIndex,
            b.instanceIndex,
            A.settings,
            B.settings
          );
      }
    }
    async measureSingle(a, setting) {
      const workerScene = await this.workerScene;
      switch (a.drawKind) {
        case "curveSegment":
          return await workerScene.getCurveValues(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            "curveSegment"
          );
        case "edge":
          return await workerScene.getCurveValues(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            "edge"
          );
        case "face":
          return await workerScene.getFaceValues(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            setting
          );
      }
    }
    async measure(a, b, settingA, settingB) {
      return b ? await this.measurePair(a, b, settingA, settingB) : await this.measureSingle(a, settingA);
    }
    async measureToPoint(a, b, setting) {
      const point = vec3_exports.copy(vec3_exports.create(), b);
      if (a.drawKind == "vertex") {
        return this.pointToPoint(a.parameter, point);
      }
      const workerScene = await this.workerScene;
      switch (a.drawKind) {
        case "curveSegment":
          return await workerScene.segmentToPointMeasure(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            point
          );
        case "edge":
          return await workerScene.edgeToPointMeasure(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            point
          );
        case "face":
          return await workerScene.faceToPointMeasure(
            a.ObjectId,
            a.pathIndex,
            a.instanceIndex,
            point,
            setting
          );
      }
    }
    pointToPoint(a, b) {
      const diff = vec3_exports.sub(vec3_exports.create(), a, b);
      return {
        drawKind: "measureResult",
        distance: vec3_exports.len(diff),
        distanceX: Math.abs(diff[0]),
        distanceY: Math.abs(diff[1]),
        distanceZ: Math.abs(diff[2]),
        measureInfoA: { point: vec3_exports.copy(vec3_exports.create(), a) },
        measureInfoB: { point: vec3_exports.copy(vec3_exports.create(), b) }
      };
    }
    async collision(a, b, setting) {
      if (a.drawKind == "face" && b.drawKind == "face") {
        const workerScene = await this.workerScene;
        return await workerScene.faceToFaceCollision(
          a.ObjectId,
          a.pathIndex,
          a.instanceIndex,
          b.ObjectId,
          b.pathIndex,
          b.instanceIndex,
          setting
        );
      }
      return void 0;
    }
    async getCameraValues(a, cameraDir) {
      const workerScene = await this.workerScene;
      return workerScene.getCameraValuesFromFace(
        a.ObjectId,
        a.pathIndex,
        a.instanceIndex,
        cameraDir
      );
    }
    async pickMeasureEntity(id, selectionPosition, tolerance) {
      const workerScene = await this.workerScene;
      const pos = vec3_exports.copy(vec3_exports.create(), selectionPosition);
      return await workerScene.pickEntity(id, pos, tolerance);
    }
    async pickMeasureEntityOnCurrentObject(id, selectionPosition, tolerance) {
      const workerScene = await this.workerScene;
      const pos = vec3_exports.copy(vec3_exports.create(), selectionPosition);
      return await workerScene.pickEntityOnCurrentObject(id, pos, tolerance);
    }
    async swapCylinder(entity, to) {
      if (entity.drawKind == "face") {
        const workerScene = await this.workerScene;
        const pathIdx = await workerScene.swapCylinder(
          entity.ObjectId,
          entity.pathIndex,
          entity.instanceIndex,
          to
        );
        if (pathIdx != void 0) {
          return {
            ...entity,
            pathIndex: pathIdx
          };
        }
      }
    }
    async followParametricEntity(id, entity, setting) {
      const workerScene = await this.workerScene;
      let parameterBounds = void 0;
      let emulatedCurve = void 0;
      let type = void 0;
      switch (entity.drawKind) {
        case "edge": {
          type = "edge";
          parameterBounds = await workerScene.getParameterBoundsForCurve(
            id,
            entity.pathIndex,
            "edge"
          );
          break;
        }
        case "face": {
          const cylinderData = await workerScene.getCylinderCurve(
            id,
            entity.pathIndex,
            entity.instanceIndex,
            setting
          );
          if (cylinderData) {
            type = "cylinder";
            parameterBounds = cylinderData[0];
            emulatedCurve = {
              start: cylinderData[1][0],
              dir: vec3_exports.normalize(
                vec3_exports.create(),
                vec3_exports.subtract(
                  vec3_exports.create(),
                  cylinderData[1][1],
                  cylinderData[1][0]
                )
              )
            };
          }
          break;
        }
        case "curveSegment": {
          type = "curve";
          parameterBounds = await workerScene.getParameterBoundsForCurve(
            id,
            entity.pathIndex,
            "curveSegment"
          );
          break;
        }
      }
      if (parameterBounds && type) {
        async function getCameraValues(t) {
          if (emulatedCurve) {
            const param = t < 0 ? 0 : t > parameterBounds.end ? parameterBounds.end : t;
            return {
              position: vec3_exports.scaleAndAdd(
                vec3_exports.create(),
                emulatedCurve.start,
                emulatedCurve.dir,
                param
              ),
              normal: vec3_exports.negate(vec3_exports.create(), emulatedCurve.dir)
            };
          }
          const curveVaues = await workerScene.evalCurve(
            id,
            entity.pathIndex,
            entity.instanceIndex,
            t,
            entity.drawKind == "edge" ? "edge" : "curveSegment"
          );
          if (curveVaues) {
            return { position: curveVaues[0], normal: curveVaues[1] };
          }
        }
        const selectedEntity = {
          ...entity,
          ObjectId: id,
          drawKind: entity.drawKind
        };
        return {
          type,
          ids: [id],
          selectedEntity,
          parameterBounds,
          getCameraValues
        };
      }
    }
    async followParametricObjectFromPosition(id, selectionPosition, setting) {
      const workerScene = await this.workerScene;
      const pos = vec3_exports.copy(vec3_exports.create(), selectionPosition);
      const pickedEntity = await workerScene.pickEntity(id, pos);
      if (pickedEntity.entity && pickedEntity.entity.drawKind != "vertex") {
        return this.followParametricEntity(id, pickedEntity.entity, setting);
      }
      return void 0;
    }
    async followParametricObjects(ids, setting) {
      const workerScene = await this.workerScene;
      if (ids.length == 1) {
        const entity = await workerScene.viableFollowPathEntity(ids[0]);
        if (entity != void 0 && entity.drawKind != "vertex") {
          return this.followParametricEntity(ids[0], entity);
        }
      }
      const lineStrip = await workerScene.getLineStripFromCylinders(ids, setting);
      if (lineStrip.length > 1) {
        let len4 = 0;
        for (let i = 1; i < lineStrip.length; ++i) {
          len4 += vec3_exports.dist(lineStrip[i - 1], lineStrip[i]);
        }
        const parameterBounds = { start: 0, end: len4 };
        async function getCameraValues(t) {
          const param = t < 0 ? 0 : t > parameterBounds.end ? parameterBounds.end : t;
          let i = 1;
          let length4 = 0;
          let prevLength = 0;
          let currLength = 0;
          for (; i < lineStrip.length; ++i) {
            currLength = vec3_exports.dist(lineStrip[i - 1], lineStrip[i]);
            length4 += currLength;
            if (length4 > param) {
              break;
            }
            prevLength = length4;
          }
          if (i == lineStrip.length) {
            const dir2 = vec3_exports.subtract(
              vec3_exports.create(),
              lineStrip[i - 2],
              lineStrip[i - 1]
            );
            return {
              position: lineStrip[i - 1],
              normal: vec3_exports.normalize(dir2, dir2)
            };
          }
          const dir = vec3_exports.subtract(
            vec3_exports.create(),
            lineStrip[i - 1],
            lineStrip[i]
          );
          return {
            position: vec3_exports.lerp(
              vec3_exports.create(),
              lineStrip[i - 1],
              lineStrip[i],
              (param - prevLength) / currLength
            ),
            normal: vec3_exports.normalize(dir, dir)
          };
        }
        return {
          type: lineStrip.length == 2 ? "cylinder" : "cylinders",
          ids,
          selectedEntity: void 0,
          parameterBounds,
          getCameraValues
        };
      }
      return void 0;
    }
    async getParametricProduct(productId) {
      const workerScene = await this.workerScene;
      return await workerScene.getProductObject(productId);
    }
    async getProfileViewFromEntity(entity, setting) {
      const workerScene = await this.workerScene;
      switch (entity.drawKind) {
        case "curveSegment": {
          return await workerScene.curveSegmentProfile(
            entity.ObjectId,
            entity.pathIndex,
            entity.instanceIndex
          );
        }
        case "face": {
          return await workerScene.cylinderProfile(
            entity.ObjectId,
            entity.pathIndex,
            entity.instanceIndex,
            setting
          );
        }
      }
      return void 0;
    }
    async getProfileViewFromMultiSelect(products, setting) {
      const workerScene = await this.workerScene;
      const profile = await workerScene.multiSelectProfile(products, setting);
      if (typeof profile === "string") {
        throw new MeasureError("Profile error", profile);
      }
      return profile;
    }
    reverseProfile(inProfile) {
      const endParam = inProfile.profilePoints[inProfile.profilePoints.length - 1][0];
      const rProfile = [];
      for (let i = inProfile.profilePoints.length - 1; i >= 0; --i) {
        const p = inProfile.profilePoints[i];
        rProfile.push(vec2_exports.fromValues((p[0] - endParam) * -1, p[1]));
      }
      return {
        profilePoints: rProfile,
        slopes: inProfile.slopes.reverse(),
        startElevation: inProfile.endElevation,
        endElevation: inProfile.startElevation,
        top: inProfile.top,
        bottom: inProfile.bottom
      };
    }
    areaFromPolygon(vertices, normals) {
      if (vertices.length == 0) {
        return { area: void 0, polygon: [] };
      }
      if (vertices.length != normals.length) {
        throw new MeasureError(
          "Area measurement",
          "Number of normals and vertices needs to be equal"
        );
      }
      let useXYPlane = false;
      const epsilon = 1e-3;
      const normal = normals[0];
      for (let i = 1; i < normals.length; ++i) {
        if (1 - Math.abs(vec3_exports.dot(normal, normals[i])) > epsilon) {
          useXYPlane = true;
          break;
        }
      }
      if (useXYPlane) {
        let total2 = 0;
        const polygon2 = [];
        for (let i = 0; i < vertices.length; i++) {
          let addX = vertices[i][0];
          let addY = vertices[i == vertices.length - 1 ? 0 : i + 1][2];
          let subX = vertices[i == vertices.length - 1 ? 0 : i + 1][0];
          let subY = vertices[i][2];
          total2 += addX * addY * 0.5;
          total2 -= subX * subY * 0.5;
          polygon2.push(
            vec3_exports.fromValues(vertices[i][0], vertices[0][1], vertices[i][2])
          );
        }
        return { area: Math.abs(total2), polygon: polygon2 };
      }
      const polygon = [];
      polygon.push(vertices[0]);
      const vertex = vertices[0];
      for (let i = 1; i < vertices.length; ++i) {
        const v = vertices[i];
        const vo = vec3_exports.subtract(vec3_exports.create(), v, vertex);
        const dist4 = vec3_exports.dot(vo, normal) * -1;
        polygon.push(vec3_exports.scaleAndAdd(vec3_exports.create(), v, normal, dist4));
      }
      if (polygon.length == 1) {
        return { area: 0, polygon };
      }
      const xDir = vec3_exports.subtract(vec3_exports.create(), polygon[1], polygon[0]);
      vec3_exports.normalize(xDir, xDir);
      const yDir = vec3_exports.cross(vec3_exports.create(), normal, xDir);
      vec3_exports.normalize(yDir, yDir);
      const polygon2d = [];
      polygon2d.push(vec2_exports.fromValues(0, 0));
      for (let i = 1; i < vertices.length; ++i) {
        const p = polygon[i];
        const po = vec3_exports.subtract(vec3_exports.create(), p, vertex);
        polygon2d.push(vec2_exports.fromValues(vec3_exports.dot(po, xDir), vec3_exports.dot(po, yDir)));
      }
      let total = 0;
      for (let i = 0; i < polygon2d.length; i++) {
        let addX = polygon2d[i][0];
        let addY = polygon2d[i == vertices.length - 1 ? 0 : i + 1][1];
        let subX = polygon2d[i == vertices.length - 1 ? 0 : i + 1][0];
        let subY = polygon2d[i][1];
        total += addX * addY * 0.5;
        total -= subX * subY * 0.5;
      }
      return { area: Math.abs(total), polygon };
    }
    measureLineStrip(vertices) {
      let totalLength = 0;
      let segmentLengts = [];
      let angles = [];
      let prevSeg = void 0;
      for (let i = 1; i < vertices.length; ++i) {
        const l = vec3_exports.dist(vertices[i - 1], vertices[i]);
        totalLength += l;
        segmentLengts.push(l);
        const dir = vec3_exports.sub(vec3_exports.create(), vertices[i], vertices[i - 1]);
        vec3_exports.normalize(dir, dir);
        if (prevSeg != void 0) {
          let angle3 = vec3_exports.angle(prevSeg, dir);
          if (angle3 > Math.PI) {
            angle3 = Math.PI * 2 - angle3;
          }
          angles.push(angle3);
        }
        vec3_exports.negate(dir, dir);
        prevSeg = dir;
      }
      return { totalLength, linestrip: vertices, segmentLengts, angles };
    }
    async inspectObject(productId, objectType) {
      const workerScene = await this.workerScene;
      return workerScene.getManholeValues(productId);
    }
    async getManholeDrawObject(entity) {
      const workerScene = await this.workerScene;
      return workerScene.getManholeDrawObject(entity);
    }
    async getEntitiyDrawObjects(entity, setting) {
      const workerScene = await this.workerScene;
      switch (entity.drawKind) {
        case "edge": {
          const wsVertices = await workerScene.getTesselatedEdge(
            entity.ObjectId,
            entity.pathIndex,
            entity.instanceIndex
          );
          return {
            kind: "edge",
            parts: [{ vertices3D: wsVertices, drawType: "lines" }]
          };
        }
        case "face": {
          const drawObjects = await workerScene.getFaceDrawObject(
            entity.ObjectId,
            entity.pathIndex,
            entity.instanceIndex,
            setting
          );
          return drawObjects;
        }
        case "vertex": {
          return {
            kind: "vertex",
            parts: [{ vertices3D: [entity.parameter], drawType: "vertex" }]
          };
        }
        case "curveSegment": {
          const wsVertices = await workerScene.tesselateCurveSegment(
            entity.ObjectId,
            entity.pathIndex,
            entity.instanceIndex
          );
          return {
            kind: "curveSegment",
            parts: [{ vertices3D: wsVertices, drawType: "lines" }]
          };
        }
      }
    }
    async getRoadProfile(roadId) {
      const workerScene = await this.workerScene;
      return workerScene.getRoadProfile(roadId);
    }
    async getCrossSlope(roadId) {
      const workerScene = await this.workerScene;
      return workerScene.getRoadCrossSlope(roadId);
    }
    async getCrossSections(roadIds, profileNumber) {
      const workerScene = await this.workerScene;
      const sections = await Promise.all(roadIds.map((rId) => workerScene.getCrossSection(rId, profileNumber)));
      const s = sections.filter((s2) => s2 != void 0);
      return s;
    }
  };
  async function loadScene(measureService, assetsUrl) {
    return new MeasureScene(assetsUrl, measureService);
  }

  // src/calculations2d.ts
  function lineSeg2dIntersection(lineA, lineB) {
    const dirA = vec2_exports.sub(vec2_exports.create(), lineA.end, lineA.start);
    const dirB = vec2_exports.sub(vec2_exports.create(), lineB.end, lineB.start);
    const axb = dirA[0] * dirB[1] - dirA[1] * dirB[0];
    const startDir = vec2_exports.sub(vec2_exports.create(), lineB.start, lineA.start);
    if (axb == 0) {
      return void 0;
    }
    const t = (startDir[0] * dirB[1] - startDir[1] * dirB[0]) / axb;
    const u = (startDir[0] * dirA[1] - startDir[1] * dirA[0]) / axb;
    if (0 <= t && t <= 1 && (0 <= u && u <= 1)) {
      return {
        p: vec2_exports.scaleAndAdd(vec2_exports.create(), lineA.start, dirA, t),
        t,
        u
      };
    }
    return void 0;
  }

  // src/drawobject_factorty.ts
  var SCREEN_SPACE_EPSILON = 1e-6;
  function getResultDrawObject(result) {
    const parts = [];
    if (result.measureInfoA?.point && result.measureInfoB?.point) {
      const measurePoints = [result.measureInfoA?.point, result.measureInfoB?.point];
      const flip = measurePoints[0][1] > measurePoints[1][1];
      let pts = flip ? [measurePoints[1], measurePoints[0]] : [measurePoints[0], measurePoints[1]];
      const diff = vec3_exports.sub(vec3_exports.create(), pts[0], pts[1]);
      const measureLen = vec3_exports.len(diff);
      parts.push({ name: "result", text: measureLen.toFixed(3), drawType: "lines", vertices3D: [vec3_exports.clone(measurePoints[0]), vec3_exports.clone(measurePoints[1])] });
      pts = [
        pts[0],
        vec3_exports.fromValues(pts[1][0], pts[0][1], pts[0][2]),
        vec3_exports.fromValues(pts[1][0], pts[0][1], pts[1][2]),
        pts[1]
      ];
      parts.push({ name: "x-axis", text: Math.abs(diff[0]).toFixed(3), drawType: "lines", vertices3D: [vec3_exports.clone(pts[0]), vec3_exports.clone(pts[1])] });
      parts.push({ name: "y-axis", text: Math.abs(diff[2]).toFixed(3), drawType: "lines", vertices3D: [vec3_exports.clone(pts[1]), vec3_exports.clone(pts[2])] });
      parts.push({ name: "z-axis", text: Math.abs(diff[1]).toFixed(3), drawType: "lines", vertices3D: [vec3_exports.clone(pts[2]), vec3_exports.clone(pts[3])] });
      const planarDiff = vec2_exports.len(vec2_exports.fromValues(diff[0], diff[2]));
      const xyPt1 = vec3_exports.fromValues(pts[0][0], Math.min(pts[0][1], pts[3][1]), pts[0][2]);
      const xyPt2 = vec3_exports.fromValues(pts[3][0], Math.min(pts[0][1], pts[3][1]), pts[3][2]);
      parts.push({ name: "xy-plane", text: planarDiff.toFixed(3), drawType: "lines", vertices3D: [xyPt1, xyPt2] });
      const zDiff = vec3_exports.sub(vec3_exports.create(), pts[2], pts[3]);
      const angle3 = vec3_exports.angle(diff, zDiff) * (180 / Math.PI);
      if (angle3 > 0.1) {
        const fromP = flip ? vec3_exports.clone(measurePoints[1]) : vec3_exports.clone(measurePoints[0]);
        const toP = vec3_exports.clone(pts[2]);
        parts.push({ name: "z-angle", text: angle3.toFixed(1) + "\xB0", drawType: "angle", vertices3D: [vec3_exports.clone(pts[3]), fromP, toP] });
      }
      const xzDiff = vec3_exports.sub(vec3_exports.create(), xyPt1, xyPt2);
      const xzAngle = vec3_exports.angle(diff, xzDiff) * (180 / Math.PI);
      if (xzAngle > 0.1) {
        const fromP = flip ? vec3_exports.clone(measurePoints[0]) : vec3_exports.clone(measurePoints[1]);
        parts.push({ name: "xz-angle", text: xzAngle.toFixed(1) + "\xB0", drawType: "angle", vertices3D: [vec3_exports.clone(xyPt1), fromP, vec3_exports.clone(xyPt2)] });
      }
    }
    if (result.angle) {
      parts.push({
        name: "cylinder-angle",
        text: (result.angle.radians * (180 / Math.PI)).toFixed(1) + "\xB0",
        drawType: "angle",
        vertices3D: [vec3_exports.clone(result.angle.angleDrawInfo[0]), vec3_exports.clone(result.angle.angleDrawInfo[1]), vec3_exports.clone(result.angle.angleDrawInfo[2])]
      });
      if (result.angle.additionalLine) {
        parts.push({ name: "cylinder-angle-line", drawType: "lines", vertices3D: [vec3_exports.clone(result.angle.additionalLine[0]), vec3_exports.clone(result.angle.additionalLine[1])] });
      }
    }
    if (result.normalPoints) {
      const dist4 = vec3_exports.len(vec3_exports.sub(vec3_exports.create(), result.normalPoints[0], result.normalPoints[1]));
      parts.push({ name: "normal", text: dist4.toFixed(3), drawType: "lines", vertices3D: [vec3_exports.clone(result.normalPoints[0]), vec3_exports.clone(result.normalPoints[1])] });
    }
    return { parts, kind: "complex" };
  }
  function getDrawObjectFromPointArray(view, points, closed, angles, generateLineLabels) {
    if (points.length === 0) {
      return void 0;
    }
    const parts = [];
    if (points.length === 1) {
      parts.push({ drawType: "vertex", vertices3D: points });
    } else {
      let text = void 0;
      if (generateLineLabels) {
        const labels = [];
        for (let i = 1; i < points.length; ++i) {
          labels.push(vec3_exports.dist(points[i - 1], points[i]).toFixed(3));
        }
        text = [labels];
      }
      parts.push({ drawType: closed ? "filled" : "lines", vertices3D: points, text });
    }
    const drawObjects = [];
    drawObjects.push({ kind: "complex", parts });
    if (angles) {
      const endIdx = closed ? points.length : points.length - 1;
      for (let i = closed ? 0 : 1; i < endIdx; ++i) {
        const anglePt = points[i];
        const fromPIdx = i === 0 ? points.length - 1 : i - 1;
        const toPIdx = i === points.length - 1 ? 0 : i + 1;
        const fromP = points[fromPIdx];
        const toP = points[toPIdx];
        const diffA = vec3_exports.sub(vec3_exports.create(), points[fromPIdx], anglePt);
        const diffB = vec3_exports.sub(vec3_exports.create(), points[toPIdx], anglePt);
        const angle3 = vec3_exports.angle(diffA, diffB) * (180 / Math.PI);
        if (angle3 > 0.1) {
          parts.push({ text: angle3.toFixed(1) + "\xB0", drawType: "angle", vertices3D: [vec3_exports.clone(anglePt), vec3_exports.clone(fromP), vec3_exports.clone(toP)] });
        }
      }
    }
    FillDrawInfo2D(view, drawObjects);
    return { kind: "basic", objects: drawObjects };
  }
  function getDrawTextObject(view, points, text) {
    if (points.length === 0) {
      return void 0;
    }
    const parts = [];
    parts.push({ drawType: "text", vertices3D: points, text });
    const drawObjects = [];
    drawObjects.push({ kind: "complex", parts });
    FillDrawInfo2D(view, drawObjects);
    return { kind: "basic", objects: drawObjects };
  }
  function get2dNormal(object, line) {
    if (object.kind != "basic") {
      return void 0;
    }
    const intersections = [];
    const emptyVertex = vec3_exports.create();
    object.objects.forEach((drawobj) => {
      if (drawobj.kind == "complex" || drawobj.kind == "curveSegment" || drawobj.kind == "edge") {
        drawobj.parts.forEach((part) => {
          if (part.vertices2D && (part.drawType == "lines" || part.drawType == "curveSegment" || part.drawType == "filled")) {
            for (let i = 1; i < part.vertices2D.length; ++i) {
              if (vec3_exports.equals(part.vertices3D[i - 1], emptyVertex) || vec3_exports.equals(part.vertices3D[i], emptyVertex)) {
                continue;
              }
              const lineB = { start: part.vertices2D[i - 1], end: part.vertices2D[i] };
              const intersection = lineSeg2dIntersection(line, lineB);
              if (intersection) {
                intersections.push({ intersection, line: lineB });
              }
            }
          }
        });
      }
    });
    if (intersections.length > 0) {
      intersections.sort((a, b) => a.intersection.t - b.intersection.t);
      const line2 = intersections[0].line;
      const dx = line2.end[0] - line2.start[0];
      const dy = line2.end[1] - line2.start[1];
      const normal = vec2_exports.fromValues(-dy, dx);
      vec2_exports.normalize(normal, normal);
      return {
        normal,
        position: intersections[0].intersection.p
      };
    }
    return void 0;
  }
  function getTraceDrawOject(objects, line) {
    if (objects.length > 1) {
      const intersections = [];
      const emptyVertex = vec3_exports.create();
      objects.forEach((obj) => {
        if (obj.kind == "basic") {
          obj.objects.forEach((drawobj) => {
            if (drawobj.kind == "complex" || drawobj.kind == "curveSegment" || drawobj.kind == "edge") {
              drawobj.parts.forEach((part) => {
                if (part.vertices2D && (part.drawType == "lines" || part.drawType == "curveSegment" || part.drawType == "filled")) {
                  for (let i = 1; i < part.vertices2D.length; ++i) {
                    if (vec3_exports.equals(part.vertices3D[i - 1], emptyVertex) || vec3_exports.equals(part.vertices3D[i], emptyVertex)) {
                      continue;
                    }
                    const lineB = { start: part.vertices2D[i - 1], end: part.vertices2D[i] };
                    const intersection = lineSeg2dIntersection(line, lineB);
                    if (intersection) {
                      const dir = vec3_exports.sub(vec3_exports.create(), part.vertices3D[i], part.vertices3D[i - 1]);
                      intersections.push({ intersection, point3d: vec3_exports.scaleAndAdd(vec3_exports.create(), part.vertices3D[i - 1], dir, intersection.u) });
                    }
                  }
                }
              });
            }
          });
        }
      });
      if (intersections.length > 1) {
        intersections.sort((a, b) => a.intersection.t - b.intersection.t);
        const vertices3D = [vec3_exports.create()];
        const vertices2D = [line.start];
        const labels = [""];
        intersections.forEach((intersection) => {
          vertices2D.push(intersection.intersection.p);
        });
        vertices2D.push(line.end);
        for (let i = 0; i < intersections.length; ++i) {
          if (i != 0) {
            labels.push(vec3_exports.dist(intersections[i].point3d, intersections[i - 1].point3d).toFixed(3) + "m");
          }
          vertices3D.push(intersections[i].point3d);
        }
        vertices3D.push(vec3_exports.create());
        labels.push("");
        const parts2 = [];
        parts2.push({ drawType: "lines", vertices3D, vertices2D, text: [labels] });
        const drawObjects2 = [];
        drawObjects2.push({ kind: "complex", parts: parts2 });
        return { kind: "basic", objects: drawObjects2 };
      }
    }
    const parts = [];
    parts.push({ drawType: "lines", vertices3D: [], vertices2D: [line.start, line.end] });
    const drawObjects = [];
    drawObjects.push({ kind: "complex", parts });
    return { kind: "basic", objects: drawObjects };
  }

  // src/pathRender.ts
  function getPathMatrices(view) {
    const { camera } = view;
    const { width, height } = view.settings.display;
    const camMat = mat4_exports.fromRotationTranslation(
      mat4_exports.create(),
      camera.rotation,
      camera.position
    );
    mat4_exports.invert(camMat, camMat);
    if (view.camera.kind == "pinhole") {
      const projMat = mat4_exports.perspective(
        mat4_exports.create(),
        common_exports.toRadian(camera.fieldOfView),
        width / height,
        camera.near,
        camera.far
      );
      return { camMat, projMat };
    } else {
      const aspect = width / height;
      const halfHeight = camera.fieldOfView / 2;
      const halfWidth = halfHeight * aspect;
      const projMat = mat4_exports.ortho(
        mat4_exports.create(),
        -halfWidth,
        halfWidth,
        -halfHeight,
        halfHeight,
        camera.near,
        camera.far
      );
      return { camMat, projMat };
    }
  }
  function toScreen(projMat, width, height, p) {
    const _p = vec4_exports.transformMat4(
      vec4_exports.create(),
      vec4_exports.fromValues(p[0], p[1], p[2], 1),
      projMat
    );
    const pt = vec2_exports.fromValues(
      Math.round((_p[0] * 0.5 / _p[3] + 0.5) * width),
      Math.round((0.5 - _p[1] * 0.5 / _p[3]) * height)
    );
    return pt.every((num) => !Number.isNaN(num) && Number.isFinite(num)) ? pt : vec2_exports.fromValues(-100, -100);
  }
  function toPathPointsFromMatrices(points, camMat, projMat, near, width, height, ortho2) {
    const clip = (p, p0) => {
      const d = vec3_exports.sub(vec3_exports.create(), p0, p);
      vec3_exports.scale(d, d, (-near - p[2]) / d[2]);
      return vec3_exports.add(d, d, p);
    };
    const points2d = [];
    const removedIndices = [];
    const addedIndices = [];
    const sv = points.map((v) => vec3_exports.transformMat4(vec3_exports.create(), v, camMat));
    if (ortho2) {
      for (const p of sv) {
        if (p[2] > 0 && p[2] < 0.1) {
          p[2] = -1e-4;
        }
      }
    }
    const screenPoints = sv.reduce((tail, head, i) => {
      if (head[2] > SCREEN_SPACE_EPSILON) {
        if (i === 0 || sv[i - 1][2] > 0) {
          removedIndices.push(i);
          return tail;
        }
        const p0 = clip(sv[i - 1], head);
        const _p2 = toScreen(projMat, width, height, p0);
        points2d.push(_p2);
        return tail.concat([_p2]);
      }
      const _p = toScreen(projMat, width, height, head);
      points2d.push(_p);
      if (i !== 0 && sv[i - 1][2] > SCREEN_SPACE_EPSILON) {
        const p0 = clip(head, sv[i - 1]);
        const _p0 = toScreen(projMat, width, height, p0);
        addedIndices.push(i);
        return tail.concat([_p0], [_p]);
      }
      return tail.concat([_p]);
    }, []);
    if (screenPoints.length) {
      return { screenPoints, points2d, removedIndices, addedIndices };
    }
    return void 0;
  }
  function FillDrawInfo2D(view, drawObjects) {
    const { camera } = view;
    const { width, height } = view.settings.display;
    const { camMat, projMat } = getPathMatrices(view);
    for (const drawObject of drawObjects) {
      for (const drawPart of drawObject.parts) {
        const points = toPathPointsFromMatrices(
          drawPart.vertices3D,
          camMat,
          projMat,
          camera.near,
          width,
          height,
          camera.kind == "orthographic"
        );
        if (points) {
          const { screenPoints, removedIndices, addedIndices } = points;
          drawPart.vertices2D = screenPoints;
          if (removedIndices.length > 0 || addedIndices.length > 0) {
            if (drawPart.text && Array.isArray(drawPart.text)) {
              drawPart.text[0] = drawPart.text[0].reduce((tail, head, i) => {
                if (addedIndices.find((v) => v == i) != void 0 && removedIndices.find((v) => v == i - 1) == void 0) {
                  return tail.concat(["", head]);
                }
                if (removedIndices.find((v) => v == i) != void 0 && removedIndices.find((v) => v == i + 1) != void 0) {
                  return tail;
                } else {
                  return tail.concat(head);
                }
              }, []);
            }
            drawPart.vertices3D = drawPart.vertices3D.reduce((tail, head, i) => {
              if (addedIndices.find((v) => v == i) != void 0 && removedIndices.find((v) => v == i - 1) == void 0) {
                return tail.concat([vec3_exports.create(), head]);
              }
              if (removedIndices.find((v) => v == i) != void 0 && removedIndices.find((v) => v == i + 1) != void 0) {
                return tail;
              } else {
                return tail.concat(head);
              }
            }, []);
          }
        }
        if (drawPart.voids) {
          drawPart.voids.forEach((drawVoid, j) => {
            const voidPoints = toPathPointsFromMatrices(
              drawVoid.vertices3D,
              camMat,
              projMat,
              camera.near,
              width,
              height,
              camera.kind == "orthographic"
            );
            if (voidPoints) {
              const { screenPoints, removedIndices, addedIndices } = voidPoints;
              drawVoid.vertices2D = screenPoints;
              if ((removedIndices.length > 0 || addedIndices.length > 0) && drawPart.text && Array.isArray(drawPart.text)) {
                drawPart.text[j + 1] = drawPart.text[j + 1].reduce((tail, head, i) => {
                  if (addedIndices.find((v) => v == i) != void 0 && removedIndices.find((v) => v == i - 1) == void 0) {
                    return tail.concat(["", head]);
                  }
                  if (removedIndices.find((v) => v == i) != void 0 && removedIndices.find((v) => v == i + 1) != void 0) {
                    return tail;
                  } else {
                    return tail.concat(head);
                  }
                }, []);
              }
            }
          });
        }
      }
    }
  }
  async function renderMeasureEntity(view, scene, entity, setting) {
    if (entity) {
      let drawObjects = [];
      let kind = void 0;
      if (entity.drawKind == "manhole") {
        drawObjects = await scene.getManholeDrawObject(entity);
        kind = "manhole";
      } else if (entity.drawKind == "measureResult") {
        drawObjects = [getResultDrawObject(entity)];
        kind = "measureResult";
      } else {
        const drawObject = await scene.getEntitiyDrawObjects(entity, setting);
        if (drawObject) {
          drawObjects = [drawObject];
        }
        kind = "basic";
      }
      if (drawObjects) {
        FillDrawInfo2D(view, drawObjects);
      }
      return {
        kind,
        objects: drawObjects
      };
    }
    return void 0;
  }

  // src/measureApi.ts
  var import_meta = {};
  var currentScriptUrl = document.currentScript?.src ?? import_meta.url;
  var MeasureAPI = class {
    scriptUrl;
    workers;
    constructor(scriptBaseUrl) {
      const url = new URL(scriptBaseUrl ?? currentScriptUrl);
      this.scriptUrl = new URL("./", url).href.slice(0, -1);
    }
    createWorkers() {
      const createWorker = (url, name) => {
        if (this.scriptUrl.startsWith(self.location.origin)) {
          return new Worker(url, { type: "classic", name });
        } else {
          const scriptBlob = new Blob(
            [`importScripts(${JSON.stringify(url)});`],
            { type: "text/javascript" }
          );
          const blobUrl = URL.createObjectURL(scriptBlob);
          const worker = new Worker(blobUrl, { type: "classic", name });
          URL.revokeObjectURL(blobUrl);
          return worker;
        }
      };
      const measureWorker = createWorker(
        `${this.scriptUrl}/worker.js`,
        "Measure"
      );
      const measureService = wrap(measureWorker);
      this.workers = {
        measure: {
          worker: measureWorker,
          service: measureService
        }
      };
      measureService.initialize(this.scriptUrl);
    }
    loadScene(url) {
      if (!this.workers) {
        this.createWorkers();
      }
      if (typeof url === "string") {
        url = new URL(url.toString());
      }
      return new MeasureScene(url, this.workers.measure.service);
    }
    async dispose() {
      const { workers } = this;
      if (workers) {
        const { measure } = workers;
        await measure.service.terminate();
        measure.service[releaseProxy]();
        this.workers = void 0;
      }
    }
    toPathPoints(points, view) {
      const { camera } = view;
      const { camMat, projMat } = getPathMatrices(view);
      const { width, height } = view.settings.display;
      return toPathPointsFromMatrices(
        points,
        camMat,
        projMat,
        camera.near,
        width,
        height,
        camera.kind == "orthographic"
      );
    }
    toMarkerPoints(view, points) {
      const { camera } = view;
      const { camMat, projMat } = getPathMatrices(view);
      const { width, height } = view.settings.display;
      return points.map((p) => vec3_exports.transformMat4(vec3_exports.create(), p, camMat)).map((p, i, arr) => {
        if (camera.kind === "orthographic") {
          if (p[2] > 0 && p[2] < 0.1) {
            p[2] = -1e-4;
          }
        }
        if (p[2] > SCREEN_SPACE_EPSILON) {
          return void 0;
        }
        return toScreen(projMat, width, height, p);
      });
    }
    async getDrawMeasureEntity(view, scene, entity, setting) {
      return renderMeasureEntity(view, scene, entity, setting);
    }
    getDrawObjectFromPoints(view, points, closed = true, angles = true, generateLineLabels = false) {
      return getDrawObjectFromPointArray(view, points, closed, angles, generateLineLabels);
    }
    getDrawText(view, points, text) {
      return getDrawTextObject(view, points, text);
    }
    traceDrawObjects(objects, line) {
      return getTraceDrawOject(objects, line);
    }
    get2dNormal(object, line) {
      return get2dNormal(object, line);
    }
  };

  // src/measureEntity.ts
  function equalMeasureEntityIndex(a, b) {
    if (!a && b || a && !b) {
      return false;
    }
    if (a && b) {
      return a.pathIndex == b.pathIndex && a.pathKind == b.pathKind;
    }
    return true;
  }
  function equalMeasureEntity(a, b) {
    if (!a && b || a && !b) {
      return false;
    }
    if (a && b) {
      return a.ObjectId == b.ObjectId && a.pathIndex == b.pathIndex && a.pathKind == b.pathKind;
    }
    return true;
  }

  // src/measureObject.ts
  common_exports.setMatrixArrayType(Array);
  function getDir(viewWorldMatrix) {
    const dir = vec4_exports.fromValues(0, 0, 1, 0);
    vec4_exports.transformMat4(dir, dir, viewWorldMatrix);
    return vec3_exports.fromValues(dir[0], dir[1], dir[2]);
  }
  var MeasureObject = class {
    constructor(id, getPaths, getEntitiyDrawObjects, swapCylinderInternal, selectedEntity) {
      this.id = id;
      this.getPaths = getPaths;
      this.getEntitiyDrawObjects = getEntitiyDrawObjects;
      this.swapCylinderInternal = swapCylinderInternal;
      this.selected = selectedEntity;
    }
    _renderOutput;
    facePaths = [];
    edgePaths = [];
    currentDir = vec3_exports.create();
    viewDirMatrix = mat4_exports.create();
    selected;
    highlighted;
    dirty = true;
    get selectedEntity() {
      if (this.selected) {
        return this.createMeasureEntity(this.selected);
      }
    }
    get productId() {
      return this.id;
    }
    async swapCylinder(to) {
      const entity = this.selectedEntity;
      if (entity) {
        const faceIdx = await this.swapCylinderInternal(
          this.createMeasureEntity(entity),
          to
        );
        if (faceIdx != void 0) {
          this.selected.pathIndex = faceIdx;
        }
      }
      return false;
    }
    createMeasureEntity(index) {
      const kind = index.pathKind;
      return { ...index, ObjectId: this.id, kind };
    }
    set renderOutput(value) {
      const renderOutput = value;
      if (renderOutput != this._renderOutput) {
        this._renderOutput = renderOutput;
        if (value) {
          const newDir = getDir(value.viewWorldMatrix);
          if (vec3_exports.dot(newDir, this.currentDir) < 0.99999999) {
            this.currentDir = newDir;
            mat4_exports.lookAt(
              this.viewDirMatrix,
              newDir,
              vec3_exports.create(),
              vec3_exports.fromValues(0, 1, 0)
            );
            this.getPaths(this.viewDirMatrix).then((p) => {
              this.facePaths = p.filter((e) => e.kind == "face");
              this.edgePaths = p.filter((e) => e.kind == "edge");
            });
          }
        } else {
          this.facePaths = [];
          this.edgePaths = [];
        }
      }
    }
    contextTransform(context, width, height, renderOutput) {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const scale5 = renderOutput.viewClipMatrix[5] * halfHeight;
      var translateX = (1 + renderOutput.worldClipMatrix[12]) * halfWidth;
      var translateY = (1 - renderOutput.worldClipMatrix[13]) * halfHeight;
      const mat = new DOMMatrix([scale5, 0, 0, -scale5, translateX, translateY]);
      context.setTransform(mat);
      context.lineWidth = 2 / scale5;
    }
    renderPoints(context, width, height, points) {
      if (this._renderOutput) {
        const renderOutput = this._renderOutput;
        this.contextTransform(context, width, height, renderOutput);
        const scale5 = renderOutput.viewClipMatrix[5] * height / 2;
        const { viewDirMatrix } = this;
        const rad = 5 / scale5;
        context.fillStyle = "red";
        for (const point of points) {
          const p = vec3_exports.transformMat4(vec3_exports.create(), point, viewDirMatrix);
          const [x, y] = p;
          context.beginPath();
          context.ellipse(x, y, rad, rad, 0, 0, 2 * Math.PI);
          context.fill();
        }
        context.resetTransform();
      }
    }
    renderPaths(context, width, height) {
      const { facePaths, edgePaths } = this;
      const { pathIndex: highlightedIndex, pathKind: highlightedKind } = this.highlighted ?? {};
      const { pathIndex: selectedIndex, pathKind: selectedKind } = this.selected ?? {};
      if (this._renderOutput) {
        this.contextTransform(context, width, height, this._renderOutput);
        for (const pathInfo of facePaths) {
          const { path, originalIndex } = pathInfo;
          if (highlightedKind == "face" && originalIndex === highlightedIndex) {
            context.fillStyle = "yellow";
          } else if (selectedKind == "face" && originalIndex === selectedIndex) {
            context.fillStyle = "green";
          } else {
            context.fillStyle = "darkgray";
          }
          context.fill(path);
          context.strokeStyle = "white";
          context.stroke(path);
        }
        for (const pathInfo of edgePaths) {
          const { path, originalIndex } = pathInfo;
          if (highlightedKind == "edge" && originalIndex === highlightedIndex) {
            context.strokeStyle = "yellow";
          } else if (selectedKind == "edge" && originalIndex === selectedIndex) {
            context.strokeStyle = "green";
          } else {
            context.strokeStyle = "black";
          }
          context.stroke(path);
        }
        context.resetTransform();
      }
      this.dirty = false;
    }
    hover(context, x, y, width, height) {
      const idx = this.pickPath(context, x, y, width, height);
      if (equalMeasureEntityIndex(this.highlighted, idx)) {
        return false;
      }
      this.highlighted = idx;
      this.dirty = true;
      return true;
    }
    select() {
      if (equalMeasureEntityIndex(this.highlighted, this.selected) || !this.highlighted) {
        return false;
      }
      this.selected = this.highlighted;
      this.dirty = true;
      return true;
    }
    pickPath(context, x, y, width, height) {
      if (this._renderOutput) {
        this.contextTransform(context, width, height, this._renderOutput);
        const { facePaths, edgePaths } = this;
        for (let i = edgePaths.length - 1; i >= 0; --i) {
          const pathInfo = edgePaths[i];
          const { path } = pathInfo;
          if (context.isPointInStroke(path, x, y)) {
            return {
              pathKind: "edge",
              pathIndex: pathInfo.originalIndex,
              instanceIndex: pathInfo.instanceIndex,
              parameter: 0
            };
          }
        }
        for (let i = facePaths.length - 1; i >= 0; --i) {
          const pathInfo = facePaths[i];
          const { path } = pathInfo;
          if (context.isPointInPath(path, x, y)) {
            return {
              pathKind: "face",
              pathIndex: pathInfo.originalIndex,
              instanceIndex: pathInfo.instanceIndex,
              parameter: 0
            };
          }
        }
      }
      context.resetTransform();
    }
  };

  // src/index.ts
  var cylinderOptions = [
    "center",
    "closest",
    "furthest",
    "top",
    "bottom"
  ];
  function createMeasureAPI(scriptBaseUrl) {
    return new MeasureAPI(scriptBaseUrl);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=main_iife.js.map
