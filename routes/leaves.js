// routes/leaves.js
const express = require('express');
const router = express.Router();
const { LeaveRequest } = require('../models');
const authenticateToken = require('../middleware/auth');

// ثبت درخواست مرخصی جدید
router.post('/leaves', authenticateToken, async (req, res) => {
    try {
        const { type, startDate, endDate, hours, reason } = req.body;
        
        const leaveRequest = await LeaveRequest.create({
            userId: req.user.userId,
            type,
            startDate,
            endDate,
            hours,
            reason,
            status: 'PENDING'
        });

        res.json({ 
            success: true, 
            message: 'درخواست مرخصی با موفقیت ثبت شد',
            data: leaveRequest 
        });
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطا در ثبت درخواست مرخصی' 
        });
    }
});

// دریافت لیست مرخصی‌های کاربر
router.get('/leaves', authenticateToken, async (req, res) => {
    try {
        const leaves = await LeaveRequest.findAll({
            where: { userId: req.user.userId },
            order: [['createdAt', 'DESC']]
        });
        
        res.json({ 
            success: true, 
            data: leaves 
        });
    } catch (error) {
        console.error('Error fetching leaves:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطا در دریافت لیست مرخصی‌ها' 
        });
    }
});

// دریافت اطلاعات یک مرخصی خاص
router.get('/leaves/:id', authenticateToken, async (req, res) => {
    try {
        const leave = await LeaveRequest.findOne({
            where: { 
                id: req.params.id,
                userId: req.user.userId 
            }
        });
        
        if (!leave) {
            return res.status(404).json({ 
                success: false, 
                error: 'درخواست مرخصی یافت نشد' 
            });
        }
        
        res.json({ 
            success: true, 
            data: leave 
        });
    } catch (error) {
        console.error('Error fetching leave:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطا در دریافت اطلاعات مرخصی' 
        });
    }
});

module.exports = router;