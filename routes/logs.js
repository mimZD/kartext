const express = require('express');
const router = express.Router();
const { TimeLog, User } = require('../models');

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        console.log('📋 FETCHING LOGS...');
        
        const logs = await TimeLog.findAll({
            order: [['enterTime', 'DESC']]
        });
        
        const formattedLogs = logs.map(log => ({
            id: log.id,
            enter_time: new Date(log.enterTime).getTime(),
            exit_time: log.exitTime ? new Date(log.exitTime).getTime() : null,
            deductions: log.deductions,
            type: 'work'
        }));
        
        res.json(formattedLogs);
        
    } catch (error) {
        console.error('❌ Error fetching logs:', error);
        res.status(500).json({ error: 'خطا در دریافت لاگ‌ها' });
    }
});

// POST /api/logs
router.post('/', async (req, res) => {
    try {
        console.log('➕ CREATING LOG:', req.body);
        
        const { enter_time, deductions, type } = req.body;
        
        const log = await TimeLog.create({
            userId: 1,
            enterTime: new Date(parseInt(enter_time)),
            deductions: deductions || 0,
            type: type || 'work'
        });

        res.json({
            id: log.id.toString(),
            enter_time: parseInt(enter_time),
            exit_time: null,
            deductions: deductions || 0,
            type: type || 'work'
        });
        
    } catch (error) {
        console.error('❌ Error creating log:', error);
        res.status(500).json({ error: 'خطا در ثبت لاگ' });
    }
});

// PUT /api/logs/:id
router.put('/:id', async (req, res) => {
    try {
        console.log('✏️ UPDATING LOG:', req.params.id, req.body);
        
        const { id } = req.params;
        const { enter_time, exit_time, deductions, type } = req.body;
        
        const log = await TimeLog.findByPk(id);
        
        if (!log) {
            return res.status(404).json({ error: 'لاگ پیدا نشد' });
        }
        
        // آپدیت فیلدها
        if (enter_time !== undefined && enter_time !== 0) {
            log.enterTime = new Date(parseInt(enter_time));
        }
        if (exit_time !== undefined) {
            log.exitTime = new Date(parseInt(exit_time));
        }
        if (deductions !== undefined) {
            log.deductions = deductions;
        }
        if (type !== undefined) {
            log.type = type;
        }
        
        await log.save();
        
        res.json({
            success: true,
            message: 'رکورد با موفقیت به‌روزرسانی شد'
        });
        
    } catch (error) {
        console.error('❌ Error updating log:', error);
        res.status(500).json({ error: 'خطا در به‌روزرسانی لاگ' });
    }
});

// DELETE /api/logs/:id
router.delete('/:id', async (req, res) => {
    try {
        console.log('🗑️ DELETING LOG:', req.params.id);
        
        const { id } = req.params;
        const log = await TimeLog.findByPk(id);
        
        if (!log) {
            return res.status(404).json({ error: 'لاگ پیدا نشد' });
        }
        
        await log.destroy();
        
        res.json({
            success: true,
            message: 'رکورد حذف شد'
        });
        
    } catch (error) {
        console.error('❌ Error deleting log:', error);
        res.status(500).json({ error: 'خطا در حذف لاگ' });
    }
});

module.exports = router;