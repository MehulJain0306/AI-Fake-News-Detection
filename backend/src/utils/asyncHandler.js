/**
 * Wraps an async Express route/controller so any rejected promise or
 * thrown error is automatically forwarded to next(), instead of every
 * controller needing its own try/catch block.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
