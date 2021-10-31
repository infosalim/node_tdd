const express = require('express');
// const bcrypt = require('bcryptjs');
const router = express.Router();
const { check, validationResult } = require('express-validator');
// const User = require('./User');
const UserService = require('./UserService');

router.post('/api/1.0/users',
check('username').notEmpty().withMessage('Username cannot be null'),
check('email').notEmpty().withMessage('Email cannot be null'), 
check('password').notEmpty().withMessage('Password cannot be null'), 
async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    const validationErrors = {};
    errors.array().forEach(error => (validationErrors[error.param] = error.msg));
    return res.status(400).send({validationErrors: validationErrors});
  }

  await UserService.save(req.body);
  return res.status(200).send({ message: 'User created' });
});

module.exports = router;
