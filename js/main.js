// الدوال العامة والمشتركة بين الصفحات مع دعم Supabase

// دالة لتحميل البيانات من localStorage
function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return defaultValue;
    }
}

// دالة لحفظ البيانات في localStorage
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

// دالة لعرض رسائل التنبيه بشكل أفضل
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    alertDiv.style.backgroundColor = colors[type] || colors.info;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// دالة لتنسيق الوقت
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// دالة للتحقق من صحة رابط YouTube
function isValidYouTubeUrl(url) {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    return pattern.test(url);
}

// دالة للتحقق من صحة رابط الصورة
function isValidImageUrl(url) {
    const pattern = /^(https?:\/\/).+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    return pattern.test(url);
}

// دالة لإنشاء معرف فريد
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// دالة لتنظيف المدخلات من الأحرف الضارة
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// دالة للتحقق من اتصال الإنترنت
function checkInternetConnection() {
    return navigator.onLine;
}

// دالة لعرض مؤشر تحميل
function showLoading() {
    let loadingDiv = document.getElementById('loading-indicator');
    
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-indicator';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">جاري التحميل...</p>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(loadingDiv);
    }
    
    loadingDiv.style.display = 'flex';
}

// دالة لإخفاء مؤشر تحميل
function hideLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// دالة للتحقق من دعم localStorage
function isLocalStorageSupported() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// دالة للتحقق من اتصال Supabase
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient.from('questions').select('*').limit(1);
        return !error;
    } catch (error) {
        console.error('Supabase connection error:', error);
        return false;
    }
}

// دالة لمزامنة البيانات من localStorage إلى Supabase
async function syncLocalStorageToSupabase() {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
        console.log('⚠️ No Supabase connection, skipping sync');
        return;
    }

    console.log('🔄 Starting data sync to Supabase...');

    // مزامنة الأسئلة
    const localQuestions = JSON.parse(localStorage.getItem('questions')) || [];
    if (localQuestions.length > 0) {
        try {
            console.log(`📚 Syncing ${localQuestions.length} questions...`);
            
            // حذف الأسئلة القديمة أولاً
            const { error: deleteError } = await supabaseClient
                .from('questions')
                .delete()
                .neq('id', 0);
            
            if (deleteError) throw deleteError;
            
            // إضافة الأسئلة الجديدة
            const { error: insertError } = await supabaseClient
                .from('questions')
                .insert(localQuestions);
            
            if (insertError) throw insertError;
            
            localStorage.removeItem('questions');
            console.log('✅ Questions synced successfully');
        } catch (error) {
            console.error('❌ Error syncing questions:', error);
        }
    }

    // مزامنة الطلاب
    const localStudents = JSON.parse(localStorage.getItem('students')) || [];
    if (localStudents.length > 0) {
        try {
            console.log(`👥 Syncing ${localStudents.length} students...`);
            
            const { error: deleteError } = await supabaseClient
                .from('students')
                .delete()
                .neq('id', 0);
            
            if (deleteError) throw deleteError;
            
            const { error: insertError } = await supabaseClient
                .from('students')
                .insert(localStudents);
            
            if (insertError) throw insertError;
            
            localStorage.removeItem('students');
            console.log('✅ Students synced successfully');
        } catch (error) {
            console.error('❌ Error syncing students:', error);
        }
    }

    // مزامنة الطلاب المصرح لهم
    const localAuthorized = JSON.parse(localStorage.getItem('authorizedStudents')) || [];
    if (localAuthorized.length > 0) {
        try {
            console.log(`🔐 Syncing ${localAuthorized.length} authorized students...`);
            
            const { error: deleteError } = await supabaseClient
                .from('authorized_students')
                .delete()
                .neq('id', '');
            
            if (deleteError) throw deleteError;
            
            const { error: insertError } = await supabaseClient
                .from('authorized_students')
                .insert(localAuthorized);
            
            if (insertError) throw insertError;
            
            localStorage.removeItem('authorizedStudents');
            console.log('✅ Authorized students synced successfully');
        } catch (error) {
            console.error('❌ Error syncing authorized students:', error);
        }
    }

    // مزامنة الإعدادات
    const localSettings = JSON.parse(localStorage.getItem('settings'));
    if (localSettings) {
        try {
            console.log('⚙️ Syncing settings...');
            
            const { error } = await supabaseClient
                .from('settings')
                .upsert(localSettings);
            
            if (error) throw error;
            
            localStorage.removeItem('settings');
            console.log('✅ Settings synced successfully');
        } catch (error) {
            console.error('❌ Error syncing settings:', error);
        }
    }

    console.log('🎉 Data sync completed');
}

// دالة لتحميل البيانات من Supabase مع fallback لـ localStorage
async function loadDataWithFallback(tableName, localStorageKey) {
    try {
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*');
        
        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error(`Error loading ${tableName} from Supabase:`, error);
        return JSON.parse(localStorage.getItem(localStorageKey)) || [];
    }
}

