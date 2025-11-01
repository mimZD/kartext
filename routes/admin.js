require('dotenv').config();
const express = require('express');
const { User, TimeLog, LeaveRequest } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Validate environment variables
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('❌ SECURITY ERROR: Admin credentials not configured');
  console.error('   Please set in .env file:');
  console.error('   ADMIN_USERNAME=your_admin_username');
  console.error('   ADMIN_PASSWORD=your_secure_password');
  process.exit(1);
}

const ADMIN_CREDENTIALS = {
  username: ADMIN_USERNAME,
  password: ADMIN_PASSWORD
};

console.log('✅ Admin credentials loaded from environment variables');

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
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
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
                <h2 class="text-center mb-4">
                    <i class="bi bi-shield-lock"></i><br>
                    ورود به پنل مدیریت
                </h2>
                <form action="/admin/login" method="POST">
                    <div class="mb-3">
                        <label class="form-label">نام کاربری ادمین</label>
                        <input type="text" class="form-control" name="username" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">رمز عبور ادمین</label>
                        <input type="password" class="form-control" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="bi bi-box-arrow-in-right"></i> ورود به پنل
                    </button>
                </form>
            </div>
        </body>
        </html>
    `);
});


// Login POST
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            req.session.isAdmin = true;
            req.session.username = 'admin';
            res.redirect('/admin');
        } else {
            res.send('<script>alert("نام کاربری یا رمز عبور اشتباه است"); location.href="/admin/login";</script>');
        }
    } catch (error) {
        res.status(500).send('خطا در سرور');
    }
});


// Header template
function getHeader(currentPath = '/admin') {
    return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container">
                <a class="navbar-brand" href="/admin">
                    <i class="bi bi-speedometer2"></i> Kartext Admin
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <a class="nav-link ${currentPath === '/admin' ? 'active' : ''}" href="/admin">
                                <i class="bi bi-house"></i> گزارش امروز
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${currentPath === '/admin/monthly' ? 'active' : ''}" href="/admin/monthly">
                                <i class="bi bi-calendar-month"></i> گزارش ماهانه
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${currentPath === '/admin/users' ? 'active' : ''}" href="/admin/users">
                                <i class="bi bi-people"></i> مدیریت کاربران
                            </a>
                        </li>
                    </ul>
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <form action="/admin/logout" method="POST">
                                <button type="submit" class="btn btn-outline-light btn-sm">
                                    <i class="bi bi-box-arrow-right"></i> خروج
                                </button>
                            </form>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;
}


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

// صفحه اصلی - گزارش امروز
router.get('/', requireAuth, async (req, res) => {
    try {
        // تاریخ امروز
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // گرفتن همه کاربران
        const users = await User.findAll();
        
        let usersHTML = '';
        let onlineCount = 0;

        for (let user of users) {
            // لاگ‌های امروز کاربر
            const todayLogs = await TimeLog.findAll({
                where: {
                    userId: user.id,
                    enterTime: {
                        [Op.between]: [today.getTime(), tomorrow.getTime()]
                    }
                },
                order: [['enterTime', 'DESC']]
            });

            // وضعیت کاربر
            const lastLog = todayLogs[0];
            let status = 'آفلاین';
            let statusClass = 'secondary';
            let currentSession = null;

            if (lastLog && !lastLog.exitTime) {
                status = '🟢 آنلاین';
                statusClass = 'success';
                onlineCount++;
                currentSession = lastLog;
            } else if (todayLogs.length > 0) {
                status = '⏸️ امروز کار کرده';
                statusClass = 'info';
            }

            // محاسبه زمان کار امروز
            let todayWorkMinutes = 0;
            todayLogs.forEach(log => {
                if (log.exitTime) {
                    const workMs = log.exitTime - log.enterTime;
                    todayWorkMinutes += Math.floor(workMs / (1000 * 60));
                }
            });

            usersHTML += `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="card-title">
                                    <i class="bi bi-person-circle"></i> ${user.username}
                                </h5>
                                <span class="badge bg-${statusClass}">${status}</span>
                            </div>
                            
                            ${currentSession ? `
                                <p class="text-success">
                                    <i class="bi bi-clock"></i> 
                                    از ${new Date(currentSession.enterTime).toLocaleTimeString('fa-IR')}
                                </p>
                            ` : ''}
                            
                            <p class="card-text">
                                <small class="text-muted">
                                    <i class="bi bi-list-check"></i> 
                                    ${todayLogs.length} لاگ امروز
                                </small>
                                <br>
                                <small class="text-muted">
                                    <i class="bi bi-clock-history"></i> 
                                    ${Math.floor(todayWorkMinutes / 60)}:${(todayWorkMinutes % 60).toString().padStart(2, '0')} زمان کار
                                </small>
                            </p>
                        </div>
                        <div class="card-footer">
                            <a href="/admin/user/${user.id}/month" class="btn btn-outline-primary btn-sm">
                                <i class="bi bi-graph-up"></i> گزارش ماهانه
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }

        // آمار کلی
        const totalUsers = users.length;
        const totalLogsToday = await TimeLog.count({
            where: {
                enterTime: {
                    [Op.between]: [today.getTime(), tomorrow.getTime()]
                }
            }
        });

        res.send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>گزارش امروز - Kartext Admin</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
                <style>
                    body { background: #f8f9fa; }
                    .stats-card { border: none; border-radius: 15px; }
                    .online-dot { width: 10px; height: 10px; background: #28a745; border-radius: 50%; display: inline-block; }
                </style>
            </head>
            <body>
                ${getHeader('/admin')}
                
                <div class="container mt-4">
                    <!-- آمار کلی -->
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card stats-card bg-primary text-white">
                                <div class="card-body text-center">
                                    <h3>${totalUsers}</h3>
                                    <p>کل کاربران</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card stats-card bg-success text-white">
                                <div class="card-body text-center">
                                    <h3>${onlineCount}</h3>
                                    <p>کاربران آنلاین</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card stats-card bg-info text-white">
                                <div class="card-body text-center">
                                    <h3>${totalLogsToday}</h3>
                                    <p>لاگ‌های امروز</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- لیست کاربران -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-people-fill"></i>
                                وضعیت کاربران - امروز (${new Date().toLocaleDateString('fa-IR')})
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${usersHTML || '<div class="col-12 text-center text-muted py-4">هیچ کاربری یافت نشد</div>'}
                            </div>
                        </div>
                    </div>
                </div>

                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Error in admin dashboard:', error);
        res.status(500).send('خطا در بارگذاری اطلاعات: ' + error.message);
    }
});

