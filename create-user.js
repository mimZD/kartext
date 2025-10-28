const express = require('express');
const bcrypt = require('bcrypt');
const { User, Log } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Simple admin credentials (plain text for now)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Auth middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    } else {
        return res.redirect('/admin/login');
    }
};

// Login page
router.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ورود به پنل مدیریت</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .login-card {
                    background: white;
                    border-radius: 15px;
                    padding: 40px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
                    width: 100%;
                    max-width: 400px;
                }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h2 class="text-center mb-4">ورود به پنل مدیریت</h2>
                <form action="/admin/login" method="POST">
                    <div class="mb-3">
                        <label for="username" class="form-label">نام کاربری ادمین</label>
                        <input type="text" class="form-control" id="username" name="username" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">رمز عبور ادمین</label>
                        <input type="password" class="form-control" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">ورود به پنل</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

router.post('/login', async (req, res) => {
    try {
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Raw body:', JSON.stringify(req.body));
        
        const { username, password } = req.body;
        
        // Trim and clean the inputs
        const cleanUsername = (username || '').trim();
        const cleanPassword = (password || '').trim();
        
        console.log('Cleaned - Username:', `"${cleanUsername}"`, 'Password:', `"${cleanPassword}"`);
        console.log('Expected - Username:', `"${ADMIN_CREDENTIALS.username}"`, 'Password:', `"${ADMIN_CREDENTIALS.password}"`);
        
        // Debug comparison
        console.log('Username match:', cleanUsername === ADMIN_CREDENTIALS.username);
        console.log('Password match:', cleanPassword === ADMIN_CREDENTIALS.password);
        
        // Check credentials with exact comparison
        if (cleanUsername !== ADMIN_CREDENTIALS.username || cleanPassword !== ADMIN_CREDENTIALS.password) {
            console.log('LOGIN FAILED - Credentials do not match');
            return res.send(`
                <script>
                    alert('نام کاربری یا رمز عبور اشتباه است');
                    window.location.href = '/admin/login';
                </script>
            `);
        }

        console.log('LOGIN SUCCESS - Setting session');
        // Set session
        req.session.isAdmin = true;
        req.session.username = 'admin';

        res.redirect('/admin');
        
    } catch (error) {
        console.log('LOGIN ERROR:', error);
        res.send(`
            <script>
                alert('خطا در ورود به سیستم');
                window.location.href = '/admin/login';
            </script>
        `);
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        res.redirect('/admin/login');
    });
});

// Protect all routes
router.use(requireAuth);

// تابع محاسبه مدت کار مفید (بر حسب دقیقه)
function calculateWorkMinutes(enterTime, exitTime, deductions) {
    if (!exitTime) return 0;
    
    const workMs = exitTime - enterTime;
    const workMinutes = Math.floor(workMs / (1000 * 60));
    
    // تبدیل کسورات از میلی‌ثانیه به دقیقه
    const deductionsMinutes = Math.floor(deductions / (1000 * 60));
    
    // کسر کردن کسورات از زمان کل
    const netMinutes = workMinutes - deductionsMinutes;
    
    return netMinutes > 0 ? netMinutes : 0;
}

// تابع فرمت کردن زمان به ساعت و دقیقه
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
        return hours + " ساعت و " + mins + " دقیقه";
    } else {
        return mins + " دقیقه";
    }
}

// تابع تبدیل میلی‌ثانیه به دقیقه برای نمایش
function msToMinutes(ms) {
    return Math.floor(ms / (1000 * 60));
}