// دالة لحفظ البيانات في Supabase مع fallback لـ localStorage
async function saveDataWithFallback(tableName, localStorageKey, data, isArray = true) {
    try {
        if (isArray && data.length > 0) {
            // حذف القديم وإضافة الجديد للمصفوفات
            const { error: deleteError } = await supabaseClient
                .from(tableName)
                .delete()
                .neq('id', 0);
            
            if (deleteError) throw deleteError;
            
            const { error: insertError } = await supabaseClient
                .from(tableName)
                .insert(data);
            
            if (insertError) throw insertError;
        } else if (!isArray) {
            // تحديث للسجل المفرد
            const { error } = await supabaseClient
                .from(tableName)
                .upsert(data);
            
            if (error) throw error;
        }
        
        return true;
    } catch (error) {
        console.error(`Error saving to Supabase, using localStorage for ${tableName}:`, error);
        localStorage.setItem(localStorageKey, JSON.stringify(data));
        return false;
    }
}

// دالة لتهيئة التطبيق
async function initializeApp() {
    if (!isLocalStorageSupported()) {
        alert('المتصفح لا يدعم التخزين المحلي. قد لا تعمل بعض الميزات بشكل صحيح.');
        return false;
    }
    
    // تنظيف الجلسات المنتهية
    cleanupExpiredSessions();
    
    // التحقق من اتصال Supabase
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
        console.log('✅ Connected to Supabase');
    } else {
        console.log('⚠️ Using localStorage as primary storage');
    }
    
    return true;
}

// تنظيف الجلسات المنتهية
function cleanupExpiredSessions() {
    const loginTime = localStorage.getItem('adminLoginTime');
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const currentDate = new Date();
        const hoursDiff = (currentDate - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
        }
    }
}

// دالة لتحميل صورة وتحويلها إلى base64
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// دالة للتحقق من حجم الملف
function checkFileSize(file, maxSizeMB = 5) {
    const maxSize = maxSizeMB * 1024 * 1024; // تحويل إلى bytes
    return file.size <= maxSize;
}

// دالة لعرض تأكيد مخصص
function showConfirmation(message, confirmText = 'نعم', cancelText = 'لا') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; max-width: 400px;">
                <p style="margin-bottom: 20px; font-size: 16px;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="confirm-btn" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">${confirmText}</button>
                    <button id="cancel-btn" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">${cancelText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('confirm-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(true);
        });
        
        document.getElementById('cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
        });
    });
}

// دالة لتنسيق الأرقام العربية
function formatArabicNumber(number) {
    return new Intl.NumberFormat('ar-SA').format(number);
}

// دالة للحصول على التاريخ والوقت الحالي
function getCurrentDateTime() {
    const now = new Date();
    return {
        date: now.toLocaleDateString('ar-SA'),
        time: now.toLocaleTimeString('ar-SA'),
        timestamp: now.getTime()
    };
}

// دالة لإضافة تأثيرات بصرية
function addVisualEffect(element, effect = 'pulse') {
    element.style.transition = 'all 0.3s ease';
    
    switch (effect) {
        case 'pulse':
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
            break;
        case 'shake':
            element.style.animation = 'shake 0.5s';
            setTimeout(() => {
                element.style.animation = '';
            }, 500);
            break;
        case 'highlight':
            const originalColor = element.style.backgroundColor;
            element.style.backgroundColor = '#ffffcc';
            setTimeout(() => {
                element.style.backgroundColor = originalColor;
            }, 1000);
            break;
    }
}

// إضافة أنيميشن الاهتزاز
if (!document.querySelector('#animation-styles')) {
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

// تشغيل التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // محاولة المزامنة إذا كان هناك اتصال
    setTimeout(() => {
        syncLocalStorageToSupabase();
    }, 2000);
});

// جعل الدوال متاحة globally للاستخدام في الملفات الأخرى
window.loadFromStorage = loadFromStorage;
window.saveToStorage = saveToStorage;
window.showAlert = showAlert;
window.formatTime = formatTime;
window.isValidYouTubeUrl = isValidYouTubeUrl;
window.isValidImageUrl = isValidImageUrl;
window.generateId = generateId;
window.sanitizeInput = sanitizeInput;
window.checkInternetConnection = checkInternetConnection;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.isLocalStorageSupported = isLocalStorageSupported;
window.checkSupabaseConnection = checkSupabaseConnection;
window.syncLocalStorageToSupabase = syncLocalStorageToSupabase;
window.loadDataWithFallback = loadDataWithFallback;
window.saveDataWithFallback = saveDataWithFallback;
window.imageToBase64 = imageToBase64;
window.checkFileSize = checkFileSize;
window.showConfirmation = showConfirmation;
window.formatArabicNumber = formatArabicNumber;
window.getCurrentDateTime = getCurrentDateTime;
window.addVisualEffect = addVisualEffect;
