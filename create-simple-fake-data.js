const { User, Log } = require('./models');

async function createSimpleFakeData() {
    try {
        console.log('📊 ایجاد داده‌های فیک ساده...');

        const users = await User.findAll();
        
        if (users.length === 0) {
            console.log('❌ کاربری وجود ندارد!');
            return;
        }

        const now = new Date();
        
        // ایجاد داده برای ۶۰ روز گذشته
        for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
            const date = new Date(now);
            date.setDate(now.getDate() - dayOffset);
            
            // فقط روزهای کاری (شنبه تا چهارشنبه)
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 4 || dayOfWeek === 5) continue; // پنجشنبه و جمعه
            
            for (const user of users) {
                // شانس ۸۰٪ برای داشتن لاگ در این روز
                if (Math.random() > 0.2) {
                    // ساعت ورود بین ۷:۳۰ تا ۹:۳۰
                    const enterHour = 7 + Math.floor(Math.random() * 3);
                    const enterMinute = 30 + Math.floor(Math.random() * 60);
                    
                    const enterTime = new Date(date);
                    enterTime.setHours(enterHour, enterMinute, 0, 0);
                    
                    // مدت کار بین ۴ تا ۹ ساعت
                    const workHours = 4 + Math.floor(Math.random() * 6);
                    const exitTime = new Date(enterTime);
                    exitTime.setHours(enterHour + workHours);
                    
                    // کسورات تصادفی بین ۰ تا ۴۵ دقیقه
                    const deductions = Math.floor(Math.random() * 46);
                    
                    await Log.create({
                        enterTime: enterTime.getTime(),
                        exitTime: exitTime.getTime(),
                        deductions: deductions,
                        userId: user.id
                    });
                }
            }
            
            if (dayOffset % 10 === 0) {
                console.log(`📅 ایجاد داده برای ${dayOffset} روز گذشته...`);
            }
        }

        console.log('\n✅ داده‌های فیک ساده ایجاد شدند!');
        console.log('📊 شامل ۶۰ روز گذشته (فقط روزهای کاری)');

    } catch (error) {
        console.error('❌ خطا:', error.message);
    }
}

createSimpleFakeData().then(() => {
    process.exit(0);
});
