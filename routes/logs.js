// routes/logs.js
const express = require('express');
const router = express.Router();
const { TimeLog, User } = require('../models');

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        console.log('📋 FETCHING LOGS...');
        
        const logs = await TimeLog.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'id']
            }],
            order: [['enterTime', 'DESC']]
        });
        
        console.log(`✅ Found ${logs.length} logs`);
        
        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('❌ Error fetching logs:', error);
        res.status(500).json({
            success: false,
            error: 'خطا در دریافت لاگ‌ها'
        });
    }
});

// POST /api/logs
router.post('/', async (req, res) => {
    try {
        console.log('➕ CREATING LOG:', req.body);
        
        const { enter_time, deductions, id } = req.body;
        
        const log = await TimeLog.create({
            userId: 1,
            enterTime: new Date(parseInt(enter_time)),
            deductions: deductions || 0
        });

        res.json({
            success: true,
            message: 'لاگ با موفقیت ثبت شد',
            data: log
        });
    } catch (error) {
        console.error('❌ Error creating log:', error);
        res.status(500).json({
            success: false,
            error: 'خطا در ثبت لاگ'
        });
    }
});

module.exports = router;