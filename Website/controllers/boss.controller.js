// add boss service

const getBossPage = async (req, res, next) => {
    try {
        res.render('boss/boss', {
            title: 'Boss',
            pageClass: 'boss-page',
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getBossPage
};