// گزارش ماهانه
router.get('/monthly', requireAuth, async (req, res) => {
    try {
        const months = [];
        const currentDate = new Date();
        
        // تولید لیست ۱۲ ماه گذشته
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            months.push({
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                name: date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })
            });
        }

        const monthsHTML = months.map(m => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <div class="card-body text-center">
                        <h5>${m.name}</h5>
                        <a href="/admin/monthly/${m.year}/${m.month}" class="btn btn-primary mt-2">
                            <i class="bi bi-graph-up"></i> مشاهده گزارش
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        res.send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>گزارش ماهانه - Kartext Admin</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
            </head>
            <body>
                ${getHeader('/admin/monthly')}
                
                <div class="container mt-4">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title mb-0">
                                <i class="bi bi-calendar-month"></i>
                                انتخاب ماه برای مشاهده گزارش
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${monthsHTML}
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        res.status(500).send('خطا: ' + error.message);
    }
});

// مدیریت کاربران
router.get('/users', requireAuth, async (req, res) => {
    try {
        const users = await User.findAll({ order: [['id', 'DESC']] });

        const usersHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>
                    <i class="bi bi-person-circle"></i>
                    <strong>${user.username}</strong>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString('fa-IR')}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <a href="/admin/user/${user.id}/month" class="btn btn-outline-info">
                            <i class="bi bi-graph-up"></i> گزارش
                        </a>
                        <button class="btn btn-outline-danger" onclick="deleteUser(${user.id}, '${user.username}')">
                            <i class="bi bi-trash"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        res.send(`
            <!DOCTYPE html>
            <html dir="rtl" lang="fa">
            <head>
                <meta charset="UTF-8">""
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>مدیریت کاربران - Kartext Admin</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css" rel="stylesheet">
            </head>
            <body>
                ${getHeader('/admin/users')}
                
                <div class="container mt-4">
                    <!-- فرم ایجاد کاربر -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-person-plus"></i>
                                ایجاد کاربر جدید
                            </h5>
                        </div>
                        <div class="card-body">
                            <form action="/admin/create-user" method="POST" class="row g-3">
                                <div class="col-md-4">
                                    <input type="text" name="username" class="form-control" placeholder="نام کاربری" required>
                                </div>
                                <div class="col-md-4">
                                    <input type="password" name="password" class="form-control" placeholder="رمز عبور" required>
                                </div>
                                <div class="col-md-4">
                                    <button type="submit" class="btn btn-primary w-100">
                                        <i class="bi bi-plus-circle"></i> ایجاد کاربر
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- لیست کاربران -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="bi bi-people"></i>
                                لیست کاربران
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>نام کاربری</th>
                                            <th>تاریخ ایجاد</th>
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
        res.status(500).send('خطا: ' + error.message);
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


// GET /admin/leaves - نمایش لیست مرخصی‌ها
router.get('/leaves', async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.redirect('/admin/login');
        }

        const leaves = await LeaveRequest.findAll({
            include: [{
                model: User,
                attributes: ['username', 'id']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.render('admin/leaves', {
            user: req.session.user,
            leaves: leaves,
            currentPath: '/admin/leaves'
        });

    } catch (error) {
        console.error('Error fetching leaves:', error);
        res.status(500).render('admin/error', {
            error: 'خطا در بارگذاری لیست مرخصی‌ها'
        });
    }
});

// POST /admin/leaves/:id/approve - تایید مرخصی
router.post('/leaves/:id/approve', async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.redirect('/admin/login');
        }

        const { id } = req.params;
        const leave = await LeaveRequest.findByPk(id);
        
        if (!leave) {
            return res.status(404).json({ error: 'درخواست مرخصی پیدا نشد' });
        }
        
        leave.status = 'APPROVED';
        await leave.save();
        
        res.json({
            success: true,
            message: 'درخواست مرخصی تایید شد'
        });
        
    } catch (error) {
        console.error('Error approving leave:', error);
        res.status(500).json({ error: 'خطا در تایید مرخصی' });
    }
});

// POST /admin/leaves/:id/reject - رد مرخصی
router.post('/leaves/:id/reject', async (req, res) => {
    try {
        if (!req.session.user || !req.session.user.isAdmin) {
            return res.redirect('/admin/login');
        }

        const { id } = req.params;
        const leave = await LeaveRequest.findByPk(id);
        
        if (!leave) {
            return res.status(404).json({ error: 'درخواست مرخصی پیدا نشد' });
        }
        
        leave.status = 'REJECTED';
        await leave.save();
        
        res.json({
            success: true,
            message: 'درخواست مرخصی رد شد'
        });
        
    } catch (error) {
        console.error('Error rejecting leave:', error);
        res.status(500).json({ error: 'خطا در رد مرخصی' });
    }
});
module.exports = router;