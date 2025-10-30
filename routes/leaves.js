// routes/leaves.js
const express = require('express');
const router = express.Router();
const { LeaveRequest, User } = require('../models');

// POST /api/leaves - ثبت درخواست مرخصی
router.post('/leaves', async (req, res) => {
    try {
        console.log('📝 CREATING LEAVE REQUEST:', req.body);
        
        const { type, startDate, endDate, hours, reason } = req.body;
        
        const leaveRequest = await LeaveRequest.create({
            userId: 1, // کاربر تست
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
        console.error('❌ Error creating leave request:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطا در ثبت درخواست مرخصی' 
        });
    }
});

// GET /api/leaves - دریافت لیست مرخصی‌های کاربر
router.get('/leaves', async (req, res) => {
    try {
        console.log('📋 FETCHING LEAVES...');
        
        const leaves = await LeaveRequest.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'id']
            }],
            where: { userId: 1 }, // کاربر تست
            order: [['createdAt', 'DESC']]
        });
        
        console.log(`✅ Found ${leaves.length} leave requests`);
        
        res.json({ 
            success: true, 
            data: leaves 
        });
    } catch (error) {
        console.error('❌ Error fetching leaves:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطا در دریافت لیست مرخصی‌ها' 
        });
    }
});

module.exports = router;