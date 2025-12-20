import { Router } from 'express';
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from '../services/customers.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const roleName = typeof req.query.role === 'string' && req.query.role.trim() ? req.query.role.trim() : 'customer';
    const customers = await listCustomers(roleName);
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const customer = await createCustomer(req.body ?? {});
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const customer = await updateCustomer(req.params.id, req.body ?? {});
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const roleName = typeof req.query.role === 'string' && req.query.role.trim() ? req.query.role.trim() : 'customer';
    await deleteCustomer(req.params.id, roleName);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
