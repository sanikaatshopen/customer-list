// ============================================
//  02_customers.js — Customer CRUD Routes
// ============================================
//  Handles creating, reading, updating, and deleting customers.
//  All routes require authentication (JWT token).
//  Each customer is linked to the user who created it.
//
//  Routes:
//    GET    /customers       — List all customers (created by you)
//    POST   /customers       — Add a new customer
//    PUT    /customers/:id   — Update your customer
//    DELETE /customers/:id   — Delete your customer
//
//  ⚠️  All routes require the Authorization header:
//       Authorization: Bearer <your_token>
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const { authMiddleware } = require('./01_auth');

const router = express.Router();

// ── Customer Model ─────────────────────────
//  Kept in this file for simplicity.
//  "createdBy" links each customer to the user who added them.

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    emails: [{
      type: { type: String, default: 'personal' },
      value: { type: String, trim: true }
    }],
    phones: [{
      type: { type: String, default: 'mobile' },
      value: { type: String, trim: true }
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

const Customer = mongoose.model('Customer', customerSchema);

// ── All routes below require authentication ──
router.use(authMiddleware);

// ──────────────────────────────────────────────
//  GET /customers
// ──────────────────────────────────────────────
//  Returns only the customers created by the logged-in user.
//  Results are sorted by newest first.
//
//  Postman:
//    Method : GET
//    URL    : http://localhost:3000/customers
//    Headers:
//      Authorization : Bearer <your_token>
//    Body   : none
//
//  Success Response (200):
//    [
//      {
//        "_id": "665abc...",
//        "name": "John Doe",
//        "email": "john@example.com",
//        "phone": "+91 9876543210",
//        "createdBy": "664def...",
//        "createdAt": "2026-05-24T10:30:00.000Z",
//        "updatedAt": "2026-05-24T10:30:00.000Z"
//      }
//    ]
//
//  Error Responses:
//    401 — "No token provided. Please login."
//    500 — "Failed to fetch customers."
// ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.userId }).sort({
      createdAt: -1,
    });
    const mappedCustomers = customers.map(c => {
      const doc = c.toObject();
      if (!doc.emails) doc.emails = [];
      if (!doc.phones) doc.phones = [];

      // Map existing single email/phone to the new arrays for backwards compatibility
      // Also map string arrays to object arrays if they were saved in the old format
      if (doc.emails && doc.emails.length > 0 && typeof doc.emails[0] === 'string') {
        doc.emails = doc.emails.map(e => ({ type: 'personal', value: e }));
      }
      if (doc.phones && doc.phones.length > 0 && typeof doc.phones[0] === 'string') {
        doc.phones = doc.phones.map(p => ({ type: 'mobile', value: p }));
      }
      
      if (doc.email && doc.emails.length === 0) doc.emails.push({ type: 'personal', value: doc.email });
      if (doc.phone && doc.phones.length === 0) doc.phones.push({ type: 'mobile', value: doc.phone });
      return doc;
    });
    
    res.json(mappedCustomers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers.' });
  }
});

// ──────────────────────────────────────────────
//  POST /customers
// ──────────────────────────────────────────────
//  Creates a new customer linked to the logged-in user.
//
//  Postman:
//    Method : POST
//    URL    : http://localhost:3000/customers
//    Headers:
//      Content-Type  : application/json
//      Authorization : Bearer <your_token>
//    Body   : (raw JSON)
//      {
//        "name": "John Doe",
//        "email": "john@example.com",
//        "phone": "+91 9876543210"
//      }
//
//  Note: Only "name" is required. "email" and "phone" are optional.
//
//  Success Response (201):
//      {
//        "_id": "665abc...",
//        "name": "John Doe",
//        "email": "john@example.com",
//        "phone": "+91 9876543210",
//        "createdBy": "664def...",
//        "createdAt": "...",
//        "updatedAt": "..."
//      }
//
//  Error Responses:
//    400 — "Customer name is required."
//    401 — "No token provided. Please login."
//    500 — "Failed to create customer."
// ──────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, emails, phones } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }

    if (phones && Array.isArray(phones)) {
      for (const p of phones) {
        if (p.value && !/^\d{10}$/.test(p.value.trim())) {
          return res.status(400).json({ message: 'Each phone number must be exactly 10 digits.' });
        }
      }
    }

    if (emails && Array.isArray(emails)) {
      for (const e of emails) {
        if (e.value && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.value.trim())) {
          return res.status(400).json({ message: 'Please enter valid email addresses.' });
        }
      }
    }

    const primaryEmail = emails && emails.length > 0 ? emails[0].value.trim() : '';
    const primaryPhone = phones && phones.length > 0 ? phones[0].value.trim() : '';

    if (primaryEmail) {
      const existingEmail = await Customer.findOne({ email: primaryEmail, createdBy: req.userId });
      if (existingEmail) {
        return res.status(400).json({ message: 'A customer with this email ID already exists.' });
      }
    }

    if (primaryPhone) {
      const existingPhone = await Customer.findOne({ phone: primaryPhone, createdBy: req.userId });
      if (existingPhone) {
        return res.status(400).json({ message: 'A customer with this phone number already exists.' });
      }
    }

    const customer = new Customer({
      name,
      email: primaryEmail,
      phone: primaryPhone,
      emails: emails || [],
      phones: phones || [],
      createdBy: req.userId,
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create customer.' });
  }
});

