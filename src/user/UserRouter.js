const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('./User');
const UserService = require('./UserService');

router.post('/api/1.0/users', async (req, res) => {
  await UserService.save(req.body);
  //   const hash = await bcrypt.hash(req.body.password, 10);
  //   const user = { ...req.body, password: hash };
  //   await User.create(user);
  return res.status(200).send({ message: 'User created' });
});

module.exports = router;
