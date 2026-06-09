/* const requireRole = (allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).render('errors/403', {
            title: 'Forbidden',
            pageClass: 'error-page'
        });
    }

    next();
};

module.exports = {
    requireRole
}; */