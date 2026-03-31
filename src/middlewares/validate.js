const { ZodError } = require("zod");
const { HttpError } = require("../utils/httpError");

function validate(schema) {
  return (req, _res, next) => {
    try {
      // Debug: log incoming content type and body to help trace Zod validation issues
      try {
        console.debug("[validate] content-type:", req.headers["content-type"]);
        console.debug("[validate] body (type):", typeof req.body);
        console.debug("[validate] body (preview):", JSON.stringify(req.body).slice(0, 200));
      } catch (e) {
        // ignore logging errors
      }

      req.validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (err) {
      console.debug("[validate] zod error:", err instanceof Error ? err.message : err);
      if (err instanceof ZodError) {
        return next(
          new HttpError(
            400,
            err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")
          )
        );
      }
      next(err);
    }
  };
}

module.exports = { validate };

