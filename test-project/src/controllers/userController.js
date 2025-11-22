// User controller
class UserController {
  getUsers(req, res) {
    res.json({ users: [] });
  }

  createUser(req, res) {
    res.json({ message: 'User created' });
  }
}

module.exports = new UserController();
