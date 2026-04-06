const router = require('express').Router();
const { authenticationMiddleware, subscriptionAuthMiddleware } = require('../middlewares/authentication');
const mondayController = require('../controllers/monday-controller');

router.post('/monday/update', authenticationMiddleware, mondayController.updateConnectedItems);
router.post('/monday/connect', authenticationMiddleware, mondayController.connectItems);
router.post('/monday/newconnect', authenticationMiddleware, mondayController.newConnectItems);
router.post('/monday/columnupdate', authenticationMiddleware, mondayController.updateColumn);
router.post('/monday/connecttrigger/subscribe', subscriptionAuthMiddleware, mondayController.customSubscribe);
router.post('/monday/connecttrigger/unsubscribe', subscriptionAuthMiddleware, mondayController.customUnsubscribe);
router.post('/monday/connectwebhookaction', mondayController.connectWebhookAction);
router.post('/monday/subitemupdate/subscribe', authenticationMiddleware, mondayController.subItemUpdateSubscribe);
router.post('/monday/subitemupdate/unsubscribe', authenticationMiddleware, mondayController.subItemUpdateUnsubscribe);
router.post('/monday/connectedcolupdate', authenticationMiddleware, mondayController.updateConnectedColumn);
router.post('/monday/getrelationoptions', authenticationMiddleware, mondayController.getRelationOptions);
// router.post('/monday/webhook/connectchange', mondayController.connectChangeWebhook);
// router.post('/webhook/connectchange', mondayController.connectChangeWebhook);

module.exports = router;
