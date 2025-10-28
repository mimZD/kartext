const express = require('express');
const { Log } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await Log.findAll({
      where: { userId: req.user.userId },
      order: [['enterTime', 'DESC']]
    });
    
    // تبدیل به فرمت اندروید
    const androidLogs = logs.map(log => ({
      id: log.id.toString(),
      enter_time: log.enterTime,
      exit_time: log.exitTime,
      deductions: log.deductions
    }));
    
    res.json(androidLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/logs
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const { enter_time, exit_time, deductions } = req.body;

    if (!enter_time) {
      return res.status(400).json({
        error: 'enter_time is required'
      });
    }

    const log = await Log.create({
      enterTime: enter_time,
      exitTime: exit_time || null,
      deductions: deductions || 0,
      userId: req.user.userId
    });
    
    // پاسخ به فرمت اندروید
    res.json({
      id: log.id.toString(),
      enter_time: log.enterTime,
      exit_time: log.exitTime,
      deductions: log.deductions
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// PUT /api/logs/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { enter_time, exit_time, deductions } = req.body;
    
    const log = await Log.findOne({
      where: { id, userId: req.user.userId }
    });
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    await log.update({
      enterTime: enter_time || log.enterTime,
      exitTime: exit_time !== undefined ? exit_time : log.exitTime,
      deductions: deductions !== undefined ? deductions : log.deductions
    });
    
    // پاسخ به فرمت اندروید
    res.json({
      id: log.id.toString(),
      enter_time: log.enterTime,
      exit_time: log.exitTime,
      deductions: log.deductions
    });
  } catch (error) {
    console.error('Error updating log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/logs/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await Log.findOne({
      where: { id, userId: req.user.userId }
    });
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    await log.destroy();
    res.status(200).send();
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
