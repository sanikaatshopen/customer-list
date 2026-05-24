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

// ── GET /customers ─────────────────────────
//  Returns only the customers created by the logged-in user.
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

// ── POST /customers ────────────────────────
//  Create a new customer.
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Customer name is required.' });
    }

    const customer = new Customer({
      name,
      email: email || '',
      phone: phone || '',
      createdBy: req.userId,
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create customer.' });
  }
});

// ── PUT /customers/:id ─────────────────────
//  Update a customer. Only the owner can update.
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Find the customer AND check ownership in one query
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { name, email, phone },
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

// ── DELETE /customers/:id ──────────────────
//  Delete a customer. Only the owner can delete.
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
