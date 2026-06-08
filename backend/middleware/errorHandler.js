export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ error: 'Duplicate entry' });
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
