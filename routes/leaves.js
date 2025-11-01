// routes/leaves.js
const express = require('express');
const router = express.Router();
const { LeaveRequest, User } = require('../models');

// POST /api/leaves
router.post('/leaves', async (req, res) => {
    try {
        console.log('📝 CREATING LEAVE REQUEST:', req.body);
        
        const { type, date, start_time, end_time } = req.body;

        // 🔽 تبدیل فیلدها به فرمت درست
        let startDate, endDate, hours = null;

        if (type === 'daily') {
            // برای مرخصی روزانه: از date استفاده کن
            startDate = new Date(parseInt(date));
            endDate = null; // یا اگر end_time دارید
            hours = null;
        } else if (type === 'hourly') {
            // برای مرخصی ساعتی: از start_time و end_time استفاده کن
            startDate = new Date(parseInt(start_time));
            endDate = new Date(parseInt(end_time));
            // محاسبه ساعت‌ها
            const durationMs = endDate - startDate;
            hours = durationMs / (1000 * 60 * 60); // به ساعت تبدیل کن
        }

        const leaveRequest = await LeaveRequest.create({
            userId: 1, // TODO: از توکن بگیر
            type,
            startDate: startDate, // این فیلد اجباریه
            endDate: endDate,
            hours: hours,
            reason: req.body.reason || null,
            status: 'PENDING'
        });

        console.log('✅ LEAVE REQUEST CREATED:', leaveRequest.id);

        res.json({
            success: true,
            message: 'درخواست مرخصی ثبت شد'
        });

    } catch (error) {
        console.error('❌ Error creating leave request:', error);
        res.status(500).json({
            success: false,
            error: 'خطا در ثبت درخواست مرخصی'
        });
    }
});

// GET /api/leaves
router.get('/leaves', async (req, res) => {
    try {
        console.log('📋 FETCHING LEAVES...');
        
        const leaves = await LeaveRequest.findAll({
            where: { userId: 1 }, // TODO: از توکن بگیر
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