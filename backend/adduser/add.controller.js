const { 
  createUser,
  getUserGroups,
  getUsers,  // Changed from getContacts
  getCompanies
} = require('./add.service'); // Updated to import from add.service.js

// Create user
const createUserController = async (req, res) => {
  try {
    const result = await createUser(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message });
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

// Get existing users (changed from getContacts)
const getUsersController = async (req, res) => {
  try {
    const users = await getUsers();  // Changed from getContacts
    console.log('Controller sending users:', users); // Debug log
    res.json({ users });  // Changed from { contacts }
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
  getUsers: getUsersController,  // Changed from getContacts
  getCompanies: getCompaniesController
};