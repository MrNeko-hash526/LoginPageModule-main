const { 
  createUser,
  getUserGroups,
  getContacts,
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

// Get contacts
const getContactsController = async (req, res) => {
  try {
    const contacts = await getContacts();
    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
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
  getContacts: getContactsController,
  getCompanies: getCompaniesController
};