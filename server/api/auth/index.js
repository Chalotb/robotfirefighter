'use strict';

var express = require('express');
var controller = require('./auth.controller');

var router = express.Router();

/*router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.upsert);
router.patch('/:id', controller.patch);
router.delete('/:id', controller.destroy);*/

router.get('/',controller.status);
router.get('/play',controller.play);
module.exports = router;