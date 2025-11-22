// نظام المصادقة وإدارة الجلسات مع Supabase

async function loginAdmin(username, password) {
    if (username === 'عاصم البيشي' && password === '0509894176') {
        try {
            // حفظ في localStorage للجلسة المحلية
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminLoginTime', new Date().toISOString());
            
            // التحقق من اتصال Supabase
            const isConnected = await checkSupabaseConnection();
            if (isConnected) {
                console.log('✅ Supabase connection successful');
            } else {
                console.log('⚠️ Using localStorage as fallback');
            }
            
            return true;
        } catch (error) {
            console.log('Supabase auth not configured, using local storage only');
            return true;
        }
    }
    return false;
}

function logoutAdmin() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
}

function isAdminLoggedIn() {
    const loggedIn = localStorage.getItem('adminLoggedIn');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (!loggedIn || !loginTime) {
        return false;
    }
    
    // التحقق من انتهاء الجلسة (24 ساعة)
    const loginDate = new Date(loginTime);
    const currentDate = new Date();
    const hoursDiff = (currentDate - loginDate) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
        logoutAdmin();
        return false;
    }
    
    return true;
}

function getAdminSessionTime() {
    const loginTime = localStorage.getItem('adminLoginTime');
    if (!loginTime) return '0:00';
    
    const loginDate = new Date(loginTime);
    const currentDate = new Date();
    const diffMs = currentDate - loginDate;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}
