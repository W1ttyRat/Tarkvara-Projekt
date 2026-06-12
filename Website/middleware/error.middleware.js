function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const isNotFound = statusCode === 404;

    if (req.accepts('html')) {
        return res.status(statusCode).render('errors/error', {
            title: isNotFound ? 'Page not found' : 'Server error',
            pageClass: 'error-page',
            message: process.env.NODE_ENV === 'development'
                ? err.message
                : isNotFound
                    ? 'Page not found'
                    : 'Something went wrong'
        });
    }

    return res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : isNotFound
                ? 'Not found'
                : 'Internal Server Error'
    });
}

module.exports = errorHandler;