// ──────────────────────────────────────────────
//  PUT /customers/:id
// ──────────────────────────────────────────────
//  Updates a customer. Only the owner can update.
//  Ownership is verified in the query itself.
//
//  Postman:
//    Method : PUT
//    URL    : http://localhost:3000/customers/665abc123def456
//    Headers:
//      Content-Type  : application/json
//      Authorization : Bearer <your_token>
//    Body   : (raw JSON)
//      {
//        "name": "Jane Doe",
//        "email": "jane@example.com",
//        "phone": "+91 1234567890"
//      }
//
//  Success Response (200):
//      {
//        "_id": "665abc...",
//        "name": "Jane Doe",
//        "email": "jane@example.com",
//        "phone": "+91 1234567890",
//        "createdBy": "664def...",
//        "createdAt": "...",
//        "updatedAt": "..."
//      }
//
//  Error Responses:
//    401 — "No token provided. Please login."
//    404 — "Customer not found or not yours."
//    500 — "Failed to update customer."
// ──────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, emails, phones } = req.body;

    if (phones && Array.isArray(phones)) {
      for (const p of phones) {
        if (p.value && !/^\d{10}$/.test(p.value.trim())) {
          return res.status(400).json({ message: 'Each phone number must be exactly 10 digits.' });
        }
      }
    }

    if (emails && Array.isArray(emails)) {
      for (const e of emails) {
        if (e.value && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.value.trim())) {
          return res.status(400).json({ message: 'Please enter valid email addresses.' });
        }
      }
    }

    const primaryEmail = emails && emails.length > 0 ? emails[0].value.trim() : '';
    const primaryPhone = phones && phones.length > 0 ? phones[0].value.trim() : '';

    if (primaryEmail) {
      const existingEmail = await Customer.findOne({ email: primaryEmail, createdBy: req.userId, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'A customer with this email ID already exists.' });
      }
    }

    if (primaryPhone) {
      const existingPhone = await Customer.findOne({ phone: primaryPhone, createdBy: req.userId, _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({ message: 'A customer with this phone number already exists.' });
      }
    }

    // Find the customer AND check ownership in one query
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { name, email: primaryEmail, phone: primaryPhone, emails: emails || [], phones: phones || [] },
      { new: true } // Return the updated document
    );

    if (!customer) {
      return res
        .status(404)
        .json({ message: 'Customer not found or not yours.' });
    }

    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer.' });
  }
});

// ──────────────────────────────────────────────
//  POST /customers/bulk-delete
// ──────────────────────────────────────────────
//  Deletes multiple customers at once. Only the owner can delete them.
//
//  Postman:
//    Method : POST
//    URL    : http://localhost:3000/customers/bulk-delete
//    Headers:
//      Content-Type  : application/json
//      Authorization : Bearer <your_token>
//    Body   : (raw JSON)
//      {
//        "ids": ["665abc123def456", "665abc123def457"]
//      }
// ──────────────────────────────────────────────
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No customer IDs provided.' });
    }

    // Delete all matching IDs that belong to this user
    const result = await Customer.deleteMany({
      _id: { $in: ids },
      createdBy: req.userId,
    });

    res.json({
      message: `${result.deletedCount} customers deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete customers.' });
  }
});

// ──────────────────────────────────────────────
//  DELETE /customers/:id
// ──────────────────────────────────────────────
//  Deletes a customer. Only the owner can delete.
//  Ownership is verified in the query itself.
//
//  Postman:
//    Method : DELETE
//    URL    : http://localhost:3000/customers/665abc123def456
//    Headers:
//      Authorization : Bearer <your_token>
//    Body   : none
//
//  Success Response (200):
//      {
//        "message": "Customer deleted successfully."
//      }
//
//  Error Responses:
//    401 — "No token provided. Please login."
//    404 — "Customer not found or not yours."
//    500 — "Failed to delete customer."
// ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    // Find the customer AND check ownership in one query
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!customer) {
      return res
        .status(404)
        .json({ message: 'Customer not found or not yours.' });
    }

    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete customer.' });
  }
});

module.exports = router;
