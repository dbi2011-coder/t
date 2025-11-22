// تكوين Supabase - المفاتيح الخاصة بك
const SUPABASE_URL = 'https://npeclyitjxznhgclfhxe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZWNseWl0anh6bmhnY2xmaHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUzNjksImV4cCI6MjA3Njc0MTM2OX0.Xan7k9rJuzny0AE2Fq7ZCq4S9rsnHmp3T1QcLqbJ2Yc';

// تهيئة عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// دوال للتعامل مع Supabase
class SupabaseService {
    
    // === إدارة الأسئلة ===
    
    // جلب جميع الأسئلة
    async getQuestions() {
        try {
            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching questions:', error);
            // العودة للتخزين المحلي في حالة الخطأ
            return JSON.parse(localStorage.getItem('questions')) || [];
        }
    }
    
    // إضافة سؤال جديد
    async addQuestion(question) {
        try {
            const { data, error } = await supabase
                .from('questions')
                .insert([{
                    question_data: question,
                    question_type: question.type,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Error adding question:', error);
            throw error;
        }
    }
    
    // حذف سؤال
    async deleteQuestion(questionId) {
        try {
            const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', questionId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting question:', error);
            throw error;
        }
    }
    
    // === إدارة الطلاب والنتائج ===
    
    // جلب جميع نتائج الطلاب
    async getStudentsResults() {
        try {
            const { data, error } = await supabase
                .from('student_results')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching student results:', error);
            return JSON.parse(localStorage.getItem('students')) || [];
        }
    }
    
    // إضافة نتيجة طالب
    async addStudentResult(studentData) {
        try {
            const { data, error } = await supabase
                .from('student_results')
                .insert([{
                    name: studentData.name,
                    score: studentData.score,
                    total: studentData.total,
                    percentage: studentData.percentage,
                    time_taken: studentData.timeTaken,
                    date: studentData.date,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Error adding student result:', error);
            throw error;
        }
    }
    
    // حذف نتائج طلاب
    async deleteStudentResults(studentIds = []) {
        try {
            let query = supabase.from('student_results');
            
            if (studentIds.length > 0) {
                query = query.in('id', studentIds);
            }
            
            const { error } = await query.delete();
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting student results:', error);
            throw error;
        }
    }
    
    // === إدارة الطلاب المصرح لهم ===
    
    // جلب الطلاب المصرح لهم
    async getAuthorizedStudents() {
        try {
            const { data, error } = await supabase
                .from('authorized_students')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching authorized students:', error);
            return JSON.parse(localStorage.getItem('authorizedStudents')) || [];
        }
    }
    
    // إضافة طالب مصرح له
    async addAuthorizedStudent(studentData) {
        try {
            const { data, error } = await supabase
                .from('authorized_students')
                .insert([{
                    student_id: studentData.id,
                    name: studentData.name,
                    used_attempts: studentData.usedAttempts || 0,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Error adding authorized student:', error);
            throw error;
        }
    }
    
    // تحديث عدد المحاولات المستخدمة
    async updateStudentAttempts(studentId, usedAttempts) {
        try {
            const { error } = await supabase
                .from('authorized_students')
                .update({ used_attempts: usedAttempts })
                .eq('student_id', studentId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error updating student attempts:', error);
            throw error;
        }
    }
    
    // حذف طالب مصرح له
    async deleteAuthorizedStudent(studentId) {
        try {
            const { error } = await supabase
                .from('authorized_students')
                .delete()
                .eq('id', studentId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting authorized student:', error);
            throw error;
        }
    }
    
    // === الإعدادات ===
    
    // حفظ الإعدادات
    async saveSettings(settings) {
        try {
            const { data, error } = await supabase
                .from('settings')
                .upsert([{
                    id: 1,
                    questions_count: settings.questionsCount,
                    login_type: settings.loginType,
                    attempts_count: settings.attemptsCount,
                    results_display: settings.resultsDisplay,
                    updated_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }
    
    // جلب الإعدادات
    async getSettings() {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                return {
                    questionsCount: data.questions_count,
                    loginType: data.login_type,
                    attemptsCount: data.attempts_count,
                    resultsDisplay: data.results_display
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching settings:', error);
            return null;
        }
    }
}

// إنشاء نسخة من الخدمة
const supabaseService = new SupabaseService();

// دالة للتحقق من اتصال Supabase
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('questions').select('count').limit(1);
        return !error;
    } catch (error) {
        console.error('Supabase connection error:', error);
        return false;
    }
}

// دالة للتبديل بين التخزين المحلي والسحابي
async function syncLocalToCloud() {
    showLoading();
    
    try {
        if (!await checkSupabaseConnection()) {
            hideLoading();
            alert('لا يوجد اتصال مع السحابة. تأكد من اتصال الإنترنت وإعدادات Supabase.');
            return false;
        }
        
        // مزامنة الأسئلة من المحلي إلى السحابة
        const localQuestions = JSON.parse(localStorage.getItem('questions')) || [];
        let syncedQuestions = 0;
        
        for (const question of localQuestions) {
            if (!question.supabase_id) {
                try {
                    await supabaseService.addQuestion(question);
                    syncedQuestions++;
                } catch (error) {
                    console.error('Error syncing question:', error);
                }
            }
        }
        
        // مزامنة نتائج الطلاب
        const localStudents = JSON.parse(localStorage.getItem('students')) || [];
        let syncedStudents = 0;
        
        for (const student of localStudents) {
            try {
                await supabaseService.addStudentResult(student);
                syncedStudents++;
            } catch (error) {
                console.error('Error syncing student:', error);
            }
        }
        
        // مزامنة الطلاب المصرح لهم
        const localAuthStudents = JSON.parse(localStorage.getItem('authorizedStudents')) || [];
        let syncedAuthStudents = 0;
        
        for (const student of localAuthStudents) {
            try {
                await supabaseService.addAuthorizedStudent(student);
                syncedAuthStudents++;
            } catch (error) {
                console.error('Error syncing authorized student:', error);
            }
        }
        
        // مزامنة الإعدادات
        const localSettings = JSON.parse(localStorage.getItem('settings'));
        if (localSettings) {
            await supabaseService.saveSettings(localSettings);
        }
        
        hideLoading();
        
        alert(`تمت المزامنة بنجاح:
        - ${syncedQuestions} سؤال
        - ${syncedStudents} نتيجة طالب
        - ${syncedAuthStudents} طالب مصرح له`);
        
        return true;
    } catch (error) {
        hideLoading();
        console.error('Sync failed:', error);
        alert('فشلت المزامنة. تأكد من اتصال الإنترنت وإعدادات Supabase.');
        return false;
    }
}

// دوال مساعدة للتحميل
function showLoading() {
    let loadingDiv = document.getElementById('sync-loading');
    
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'sync-loading';
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
            <div style="text-align: center; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.3)">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto;"></div>
                <p style="margin-top: 10px;">جاري مزامنة البيانات مع السحابة...</p>
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

function hideLoading() {
    const loadingDiv = document.getElementById('sync-loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}
