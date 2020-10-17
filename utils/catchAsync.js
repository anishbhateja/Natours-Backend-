//catches error from async function, sends over the error to global middleware error handler
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      next(err); //catches error from async function,
    });
  };
};
