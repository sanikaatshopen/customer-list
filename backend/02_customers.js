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
    res.json(customers);
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
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }

    if (phone && !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (email) {
      const existingEmail = await Customer.findOne({ email: email.trim(), createdBy: req.userId });
      if (existingEmail) {
        return res.status(400).json({ message: 'A customer with this email ID already exists.' });
      }
    }

    if (phone) {
      const existingPhone = await Customer.findOne({ phone: phone.trim(), createdBy: req.userId });
      if (existingPhone) {
        return res.status(400).json({ message: 'A customer with this phone number already exists.' });
      }
    }

    const customer = new Customer({
      name,
      email: email ? email.trim() : '',
      phone: phone ? phone.trim() : '',
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
    const { name, email, phone } = req.body;

    if (phone && !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits.' });
    }

    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (email) {
      const existingEmail = await Customer.findOne({ email: email.trim(), createdBy: req.userId, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'A customer with this email ID already exists.' });
      }
    }

    if (phone) {
      const existingPhone = await Customer.findOne({ phone: phone.trim(), createdBy: req.userId, _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({ message: 'A customer with this phone number already exists.' });
      }
    }

    // Find the customer AND check ownership in one query
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { name, email: email ? email.trim() : '', phone: phone ? phone.trim() : '' },
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
