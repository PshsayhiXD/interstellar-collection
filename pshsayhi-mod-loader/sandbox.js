self.onmessage = async e => {
  const { type, code, payload } = e.data;
  try {
    if (type === "init") {
      const exports = {};
      const module = { exports };
      const fn = new Function("module", "exports", code);
      fn(module, exports);
      self.mod = module.exports?.default || module.exports;
      if (typeof self.mod?.start !== "function")
        throw new Error("Mod must export start()");
    }
    if (type === "start") await self.mod?.start?.();
    if (type === "stop") await self.mod?.stop?.();
    if (type === "config") Object.assign(self.mod, payload);
  } catch (err) {
    postMessage({ type: "error", error: err.message });
  }
};