// صفحه اصلی ادمین - گزارش ماهانه
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({ order: [['id', 'DESC']] });
        
        let usersHTML = '';
        for (let user of users) {
            // محاسبه آمار ماه جاری
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date();
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(0);
            endOfMonth.setHours(23, 59, 59, 999);

            const monthlyLogs = await Log.findAll({
                where: { 
                    userId: user.id,
                    enterTime: {
                        [Op.between]: [startOfMonth.getTime(), endOfMonth.getTime()]
                    }
                }
            });
            
            let monthlyWorkMinutes = 0;
            let monthlyDeductions = 0;
            
            monthlyLogs.forEach(log => {
                monthlyDeductions += Number(log.deductions);
                monthlyWorkMinutes += calculateWorkMinutes(
                    Number(log.enterTime), 
                    Number(log.exitTime), 
                    Number(log.deductions)
                );
            });

            usersHTML += `
                <tr>
                    <td>${user.id}</td>
                    <td>
                        <strong>${user.username}</strong>
                    </td>
                    <td>${formatTime(monthlyWorkMinutes)}</td>
                    <td>${msToMinutes(monthlyDeductions)} دقیقه</td>
                    <td>${monthlyLogs.length} روز</td>
                    <td>
                        <a href="/admin/user/${user.id}/month" class="btn btn-info btn-sm">
                            گزارش ماهانه
                        </a>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id}, '${user.username}')">
                            حذف
                        </button>
                    </td>
                </tr>
            `;
        }

        const currentMonth = new Date().toLocaleDateString('fa-IR', { 
            year: 'numeric', 
            month: 'long' 
        });

        res.send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>پنل مدیریت کارتکس</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { background: #f8f9fa; padding: 20px; }
                    .header { background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 30px; border-radius: 15px; margin-bottom: 20px; }
                    .card { background: white; border-radius: 15px; border: none; box-shadow: 0 5px 15px rgba(0,0,0,0.08); margin-bottom: 20px; }
                    .user-info { background: #e9ecef; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header text-center">
                        <h1>گزارش ماهانه کارتکس</h1>
                        <p>ماه: ${currentMonth}</p>
                        <div class="user-info">
                            <span>کاربر ادمین: ${req.session.username}</span>
                            <form action="/admin/logout" method="POST" style="display: inline; margin-right: 15px;">
                                <button type="submit" class="btn btn-outline-light btn-sm">خروج از پنل</button>
                            </form>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5>ایجاد کاربر جدید</h5>
                            <form action="/admin/create-user" method="POST" class="row g-3">
                                <div class="col-md-4">
                                    <input type="text" name="username" class="form-control" placeholder="نام کاربری" required>
                                </div>
                                <div class="col-md-4">
                                    <input type="password" name="password" class="form-control" placeholder="رمز عبور" required>
                                </div>
                                <div class="col-md-4">
                                    <button type="submit" class="btn btn-primary w-100">ایجاد کاربر</button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5>گزارش ماهانه کاربران</h5>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>نام کاربری</th>
                                            <th>زمان مفید ماه</th>
                                            <th>کسورات ماه</th>
                                            <th>روزهای کاری</th>
                                            <th>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${usersHTML}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <script>
                    function deleteUser(userId, username) {
                        if (confirm('آیا از حذف کاربر "' + username + '" مطمئنید؟')) {
                            fetch('/admin/delete-user/' + userId, { 
                                method: 'DELETE' 
                            })
                            .then(response => {
                                if (response.ok) {
                                    alert('کاربر با موفقیت حذف شد');
                                    location.reload();
                                } else {
                                    alert('خطا در حذف کاربر');
                                }
                            })
                            .catch(error => {
                                alert('خطا در ارتباط با سرور');
                            });
                        }
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('خطا در بارگذاری اطلاعات: ' + error.message);
    }
});

