// middleware/validationMiddleware.js

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  
  if (!result.success) {
    const errors = result.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  
  // Assign parsed/sanitized data back to req.body (automatically strips extra/unwanted properties)
  req.body = result.data;
  next();
};

module.exports = validate;
