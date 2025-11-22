// إعداد Supabase لمشروع رحلة نفيس - النسخة المحسنة
const SUPABASE_URL = 'https://npeclyiitjxznhgclfhxe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZWNseWl0anh6bmhnY2xmaHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUzNjksImV4cCI6MjA3Njc0MTM2OX0.Xan7k9rJuzny0AE2Fq7ZCq4S9rsnHmp3T1QcLqbJ2Yc';

// إنشاء عميل Supabase مع إعدادات محسنة
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// دالة محسنة للتحقق من اتصال Supabase
async function checkSupabaseConnection() {
    try {
        console.log('🔍 جاري التحقق من اتصال Supabase...');
        console.log('URL:', SUPABASE_URL);
        
        // محاولة بسيطة للاتصال
        const { data, error } = await supabaseClient
            .from('questions')
            .select('count')
            .limit(1)
            .single();
        
        if (error) {
            console.error('❌ خطأ في الاتصال:', error);
            
            // محاولة بديلة للتحقق من الاتصال
            const pingResponse = await fetch(SUPABASE_URL + '/rest/v1/', {
                method: 'HEAD',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });
            
            if (pingResponse.ok) {
                console.log('✅ الاتصال يعمل ولكن الجداول غير موجودة');
                return true;
            } else {
                console.log('❌ فشل الاتصال تماماً');
                return false;
            }
        }
        
        console.log('✅ اتصال Supabase ناجح');
        return true;
    } catch (error) {
        console.error('❌ خطأ في التحقق من الاتصال:', error);
        return false;
    }
}

// دالة لإنشاء الجداول تلقائياً إذا لم تكن موجودة
async function initializeSupabaseTables() {
    try {
        console.log('🔄 جاري التحقق من الجداول...');
        
        // التحقق من جدول الأسئلة
        const { error: questionsError } = await supabaseClient
            .from('questions')
            .select('*')
            .limit(1);
            
        if (questionsError && questionsError.code === '42P01') {
            console.log('⚠️ جدول الأسئلة غير موجود، سيتم استخدام localStorage');
            return false;
        }
        
        // التحقق من جدول الطلاب
        const { error: studentsError } = await supabaseClient
            .from('students')
            .select('*')
            .limit(1);
            
        if (studentsError && studentsError.code === '42P01') {
            console.log('⚠️ جدول الطلاب غير موجود، سيتم استخدام localStorage');
            return false;
        }
        
        console.log('✅ جميع الجداول موجودة');
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في التحقق من الجداول:', error);
        return false;
    }
}

// دالة للتحقق من صحة المفاتيح
function validateSupabaseConfig() {
    if (!SUPABASE_URL || SUPABASE_URL === 'https://your-project.supabase.co') {
        console.error('❌ SUPABASE_URL غير صحيح');
        return false;
    }
    
    if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('your-anon-key')) {
        console.error('❌ SUPABASE_ANON_KEY غير صحيح');
        return false;
    }
    
    console.log('✅ تكوين Supabase صحيح');
    return true;
}

// التحقق من التكوين عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 بدء تهيئة Supabase...');
    
    if (!validateSupabaseConfig()) {
        console.log('⚠️ سيتم استخدام localStorage فقط');
        return;
    }
    
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
        const tablesExist = await initializeSupabaseTables();
        if (tablesExist) {
            console.log('🎉 Supabase جاهز للاستخدام');
        } else {
            console.log('💾 سيتم استخدام localStorage (الجداول غير موجودة)');
        }
    } else {
        console.log('💾 سيتم استخدام localStorage (لا يوجد اتصال)');
    }
});