// صفحه گزارش ماهانه کاربر
router.get('/user/:id/month', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).send('کاربر یافت نشد');
        }

        // پارامترهای ماه
        const year = req.query.year || new Date().getFullYear();
        const month = req.query.month || new Date().getMonth() + 1;
        
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        // گروه‌بندی لاگ‌ها بر اساس روز
        const logs = await Log.findAll({
            where: { 
                userId: userId,
                enterTime: {
                    [Op.between]: [startOfMonth.getTime(), endOfMonth.getTime()]
                }
            },
            order: [['enterTime', 'DESC']]
        });

        // گروه‌بندی بر اساس روز
        const dailyStats = {};
        logs.forEach(log => {
            const enterDate = new Date(Number(log.enterTime));
            const dateKey = enterDate.toLocaleDateString('fa-IR');
            const dayKey = enterDate.getDate();
            
            if (!dailyStats[dayKey]) {
                dailyStats[dayKey] = {
                    date: enterDate,
                    dateString: dateKey,
                    logs: [],
                    totalWorkMinutes: 0,
                    totalDeductions: 0,
                    completedLogs: 0
                };
            }
            
            const workMinutes = calculateWorkMinutes(
                Number(log.enterTime), 
                Number(log.exitTime), 
                Number(log.deductions)
            );
            
            dailyStats[dayKey].logs.push(log);
            dailyStats[dayKey].totalWorkMinutes += workMinutes;
            dailyStats[dayKey].totalDeductions += Number(log.deductions);
            if (log.exitTime) dailyStats[dayKey].completedLogs++;
        });

        // تبدیل به آرایه و مرتب‌سازی
        const dailyArray = Object.values(dailyStats).sort((a, b) => b.date - a.date);

        let daysHTML = '';
        dailyArray.forEach(day => {
            daysHTML += `
                <tr>
                    <td>${day.dateString}</td>
                    <td>${day.logs.length}</td>
                    <td>${formatTime(day.totalWorkMinutes)}</td>
                    <td>${msToMinutes(day.totalDeductions)} دقیقه</td>
                    <td>${day.completedLogs}</td>
                    <td>
                        <a href="/admin/user/${userId}/day/${day.date.getFullYear()}/${day.date.getMonth() + 1}/${day.date.getDate()}" 
                           class="btn btn-info btn-sm">
                            مشاهده جزییات
                        </a>
                    </td>
                </tr>
            `;
        });

        const monthName = startOfMonth.toLocaleDateString('fa-IR', { 
            year: 'numeric', 
            month: 'long' 
        });

        res.send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>گزارش ماهانه - ${user.username}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { background: #f8f9fa; padding: 20px; }
                    .user-header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                    .card { background: white; border-radius: 15px; border: none; box-shadow: 0 5px 15px rgba(0,0,0,0.08); margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="user-header">
                        <h2>گزارش ماهانه: ${user.username}</h2>
                        <p class="mb-0">ماه: ${monthName}</p>
                        <a href="/admin" class="btn btn-light mt-2">بازگشت به صفحه اصلی</a>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5>گزارش روزهای ماه</h5>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>تاریخ</th>
                                            <th>تعداد لاگ</th>
                                            <th>زمان مفید</th>
                                            <th>کسورات</th>
                                            <th>ورود/خروج کامل</th>
                                            <th>جزییات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${daysHTML}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('خطا در بارگذاری گزارش ماهانه: ' + error.message);
    }
});

