const { 
  createUser,
  getUserGroups,
  getUsers,
  getCompanies,
  getRoles
} = require('./add.service');

// Create user
const createUserController = async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get user groups
const getUserGroupsController = async (req, res) => {
  try {
    const userGroups = await getUserGroups();
    res.json({ userGroups });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get roles
const getRolesController = async (req, res) => {
  try {
    const roles = await getRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get existing users
const getUsersController = async (req, res) => {
  try {
    const users = await getUsers();
    console.log('Controller sending users:', users);
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users in controller:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get companies
const getCompaniesController = async (req, res) => {
  try {
    const companies = await getCompanies();
    res.json({ companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createUser: createUserController,
  getUserGroups: getUserGroupsController,
  getUsers: getUsersController,
  getCompanies: getCompaniesController,
  getRoles: getRolesController
};