// صفحه گزارش روزانه کاربر
router.get('/user/:id/day/:year/:month/:day', async (req, res) => {
    try {
        const userId = req.params.id;
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);
        const day = parseInt(req.params.day);
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send('کاربر یافت نشد');
        }

        const startOfDay = new Date(year, month - 1, day);
        const endOfDay = new Date(year, month - 1, day);
        endOfDay.setHours(23, 59, 59, 999);

        // گرفتن لاگ‌های روز
        const logs = await Log.findAll({
            where: { 
                userId: userId,
                enterTime: {
                    [Op.between]: [startOfDay.getTime(), endOfDay.getTime()]
                }
            },
            order: [['enterTime', 'DESC']]
        });

        let logsHTML = '';
        let dayWorkMinutes = 0;
        let dayDeductions = 0;

        logs.forEach(log => {
            const enterTime = Number(log.enterTime);
            const exitTime = log.exitTime ? Number(log.exitTime) : null;
            const deductions = Number(log.deductions);
            const workMinutes = calculateWorkMinutes(enterTime, exitTime, deductions);
            
            dayWorkMinutes += workMinutes;
            dayDeductions += deductions;

            const enterDate = new Date(enterTime);
            const exitDate = exitTime ? new Date(exitTime) : null;
            const grossMinutes = exitTime ? Math.floor((exitTime - enterTime) / (1000 * 60)) : 0;
            const efficiency = grossMinutes > 0 ? Math.round((workMinutes / grossMinutes) * 100) : 0;
            
            logsHTML += `
                <tr>
                    <td>${enterDate.toLocaleTimeString('fa-IR')}</td>
                    <td>${exitDate ? exitDate.toLocaleTimeString('fa-IR') : '<span class="text-muted">نامشخص</span>'}</td>
                    <td>${exitDate ? grossMinutes + ' دقیقه' : '<span class="text-muted">-</span>'}</td>
                    <td>${exitDate ? formatTime(workMinutes) : '<span class="text-muted">-</span>'}</td>
                    <td><span class="badge bg-danger">${msToMinutes(deductions)} دقیقه</span></td>
                    <td>${exitDate ? '<span class="badge ' + (efficiency >= 80 ? 'bg-success' : efficiency >= 60 ? 'bg-warning' : 'bg-danger') + '">' + efficiency + '%</span>' : '<span class="text-muted">-</span>'}</td>
                </tr>
            `;
        });

        const dateString = startOfDay.toLocaleDateString('fa-IR');

        res.send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>گزارش روزانه - ${user.username}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { background: #f8f9fa; padding: 20px; }
                    .user-header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                    .card { background: white; border-radius: 15px; border: none; box-shadow: 0 5px 15px rgba(0,0,0,0.08); margin-bottom: 20px; }
                    .day-stats { background: #e9ecef; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="user-header">
                        <h2>گزارش روزانه: ${user.username}</h2>
                        <p class="mb-0">تاریخ: ${dateString}</p>
                        <a href="/admin/user/${userId}/month" class="btn btn-light mt-2">بازگشت به گزارش ماهانه</a>
                    </div>

                    <div class="day-stats">
                        <div class="row text-center">
                            <div class="col-md-3">
                                <h5>${logs.length}</h5>
                                <p>تعداد لاگ</p>
                            </div>
                            <div class="col-md-3">
                                <h5>${formatTime(dayWorkMinutes)}</h5>
                                <p>زمان مفید</p>
                            </div>
                            <div class="col-md-3">
                                <h5>${msToMinutes(dayDeductions)}</h5>
                                <p>کسورات</p>
                            </div>
                            <div class="col-md-3">
                                <h5>${logs.filter(log => log.exitTime).length}</h5>
                                <p>ورود/خروج کامل</p>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-body">
                            <h5>جزییات ترددها</h5>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ساعت ورود</th>
                                            <th>ساعت خروج</th>
                                            <th>زمان کل</th>
                                            <th>زمان مفید</th>
                                            <th>کسورات</th>
                                            <th>کارایی</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${logsHTML}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send('خطا در بارگذاری گزارش روزانه: ' + error.message);
    }
});

// ایجاد کاربر جدید
router.post('/create-user', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.send(`
                <script>
                    alert('این نام کاربری قبلاً استفاده شده است');
                    window.location.href = '/admin';
                </script>
            `);
        }

        await User.create({ username, password });
        res.send(`
            <script>
                alert('کاربر "${username}" با موفقیت ایجاد شد');
                window.location.href = '/admin';
            </script>
        `);
    } catch (error) {
        res.send(`
            <script>
                alert('خطا در ایجاد کاربر: ${error.message}');
                window.location.href = '/admin';
            </script>
        `);
    }
});

// حذف کاربر
router.delete('/delete-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.destroy({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;